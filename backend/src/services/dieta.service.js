const { getPool, sql } = require('../database/connection')

async function listarPlanos(idAluno) {
  const pool = await getPool()
  const req = pool.request()
  let where = 'WHERE 1=1'
  if (idAluno) { req.input('idAluno', sql.Int, idAluno); where += ' AND p.id_usuario = @idAluno' }

  const result = await req.query(`
    SELECT
      p.id_plano, p.nome, p.objetivo, p.calorias_meta, p.proteina_meta,
      p.ativo, p.data_inicio, p.data_fim, p.data_criacao,
      u.nome  AS aluno_nome,
      u.email AS aluno_email,
      (SELECT COUNT(*) FROM dbo.dieta_refeicao r WHERE r.id_plano = p.id_plano) AS qtd_refeicoes
    FROM dbo.dieta_plano p
    JOIN dbo.usuario u ON u.id_usuario = p.id_usuario
    ${where}
    ORDER BY p.ativo DESC, p.data_criacao DESC
  `)
  return result.recordset
}

async function buscarCompleto(idPlano) {
  const pool = await getPool()

  const plano = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`
      SELECT p.*, u.nome AS aluno_nome, u.email AS aluno_email
      FROM dbo.dieta_plano p
      JOIN dbo.usuario u ON u.id_usuario = p.id_usuario
      WHERE p.id_plano = @id
    `)

  if (!plano.recordset.length) return null

  const refeicoes = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`SELECT * FROM dbo.dieta_refeicao WHERE id_plano = @id ORDER BY ordem, id_refeicao`)

  const itens = await pool.request()
    .input('id', sql.Int, idPlano)
    .query(`
      SELECT i.*
      FROM dbo.dieta_refeicao_item i
      JOIN dbo.dieta_refeicao r ON r.id_refeicao = i.id_refeicao
      WHERE r.id_plano = @id
      ORDER BY i.id_refeicao, i.ordem
    `)

  return {
    ...plano.recordset[0],
    refeicoes: refeicoes.recordset.map(r => ({
      ...r,
      itens: itens.recordset.filter(i => i.id_refeicao === r.id_refeicao),
    })),
  }
}

async function buscarPlanoAtivo(idUsuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id', sql.Int, idUsuario)
    .query(`SELECT TOP 1 id_plano FROM dbo.dieta_plano WHERE id_usuario = @id AND ativo = 1 ORDER BY data_criacao DESC`)
  if (!r.recordset[0]) return null
  return buscarCompleto(r.recordset[0].id_plano)
}

