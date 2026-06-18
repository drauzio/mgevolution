const { getPool, sql } = require('../database/connection')

async function listarProtocolos({ idPersonal, idAluno, apenasTemplates } = {}) {
  const pool = await getPool()
  const req = pool.request()

  let where = 'WHERE 1=1'
  if (apenasTemplates === true) {
    where += ' AND p.is_template = 1'
  } else if (apenasTemplates === false) {
    where += ' AND p.is_template = 0'
    if (idAluno) { req.input('idAluno', sql.Int, idAluno); where += ' AND p.id_usuario = @idAluno' }
  }
  // apenasTemplates === undefined → retorna tudo (templates primeiro)

  const result = await req.query(`
    SELECT
      p.id_protocolo,
      p.nome,
      p.objetivo,
      p.is_template,
      p.criterio_objetivo,
      p.criterio_nivel,
      p.criterio_sexo,
      p.criterio_idade_min,
      p.criterio_idade_max,
      p.data_inicio,
      p.data_fim,
      p.ativo,
      p.data_criacao,
      a.nome  AS aluno_nome,
      a.email AS aluno_email,
      (SELECT COUNT(*) FROM dbo.treino_dia td WHERE td.id_protocolo = p.id_protocolo AND td.descanso = 0) AS dias_treino
    FROM dbo.treino_protocolo p
    LEFT JOIN dbo.usuario a ON a.id_usuario = p.id_usuario
    ${where}
    ORDER BY p.is_template DESC, p.ativo DESC, p.data_criacao DESC
  `)
  return result.recordset
}

async function buscarCompleto(idProtocolo) {
  const pool = await getPool()

  const proto = await pool.request()
    .input('id', sql.Int, idProtocolo)
    .query(`
      SELECT p.*, a.nome AS aluno_nome, a.email AS aluno_email
      FROM dbo.treino_protocolo p
      LEFT JOIN dbo.usuario a ON a.id_usuario = p.id_usuario
      WHERE p.id_protocolo = @id
    `)

  if (!proto.recordset.length) return null

  const dias = await pool.request()
    .input('id', sql.Int, idProtocolo)
    .query(`
      SELECT id_treino_dia, dia_semana, nome, descanso, ordem
      FROM dbo.treino_dia WHERE id_protocolo = @id ORDER BY dia_semana
    `)

  const exercicios = await pool.request()
    .input('id', sql.Int, idProtocolo)
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
  const { nome, objetivo, observacoes, data_inicio, data_fim, id_usuario,
          is_template, criterio_objetivo, criterio_nivel, criterio_sexo,
          criterio_idade_min, criterio_idade_max, dias } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    const r1 = await tx.request()
      .input('id_usuario',        sql.Int,          is_template ? null : id_usuario)
      .input('id_personal',       sql.Int,          is_template ? null : idPersonal)
      .input('nome',              sql.VarChar(120),  nome)
      .input('objetivo',          sql.VarChar(200),  objetivo || null)
      .input('observacoes',       sql.VarChar(500),  observacoes || null)
      .input('data_inicio',       sql.Date,          is_template ? null : (data_inicio || null))
      .input('data_fim',          sql.Date,          data_fim || null)
      .input('is_template',       sql.Bit,           is_template ? 1 : 0)
      .input('criterio_objetivo', sql.VarChar(100),  criterio_objetivo || null)
      .input('criterio_nivel',    sql.VarChar(50),   criterio_nivel || null)
      .input('criterio_sexo',     sql.VarChar(1),    criterio_sexo || null)
      .input('criterio_idade_min',sql.Int,           criterio_idade_min != null ? Number(criterio_idade_min) : null)
      .input('criterio_idade_max',sql.Int,           criterio_idade_max != null ? Number(criterio_idade_max) : null)
      .query(`
        INSERT INTO dbo.treino_protocolo
          (id_usuario, id_personal, nome, objetivo, observacoes, data_inicio, data_fim,
           is_template, criterio_objetivo, criterio_nivel, criterio_sexo, criterio_idade_min, criterio_idade_max)
        OUTPUT INSERTED.id_protocolo
        VALUES
          (@id_usuario, @id_personal, @nome, @objetivo, @observacoes, @data_inicio, @data_fim,
           @is_template, @criterio_objetivo, @criterio_nivel, @criterio_sexo, @criterio_idade_min, @criterio_idade_max)
      `)

    const idProtocolo = r1.recordset[0].id_protocolo
    await _inserirDias(tx, idProtocolo, dias || [])
    await tx.commit()
    return { id_protocolo: idProtocolo }
  } catch (err) { await tx.rollback(); throw err }
}

