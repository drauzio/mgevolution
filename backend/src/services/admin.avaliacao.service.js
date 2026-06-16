const { getPool, sql } = require('../database/connection')
const { clonarTemplateParaAluno } = require('./treino.service')

async function listar({ busca, status } = {}) {
  const pool = await getPool()
  const req = pool.request()

  let filtro = ''
  if (busca) {
    req.input('busca', sql.NVarChar(100), `%${busca}%`)
    filtro += ' AND (u.nome LIKE @busca OR u.email LIKE @busca)'
  }
  if (status) {
    req.input('status', sql.VarChar(20), status)
    filtro += ' AND af.status = @status'
  }

  const result = await req.query(`
    SELECT
      af.id_avaliacao_fitness AS id,
      af.status,
      af.objetivo,
      af.nivel,
      af.sexo,
      af.idade,
      af.data_inicio AS data_criacao,
      af.data_finalizacao,
      u.id_usuario,
      u.nome  AS aluno_nome,
      u.email AS aluno_email,
      tp.id_protocolo AS protocolo_id,
      tp.nome         AS protocolo_nome
    FROM dbo.avaliacao_fitness af
    JOIN dbo.usuario u ON u.id_usuario = af.id_usuario
    OUTER APPLY (
      SELECT TOP 1 id_protocolo, nome
      FROM dbo.treino_protocolo
      WHERE id_usuario = af.id_usuario AND is_template = 0 AND ativo = 1
      ORDER BY data_criacao DESC
    ) tp
    WHERE af.ativo = 1 ${filtro}
    ORDER BY af.data_inicio DESC
  `)
  return result.recordset
}

async function buscarCompleta(id) {
  const pool = await getPool()

  const header = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        af.id_avaliacao_fitness AS id,
        af.status, af.objetivo, af.nivel, af.sexo, af.idade,
        af.data_inicio AS data_criacao, af.data_finalizacao,
        u.id_usuario, u.nome AS aluno_nome, u.email AS aluno_email,
        tp.id_protocolo AS protocolo_id, tp.nome AS protocolo_nome
      FROM dbo.avaliacao_fitness af
      JOIN dbo.usuario u ON u.id_usuario = af.id_usuario
      OUTER APPLY (
        SELECT TOP 1 id_protocolo, nome
        FROM dbo.treino_protocolo
        WHERE id_usuario = af.id_usuario AND is_template = 0 AND ativo = 1
        ORDER BY data_criacao DESC
      ) tp
      WHERE af.id_avaliacao_fitness = @id
    `)

  if (!header.recordset[0]) return null

  const respostas = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT
        p.pergunta,
        p.tipo,
        p.codigo,
        r.resposta_bit,
        r.resposta_texto,
        r.resposta_numero,
        o.valor AS opcao_valor
      FROM dbo.avaliacao_fitness_resposta r
      JOIN dbo.avaliacao_fitness_pergunta p
        ON p.id_avaliacao_fitness_pergunta = r.id_avaliacao_fitness_pergunta
      LEFT JOIN dbo.avaliacao_fitness_pergunta_opcao o
        ON o.id_avaliacao_fitness_pergunta_opcao = r.id_avaliacao_fitness_pergunta_opcao
      WHERE r.id_avaliacao_fitness = @id
      ORDER BY p.ordem
    `)

  return { ...header.recordset[0], respostas: respostas.recordset }
}

async function reatribuirTemplate(id_avaliacao) {
  const pool = await getPool()

  const av = await pool.request()
    .input('id', sql.Int, id_avaliacao)
    .query(`
      SELECT id_usuario, objetivo, nivel, sexo, idade
      FROM dbo.avaliacao_fitness
      WHERE id_avaliacao_fitness = @id AND ativo = 1
    `)

  const row = av.recordset[0]
  if (!row) throw Object.assign(new Error('Avaliação não encontrada'), { status: 404 })

  const { id_usuario, objetivo, nivel, sexo, idade } = row

  const tx = pool.transaction()
  await tx.begin()
  try {
    // Inativa protocolos anteriores gerados por template
    await tx.request()
      .input('id_usuario', sql.Int, id_usuario)
      .query(`
        UPDATE dbo.treino_protocolo SET ativo = 0, data_atualizacao = SYSUTCDATETIME()
        WHERE id_usuario = @id_usuario AND is_template = 0 AND ativo = 1
      `)

    const novoId = await clonarTemplateParaAluno(tx, id_usuario, objetivo, nivel, sexo, idade)
    await tx.commit()
    return { id_protocolo: novoId }
  } catch (err) {
    await tx.rollback()
    throw err
  }
}

module.exports = { listar, buscarCompleta, reatribuirTemplate }
