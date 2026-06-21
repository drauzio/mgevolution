const { getPool, sql } = require('../database/connection')

async function listar({ idAluno } = {}) {
  const pool = await getPool()
  const req = pool.request()
  let where = 'WHERE 1=1'
  if (idAluno) { req.input('idAluno', sql.Int, idAluno); where += ' AND p.id_usuario = @idAluno' }

  const result = await req.query(`
    SELECT
      p.id_protocolo,
      p.id_template_origem,
      p.nome,
      p.objetivo,
      p.data_inicio,
      p.data_fim,
      p.ativo,
      p.data_criacao,
      a.nome  AS aluno_nome,
      a.email AS aluno_email,
      t.nome  AS template_nome,
      (SELECT COUNT(*) FROM dbo.treino_dia td
       WHERE td.id_protocolo = p.id_protocolo AND td.descanso = 0) AS dias_treino
    FROM dbo.treino_protocolo p
    LEFT JOIN dbo.usuario a ON a.id_usuario = p.id_usuario
    LEFT JOIN dbo.treino_protocolo_template t ON t.id_template = p.id_template_origem
    ${where}
    ORDER BY p.ativo DESC, p.data_criacao DESC
  `)
  return result.recordset
}

async function buscar(id) {
  const pool = await getPool()

  const proto = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT p.*, a.nome AS aluno_nome, a.email AS aluno_email, t.nome AS template_nome
      FROM dbo.treino_protocolo p
      LEFT JOIN dbo.usuario a ON a.id_usuario = p.id_usuario
      LEFT JOIN dbo.treino_protocolo_template t ON t.id_template = p.id_template_origem
      WHERE p.id_protocolo = @id
    `)

  if (!proto.recordset.length) return null

  const dias = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT id_treino_dia, dia_semana, nome, descanso, ordem
      FROM dbo.treino_dia WHERE id_protocolo = @id ORDER BY dia_semana
    `)

  const exercicios = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT tde.*, e.nome AS exercicio_nome, e.grupo_muscular, e.equipamento, e.video_url
      FROM dbo.treino_dia_exercicio tde
      JOIN dbo.treino_dia td ON td.id_treino_dia = tde.id_treino_dia
      JOIN dbo.exercicio  e  ON e.id_exercicio   = tde.id_exercicio
      WHERE td.id_protocolo = @id
      ORDER BY tde.id_treino_dia, tde.ordem
    `)

  return {
    ...proto.recordset[0],
    dias: dias.recordset.map(d => ({
      ...d,
      exercicios: exercicios.recordset.filter(e => e.id_treino_dia === d.id_treino_dia),
    })),
  }
}

async function criar(dados, idPersonal) {
  const pool = await getPool()
  const { nome, objetivo, observacoes, data_inicio, data_fim, id_usuario, id_template_origem, dias } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',         sql.Int,         id_usuario)
      .input('id_personal',        sql.Int,         idPersonal || null)
      .input('id_template_origem', sql.Int,         id_template_origem || null)
      .input('nome',               sql.VarChar(120), nome)
      .input('objetivo',           sql.VarChar(200), objetivo || null)
      .input('observacoes',        sql.VarChar(500), observacoes || null)
      .input('data_inicio',        sql.Date,         data_inicio || null)
      .input('data_fim',           sql.Date,         data_fim || null)
      .query(`
        INSERT INTO dbo.treino_protocolo
          (id_usuario, id_personal, id_template_origem, nome, objetivo, observacoes, data_inicio, data_fim)
        OUTPUT INSERTED.id_protocolo
        VALUES
          (@id_usuario, @id_personal, @id_template_origem, @nome, @objetivo, @observacoes, @data_inicio, @data_fim)
      `)

    const id = r1.recordset[0].id_protocolo
    await _inserirDias(tx, id, dias || [])
    await tx.commit()
    return { id_protocolo: id }
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(id, dados) {
  const pool = await getPool()
  const { nome, objetivo, observacoes, data_inicio, data_fim, ativo, dias } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',          sql.Int,         id)
      .input('nome',        sql.VarChar(120), nome)
      .input('objetivo',    sql.VarChar(200), objetivo || null)
      .input('observacoes', sql.VarChar(500), observacoes || null)
      .input('data_inicio', sql.Date,         data_inicio || null)
      .input('data_fim',    sql.Date,         data_fim || null)
      .input('ativo',       sql.Bit,          ativo !== undefined ? ativo : 1)
      .query(`
        UPDATE dbo.treino_protocolo SET
          nome = @nome, objetivo = @objetivo, observacoes = @observacoes,
          data_inicio = @data_inicio, data_fim = @data_fim, ativo = @ativo,
          data_atualizacao = SYSUTCDATETIME()
        WHERE id_protocolo = @id
      `)

    if (dias) {
      const existing = await tx.request()
        .input('id', sql.Int, id)
        .query(`SELECT id_treino_dia FROM dbo.treino_dia WHERE id_protocolo = @id`)

      const ids = existing.recordset.map(r => r.id_treino_dia)
      if (ids.length) {
        await tx.request().query(`DELETE FROM dbo.treino_dia_exercicio WHERE id_treino_dia IN (${ids.join(',')})`)
        await tx.request().input('id', sql.Int, id).query(`DELETE FROM dbo.treino_dia WHERE id_protocolo = @id`)
      }
      await _inserirDias(tx, id, dias)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

async function buscarAtivo(idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id_usuario', sql.Int, idUsuario)
    .query(`
      SELECT TOP 1 id_protocolo FROM dbo.treino_protocolo
      WHERE id_usuario = @id_usuario AND ativo = 1
      ORDER BY data_criacao DESC
    `)
  if (!r.recordset[0]) return null
  return buscar(r.recordset[0].id_protocolo)
}

async function buscarExercicios(busca, grupo) {
  const pool = await getPool()
  const req = pool.request()
  let where = 'WHERE e.ativo = 1'
  if (busca) { req.input('busca', sql.VarChar(100), `%${busca}%`); where += ' AND e.nome LIKE @busca' }
  if (grupo) { req.input('grupo', sql.VarChar(60),  grupo);        where += ' AND e.grupo_muscular = @grupo' }

  const result = await req.query(`
    SELECT id_exercicio, nome, grupo_muscular, equipamento
    FROM dbo.exercicio e ${where}
    ORDER BY e.grupo_muscular, e.nome
  `)
  return result.recordset
}

async function _inserirDias(tx, id, dias) {
  for (const dia of dias) {
    const r = await tx.request()
      .input('id_protocolo', sql.Int,        id)
      .input('dia_semana',   sql.TinyInt,    dia.dia_semana)
      .input('nome',         sql.VarChar(80), dia.nome || '')
      .input('descanso',     sql.Bit,         dia.descanso ? 1 : 0)
      .input('ordem',        sql.TinyInt,    dia.dia_semana)
      .query(`
        INSERT INTO dbo.treino_dia (id_protocolo, dia_semana, nome, descanso, ordem)
        OUTPUT INSERTED.id_treino_dia
        VALUES (@id_protocolo, @dia_semana, @nome, @descanso, @ordem)
      `)

    const idDia = r.recordset[0].id_treino_dia

    for (let i = 0; i < (dia.exercicios || []).length; i++) {
      const ex = dia.exercicios[i]
      await tx.request()
        .input('id_treino_dia',  sql.Int,         idDia)
        .input('id_exercicio',   sql.Int,         ex.id_exercicio)
        .input('series',         sql.TinyInt,     ex.series || 3)
        .input('repeticoes',     sql.VarChar(20),  ex.repeticoes || '12')
        .input('carga_sugerida', sql.VarChar(30),  ex.carga_sugerida || null)
        .input('descanso_seg',   sql.SmallInt,    ex.descanso_seg || null)
        .input('observacao',     sql.VarChar(300), ex.observacao || null)
        .input('ordem',          sql.TinyInt,     i + 1)
        .query(`
          INSERT INTO dbo.treino_dia_exercicio
            (id_treino_dia, id_exercicio, series, repeticoes, carga_sugerida, descanso_seg, observacao, ordem)
          VALUES
            (@id_treino_dia, @id_exercicio, @series, @repeticoes, @carga_sugerida, @descanso_seg, @observacao, @ordem)
        `)
    }
  }
}

module.exports = { listar, buscar, buscarAtivo, criar, atualizar, buscarExercicios }