async function atualizar(idProtocolo, dados) {
  const pool = await getPool()
  const { nome, objetivo, observacoes, data_inicio, data_fim, ativo,
          is_template, criterio_objetivo, criterio_nivel, criterio_sexo,
          criterio_idade_min, criterio_idade_max, dias } = dados

  const tx = pool.transaction()
  await tx.begin()
  try {
    await tx.request()
      .input('id',                sql.Int,          idProtocolo)
      .input('nome',              sql.VarChar(120),  nome)
      .input('objetivo',          sql.VarChar(200),  objetivo || null)
      .input('observacoes',       sql.VarChar(500),  observacoes || null)
      .input('data_inicio',       sql.Date,          data_inicio || null)
      .input('data_fim',          sql.Date,          data_fim || null)
      .input('ativo',             sql.Bit,           ativo !== undefined ? ativo : 1)
      .input('criterio_objetivo', sql.VarChar(100),  criterio_objetivo || null)
      .input('criterio_nivel',    sql.VarChar(50),   criterio_nivel || null)
      .input('criterio_sexo',     sql.VarChar(1),    criterio_sexo || null)
      .input('criterio_idade_min',sql.Int,           criterio_idade_min != null ? Number(criterio_idade_min) : null)
      .input('criterio_idade_max',sql.Int,           criterio_idade_max != null ? Number(criterio_idade_max) : null)
      .query(`
        UPDATE dbo.treino_protocolo SET
          nome = @nome, objetivo = @objetivo, observacoes = @observacoes,
          data_inicio = @data_inicio, data_fim = @data_fim, ativo = @ativo,
          criterio_objetivo = @criterio_objetivo, criterio_nivel = @criterio_nivel,
          criterio_sexo = @criterio_sexo, criterio_idade_min = @criterio_idade_min,
          criterio_idade_max = @criterio_idade_max,
          data_atualizacao = SYSUTCDATETIME()
        WHERE id_protocolo = @id
      `)

    if (dias) {
      const idsResult = await tx.request()
        .input('id', sql.Int, idProtocolo)
        .query(`SELECT id_treino_dia FROM dbo.treino_dia WHERE id_protocolo = @id`)

      const idsDias = idsResult.recordset.map(r => r.id_treino_dia)
      if (idsDias.length) {
        await tx.request().query(`DELETE FROM dbo.treino_dia_exercicio WHERE id_treino_dia IN (${idsDias.join(',')})`)
        await tx.request().input('id', sql.Int, idProtocolo).query(`DELETE FROM dbo.treino_dia WHERE id_protocolo = @id`)
      }
      await _inserirDias(tx, idProtocolo, dias)

      // Propaga automaticamente para protocolos de alunos originados deste template
      if (is_template) await propagarTemplate(tx, idProtocolo)
    }

    await tx.commit()
  } catch (err) { await tx.rollback(); throw err }
}