async function criar(dados, idPersonal) {
  const pool = await getPool()
  const { id_usuario, nome, objetivo, calorias_meta, proteina_meta, observacoes,
          data_inicio, data_fim, refeicoes = [] } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',    sql.Int,          id_usuario)
      .input('id_personal',   sql.Int,          idPersonal)
      .input('nome',          sql.VarChar(120),  nome)
      .input('objetivo',      sql.VarChar(200),  objetivo || null)
      .input('calorias_meta', sql.Int,           calorias_meta ? Number(calorias_meta) : null)
      .input('proteina_meta', sql.Int,           proteina_meta ? Number(proteina_meta) : null)
      .input('observacoes',   sql.VarChar(500),  observacoes || null)
      .input('data_inicio',   sql.Date,          data_inicio || null)
      .input('data_fim',      sql.Date,          data_fim || null)
      .query(`
        INSERT INTO dbo.dieta_plano
          (id_usuario, id_personal, nome, objetivo, calorias_meta, proteina_meta, observacoes, data_inicio, data_fim)
        OUTPUT INSERTED.id_plano
        VALUES (@id_usuario, @id_personal, @nome, @objetivo, @calorias_meta, @proteina_meta, @observacoes, @data_inicio, @data_fim)
      `)

    const idPlano = r1.recordset[0].id_plano
    await _inserirRefeicoes(tx, idPlano, refeicoes)
    await tx.commit()
    return { id_plano: idPlano }
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(idPlano, dados) {
  const pool = await getPool()
  const { nome, objetivo, calorias_meta, proteina_meta, observacoes,
          data_inicio, data_fim, ativo, refeicoes } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',            sql.Int,          idPlano)
      .input('nome',          sql.VarChar(120),  nome)
      .input('objetivo',      sql.VarChar(200),  objetivo || null)
      .input('calorias_meta', sql.Int,           calorias_meta ? Number(calorias_meta) : null)
      .input('proteina_meta', sql.Int,           proteina_meta ? Number(proteina_meta) : null)
      .input('observacoes',   sql.VarChar(500),  observacoes || null)
      .input('data_inicio',   sql.Date,          data_inicio || null)
      .input('data_fim',      sql.Date,          data_fim || null)
      .input('ativo',         sql.Bit,           ativo !== undefined ? ativo : 1)
      .query(`
        UPDATE dbo.dieta_plano SET
          nome = @nome, objetivo = @objetivo, calorias_meta = @calorias_meta,
          proteina_meta = @proteina_meta, observacoes = @observacoes,
          data_inicio = @data_inicio, data_fim = @data_fim, ativo = @ativo,
          data_atualizacao = SYSUTCDATETIME()
        WHERE id_plano = @id
      `)

    if (refeicoes) {
      const idsRef = await tx.request()
        .input('id', sql.Int, idPlano)
        .query(`SELECT id_refeicao FROM dbo.dieta_refeicao WHERE id_plano = @id`)

      const ids = idsRef.recordset.map(r => r.id_refeicao)
      if (ids.length) {
        await tx.request().query(`DELETE FROM dbo.dieta_refeicao_item WHERE id_refeicao IN (${ids.join(',')})`)
        await tx.request().input('id', sql.Int, idPlano).query(`DELETE FROM dbo.dieta_refeicao WHERE id_plano = @id`)
      }
      await _inserirRefeicoes(tx, idPlano, refeicoes)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

async function _inserirRefeicoes(tx, idPlano, refeicoes) {
  for (let i = 0; i < refeicoes.length; i++) {
    const r = refeicoes[i]
    const ref = await tx.request()
      .input('id_plano', sql.Int,        idPlano)
      .input('nome',     sql.VarChar(80), r.nome || '')
      .input('horario',  sql.VarChar(5),  r.horario || null)
      .input('ordem',    sql.TinyInt,    i + 1)
      .query(`
        INSERT INTO dbo.dieta_refeicao (id_plano, nome, horario, ordem)
        OUTPUT INSERTED.id_refeicao
        VALUES (@id_plano, @nome, @horario, @ordem)
      `)

    const idRefeicao = ref.recordset[0].id_refeicao
    for (let j = 0; j < (r.itens || []).length; j++) {
      const it = r.itens[j]
      await tx.request()
        .input('id_refeicao', sql.Int,           idRefeicao)
        .input('descricao',   sql.VarChar(200),   it.descricao || '')
        .input('quantidade',  sql.Decimal(8, 1),  it.quantidade ? Number(it.quantidade) : null)
        .input('unidade',     sql.VarChar(20),    it.unidade || 'g')
        .input('calorias',    sql.Int,            it.calorias   ? Number(it.calorias)   : null)
        .input('proteina',    sql.Int,            it.proteina   ? Number(it.proteina)   : null)
        .input('carboidrato', sql.Int,            it.carboidrato ? Number(it.carboidrato) : null)
        .input('gordura',     sql.Int,            it.gordura    ? Number(it.gordura)    : null)
        .input('ordem',       sql.TinyInt,       j + 1)
        .query(`
          INSERT INTO dbo.dieta_refeicao_item
            (id_refeicao, descricao, quantidade, unidade, calorias, proteina, carboidrato, gordura, ordem)
          VALUES
            (@id_refeicao, @descricao, @quantidade, @unidade, @calorias, @proteina, @carboidrato, @gordura, @ordem)
        `)
    }
  }
}

module.exports = { listarPlanos, buscarCompleto, buscarPlanoAtivo, criar, atualizar }
