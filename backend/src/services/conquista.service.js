const { getPool, sql } = require('../database/connection')

async function verificarEDesbloquear(id_usuario) {
  try {
    const pool = await getPool()

    const [totaisRes, conquistasRes] = await Promise.all([
      pool.request().input('uid', sql.Int, id_usuario).query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.treino_sessao WHERE id_usuario = @uid AND concluida = 1) AS treinos_total,
          (SELECT COUNT(*) FROM dbo.evolucao_medida WHERE id_usuario = @uid)                 AS medidas_total,
          (SELECT COUNT(*) FROM dbo.desafio_participante WHERE id_usuario = @uid AND concluido = 1) AS desafios_total
      `),
      pool.request().input('uid', sql.Int, id_usuario).query(`
        SELECT id_conquista FROM dbo.usuario_conquista WHERE id_usuario = @uid
      `),
    ])

    const t = totaisRes.recordset[0]
    const jaTemIds = new Set(conquistasRes.recordset.map(r => r.id_conquista))

    const streak = await calcularStreak(pool, id_usuario)

    const todas = await pool.request().query(`SELECT * FROM dbo.conquista`)
    const novas = []

    for (const c of todas.recordset) {
      if (jaTemIds.has(c.id_conquista)) continue
      let desbloqueou = false
      if (c.criterio_tipo === 'primeiro_treino' && t.treinos_total >= 1)           desbloqueou = true
      if (c.criterio_tipo === 'treinos_total'   && t.treinos_total >= c.criterio_valor) desbloqueou = true
      if (c.criterio_tipo === 'streak_dias'     && streak >= c.criterio_valor)     desbloqueou = true
      if (c.criterio_tipo === 'medida'          && t.medidas_total >= 1)           desbloqueou = true
      if (c.criterio_tipo === 'desafio'         && t.desafios_total >= c.criterio_valor) desbloqueou = true

      if (desbloqueou) {
        await pool.request()
          .input('uid', sql.Int, id_usuario)
          .input('idc', sql.Int, c.id_conquista)
          .query(`INSERT INTO dbo.usuario_conquista (id_usuario, id_conquista) VALUES (@uid, @idc)`)
        novas.push(c)
      }
    }

    return novas
  } catch (e) {
    console.error('[Conquista] Erro:', e.message)
    return []
  }
}

async function calcularStreak(pool, id_usuario) {
  const r = await pool.request().input('uid', sql.Int, id_usuario).query(`
    SELECT DISTINCT CAST(data_sessao AS DATE) AS dia
    FROM dbo.treino_sessao
    WHERE id_usuario = @uid AND concluida = 1
    ORDER BY dia DESC
  `)
  const dias = r.recordset.map(x => x.dia)
  if (!dias.length) return 0
  let streak = 0
  let atual = new Date(); atual.setHours(0,0,0,0)
  for (const d of dias) {
    const dia = new Date(d); dia.setHours(0,0,0,0)
    const diff = Math.round((atual - dia) / 86400000)
    if (diff > 1) break
    streak++
    atual = dia
  }
  return streak
}

async function listar(id_usuario) {
  const pool = await getPool()
  const r = await pool.request().input('uid', sql.Int, id_usuario).query(`
    SELECT c.codigo, c.nome, c.descricao, c.icone,
           uc.data_desbloqueio,
           CASE WHEN uc.id_conquista IS NOT NULL THEN 1 ELSE 0 END AS desbloqueada
    FROM dbo.conquista c
    LEFT JOIN dbo.usuario_conquista uc ON uc.id_conquista = c.id_conquista AND uc.id_usuario = @uid
    ORDER BY desbloqueada DESC, c.id_conquista
  `)
  return r.recordset
}

module.exports = { verificarEDesbloquear, listar }