// Clona um template como protocolo real para um aluno (chamado pelo serviço de avaliação)
async function clonarTemplateParaAluno(tx, idUsuario, objetivo, nivel, sexo, idade) {
  // Busca o template mais específico que bate com objetivo + nivel + sexo + faixa etária
  const req = tx.request()
    .input('obj',   sql.VarChar(100), objetivo || '')
    .input('niv',   sql.VarChar(50),  nivel    || '')
    .input('sexo',  sql.VarChar(1),   sexo     || null)
    .input('idade', sql.Int,          idade    || null)

  const tmpl = await req.query(`
      SELECT TOP 1 id_protocolo, nome, objetivo AS obj_protocolo, observacoes
      FROM dbo.treino_protocolo
      WHERE is_template = 1 AND ativo = 1
        AND (criterio_objetivo  = @obj  OR criterio_objetivo  IS NULL)
        AND (criterio_nivel     = @niv  OR criterio_nivel     IS NULL)
        AND (criterio_sexo      = @sexo OR criterio_sexo      IS NULL OR @sexo IS NULL)
        AND (criterio_idade_min IS NULL OR @idade IS NULL OR @idade >= criterio_idade_min)
        AND (criterio_idade_max IS NULL OR @idade IS NULL OR @idade <= criterio_idade_max)
      ORDER BY
        CASE
          WHEN criterio_objetivo = @obj AND criterio_nivel = @niv AND criterio_sexo = @sexo AND criterio_idade_min IS NOT NULL THEN 0
          WHEN criterio_objetivo = @obj AND criterio_nivel = @niv AND criterio_sexo = @sexo THEN 1
          WHEN criterio_objetivo = @obj AND criterio_nivel = @niv THEN 2
          WHEN criterio_objetivo = @obj AND criterio_sexo  = @sexo THEN 3
          WHEN criterio_objetivo = @obj THEN 4
          ELSE 5
        END
    `)

  if (!tmpl.recordset[0]) return null

  const t = tmpl.recordset[0]
  const hoje = new Date().toISOString().slice(0, 10)

  const novoProto = await tx.request()
    .input('id_usuario',        sql.Int,         idUsuario)
    .input('nome',              sql.VarChar(120), t.nome)
    .input('objetivo',          sql.VarChar(200), t.obj_protocolo || null)
    .input('observacoes',       sql.VarChar(500), t.observacoes || null)
    .input('data_inicio',       sql.Date,         hoje)
    .input('id_template_origem',sql.Int,          t.id_protocolo)
    .query(`
      INSERT INTO dbo.treino_protocolo
        (id_usuario, id_personal, nome, objetivo, observacoes, data_inicio, is_template, id_template_origem)
      OUTPUT INSERTED.id_protocolo
      VALUES (@id_usuario, NULL, @nome, @objetivo, @observacoes, @data_inicio, 0, @id_template_origem)
    `)

  const novoId = novoProto.recordset[0].id_protocolo

  // Copia dias do template
  const dias = await tx.request()
    .input('id', sql.Int, t.id_protocolo)
    .query(`SELECT * FROM dbo.treino_dia WHERE id_protocolo = @id ORDER BY dia_semana`)

  for (const dia of dias.recordset) {
    const novoDia = await tx.request()
      .input('id_protocolo', sql.Int,        novoId)
      .input('dia_semana',   sql.TinyInt,    dia.dia_semana)
      .input('nome',         sql.VarChar(80), dia.nome)
      .input('descanso',     sql.Bit,         dia.descanso)
      .input('ordem',        sql.TinyInt,    dia.ordem)
      .query(`
        INSERT INTO dbo.treino_dia (id_protocolo, dia_semana, nome, descanso, ordem)
        OUTPUT INSERTED.id_treino_dia
        VALUES (@id_protocolo, @dia_semana, @nome, @descanso, @ordem)
      `)

    const novoIdDia = novoDia.recordset[0].id_treino_dia

    const exs = await tx.request()
      .input('id_dia', sql.Int, dia.id_treino_dia)
      .query(`SELECT * FROM dbo.treino_dia_exercicio WHERE id_treino_dia = @id_dia ORDER BY ordem`)

    for (const ex of exs.recordset) {
      await tx.request()
        .input('id_treino_dia',  sql.Int,          novoIdDia)
        .input('id_exercicio',   sql.Int,          ex.id_exercicio)
        .input('series',         sql.TinyInt,      ex.series)
        .input('repeticoes',     sql.VarChar(20),   ex.repeticoes)
        .input('carga_sugerida', sql.VarChar(30),   ex.carga_sugerida)
        .input('descanso_seg',   sql.SmallInt,     ex.descanso_seg)
        .input('observacao',     sql.VarChar(300),  ex.observacao)
        .input('ordem',          sql.TinyInt,      ex.ordem)
        .query(`
          INSERT INTO dbo.treino_dia_exercicio
            (id_treino_dia, id_exercicio, series, repeticoes, carga_sugerida, descanso_seg, observacao, ordem)
          VALUES
            (@id_treino_dia, @id_exercicio, @series, @repeticoes, @carga_sugerida, @descanso_seg, @observacao, @ordem)
        `)
    }
  }

  return novoId
}

