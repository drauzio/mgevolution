const { getPool, sql } = require('../database/connection')

async function listarAtivos(id_usuario) {
  const pool = await getPool()
  const r = await pool.request().input('uid', sql.Int, id_usuario).query(`
    SELECT
      d.id_desafio, d.titulo, d.descricao, d.icone, d.tipo_meta, d.valor_meta,
      CONVERT(VARCHAR(10), d.data_inicio, 120) AS data_inicio,
      CONVERT(VARCHAR(10), d.data_fim,    120) AS data_fim,
      dp.progresso, dp.concluido,
      CASE WHEN dp.id_desafio_participante IS NOT NULL THEN 1 ELSE 0 END AS participando,
      (SELECT COUNT(*) FROM dbo.desafio_participante WHERE id_desafio = d.id_desafio) AS total_participantes,
      DATEDIFF(day, CAST(SYSUTCDATETIME() AS DATE), d.data_fim) AS dias_restantes
    FROM dbo.desafio d
    LEFT JOIN dbo.desafio_participante dp ON dp.id_desafio = d.id_desafio AND dp.id_usuario = @uid
    WHERE d.ativo = 1 AND d.data_fim >= CAST(SYSUTCDATETIME() AS DATE)
    ORDER BY d.data_fim
  `)
  return r.recordset
}

async function entrar(id_desafio, id_usuario) {
  const pool = await getPool()
  await pool.request()
    .input('id', sql.Int, id_desafio)
    .input('uid', sql.Int, id_usuario)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.desafio_participante WHERE id_desafio = @id AND id_usuario = @uid)
        INSERT INTO dbo.desafio_participante (id_desafio, id_usuario) VALUES (@id, @uid)
    `)
  return { ok: true }
}

async function atualizarProgressoTreinos(id_usuario) {
  try {
    const pool = await getPool()
    const desafios = await pool.request().input('uid', sql.Int, id_usuario).query(`
      SELECT dp.id_desafio_participante, dp.id_desafio, d.tipo_meta, d.valor_meta, d.data_inicio, d.data_fim, dp.concluido
      FROM dbo.desafio_participante dp
      INNER JOIN dbo.desafio d ON d.id_desafio = dp.id_desafio
      WHERE dp.id_usuario = @uid AND dp.concluido = 0
        AND d.tipo_meta = 'treinos'
        AND d.data_fim >= CAST(SYSUTCDATETIME() AS DATE)
    `)

    const novosConcluidos = []
    for (const d of desafios.recordset) {
      const r = await pool.request()
        .input('uid', sql.Int, id_usuario)
        .input('inicio', sql.Date, d.data_inicio)
        .input('fim',    sql.Date, d.data_fim)
        .query(`
          SELECT COUNT(*) AS total FROM dbo.treino_sessao
          WHERE id_usuario = @uid AND concluida = 1
            AND CAST(data_sessao AS DATE) BETWEEN @inicio AND @fim
        `)
      const progresso = r.recordset[0].total
      const concluido = progresso >= d.valor_meta ? 1 : 0
      await pool.request()
        .input('id',  sql.Int, d.id_desafio_participante)
        .input('p',   sql.Int, progresso)
        .input('c',   sql.Bit, concluido)
        .input('now', sql.DateTime2, concluido ? new Date() : null)
        .query(`
          UPDATE dbo.desafio_participante
          SET progresso = @p, concluido = @c, data_conclusao = CASE WHEN @c = 1 THEN @now ELSE data_conclusao END
          WHERE id_desafio_participante = @id
        `)
      if (concluido && !d.concluido) novosConcluidos.push(d)
    }
    return novosConcluidos
  } catch (e) {
    console.error('[Desafio] Erro ao atualizar progresso:', e.message)
    return []
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────
async function criar(dados) {
  const pool = await getPool()
  const r = await pool.request()
    .input('titulo',      sql.VarChar(150), dados.titulo)
    .input('descricao',   sql.VarChar(500), dados.descricao || null)
    .input('icone',       sql.VarChar(10),  dados.icone || '🏆')
    .input('tipo_meta',   sql.VarChar(30),  dados.tipo_meta)
    .input('valor_meta',  sql.Int,          dados.valor_meta)
    .input('data_inicio', sql.Date,         dados.data_inicio)
    .input('data_fim',    sql.Date,         dados.data_fim)
    .query(`
      INSERT INTO dbo.desafio (titulo, descricao, icone, tipo_meta, valor_meta, data_inicio, data_fim)
      OUTPUT INSERTED.*
      VALUES (@titulo, @descricao, @icone, @tipo_meta, @valor_meta, @data_inicio, @data_fim)
    `)
  return r.recordset[0]
}

async function listarAdmin() {
  const pool = await getPool()
  const r = await pool.request().query(`
    SELECT d.*,
      CONVERT(VARCHAR(10), d.data_inicio, 120) AS data_inicio,
      CONVERT(VARCHAR(10), d.data_fim, 120)    AS data_fim,
      (SELECT COUNT(*) FROM dbo.desafio_participante dp WHERE dp.id_desafio = d.id_desafio) AS total_participantes,
      (SELECT COUNT(*) FROM dbo.desafio_participante dp WHERE dp.id_desafio = d.id_desafio AND dp.concluido = 1) AS total_concluidos
    FROM dbo.desafio d
    ORDER BY d.data_fim DESC
  `)
  return r.recordset
}

async function toggleAtivo(id_desafio) {
  const pool = await getPool()
  await pool.request().input('id', sql.Int, id_desafio)
    .query(`UPDATE dbo.desafio SET ativo = CASE WHEN ativo = 1 THEN 0 ELSE 1 END WHERE id_desafio = @id`)
}

module.exports = { listarAtivos, entrar, atualizarProgressoTreinos, criar, listarAdmin, toggleAtivo }