// Propaga os dias/exercícios do template para todos os protocolos de alunos vinculados
async function propagarTemplate(tx, idTemplate) {
  const alunos = await tx.request()
    .input('id', sql.Int, idTemplate)
    .query(`SELECT id_protocolo FROM dbo.treino_protocolo WHERE id_template_origem = @id AND ativo = 1 AND is_template = 0`)

  if (!alunos.recordset.length) return

  const dias = await tx.request()
    .input('id', sql.Int, idTemplate)
    .query(`SELECT * FROM dbo.treino_dia WHERE id_protocolo = @id ORDER BY dia_semana`)

  for (const aluno of alunos.recordset) {
    const existentes = await tx.request()
      .input('id', sql.Int, aluno.id_protocolo)
      .query(`SELECT id_treino_dia FROM dbo.treino_dia WHERE id_protocolo = @id`)

    const ids = existentes.recordset.map(r => r.id_treino_dia)
    if (ids.length) {
      await tx.request().query(`DELETE FROM dbo.treino_dia_exercicio WHERE id_treino_dia IN (${ids.join(',')})`)
      await tx.request().input('id', sql.Int, aluno.id_protocolo).query(`DELETE FROM dbo.treino_dia WHERE id_protocolo = @id`)
    }

    for (const dia of dias.recordset) {
      const novoDia = await tx.request()
        .input('id_protocolo', sql.Int,         aluno.id_protocolo)
        .input('dia_semana',   sql.TinyInt,     dia.dia_semana)
        .input('nome',         sql.VarChar(80),  dia.nome)
        .input('descanso',     sql.Bit,          dia.descanso)
        .input('ordem',        sql.TinyInt,     dia.ordem)
        .query(`
          INSERT INTO dbo.treino_dia (id_protocolo, dia_semana, nome, descanso, ordem)
          OUTPUT INSERTED.id_treino_dia VALUES (@id_protocolo, @dia_semana, @nome, @descanso, @ordem)
        `)

      const novoIdDia = novoDia.recordset[0].id_treino_dia
      const exs = await tx.request()
        .input('id_dia', sql.Int, dia.id_treino_dia)
        .query(`SELECT * FROM dbo.treino_dia_exercicio WHERE id_treino_dia = @id_dia ORDER BY ordem`)

      for (const ex of exs.recordset) {
        await tx.request()
          .input('id_treino_dia',  sql.Int,         novoIdDia)
          .input('id_exercicio',   sql.Int,         ex.id_exercicio)
          .input('series',         sql.TinyInt,     ex.series)
          .input('repeticoes',     sql.VarChar(20),  ex.repeticoes)
          .input('carga_sugerida', sql.VarChar(30),  ex.carga_sugerida)
          .input('descanso_seg',   sql.SmallInt,    ex.descanso_seg)
          .input('observacao',     sql.VarChar(300), ex.observacao)
          .input('ordem',          sql.TinyInt,     ex.ordem)
          .query(`
            INSERT INTO dbo.treino_dia_exercicio
              (id_treino_dia, id_exercicio, series, repeticoes, carga_sugerida, descanso_seg, observacao, ordem)
            VALUES
              (@id_treino_dia, @id_exercicio, @series, @repeticoes, @carga_sugerida, @descanso_seg, @observacao, @ordem)
          `)
      }
    }
  }
}

async function _inserirDias(tx, idProtocolo, dias) {
  for (const dia of dias) {
    const r = await tx.request()
      .input('id_protocolo', sql.Int,        idProtocolo)
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
        .input('id_treino_dia',  sql.Int,          idDia)
        .input('id_exercicio',   sql.Int,          ex.id_exercicio)
        .input('series',         sql.TinyInt,      ex.series || 3)
        .input('repeticoes',     sql.VarChar(20),   ex.repeticoes || '12')
        .input('carga_sugerida', sql.VarChar(30),   ex.carga_sugerida || null)
        .input('descanso_seg',   sql.SmallInt,     ex.descanso_seg || null)
        .input('observacao',     sql.VarChar(300),  ex.observacao || null)
        .input('ordem',          sql.TinyInt,      i + 1)
        .query(`
          INSERT INTO dbo.treino_dia_exercicio
            (id_treino_dia, id_exercicio, series, repeticoes, carga_sugerida, descanso_seg, observacao, ordem)
          VALUES
            (@id_treino_dia, @id_exercicio, @series, @repeticoes, @carga_sugerida, @descanso_seg, @observacao, @ordem)
        `)
    }
  }
}

async function buscarProtocoloAtivo(id_usuario) {
  const pool = await getPool()
  const r = await pool.request()
    .input('id_usuario', sql.Int, id_usuario)
    .query(`
      SELECT TOP 1 id_protocolo
      FROM dbo.treino_protocolo
      WHERE id_usuario = @id_usuario AND is_template = 0 AND ativo = 1
      ORDER BY data_criacao DESC
    `)
  if (!r.recordset[0]) return null
  return buscarCompleto(r.recordset[0].id_protocolo)
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

module.exports = { listarProtocolos, buscarCompleto, buscarProtocoloAtivo, criar, atualizar, clonarTemplateParaAluno, buscarExercicios }
