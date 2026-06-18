const svc = require('../services/evolucao.service')
const { getPool, sql } = require('../database/connection')

async function listarAlunos(req, res, next) {
  try {
    const pool = await getPool()
    const result = await pool.request().query(`
      SELECT
        u.id_usuario,
        u.nome,
        u.email,
        em.peso            AS ultimo_peso,
        em.gordura_pct     AS ultima_gordura,
        em.massa_magra     AS ultima_massa_magra,
        CAST(em.data AS DATE) AS ultima_medida,
        (
          SELECT COUNT(*) FROM dbo.treino_sessao ts
          WHERE ts.id_usuario = u.id_usuario AND ts.concluida = 1
            AND MONTH(ts.data_sessao) = MONTH(SYSUTCDATETIME())
            AND YEAR(ts.data_sessao)  = YEAR(SYSUTCDATETIME())
        ) AS treinos_mes,
        (
          SELECT COUNT(*) FROM dbo.treino_sessao ts
          WHERE ts.id_usuario = u.id_usuario AND ts.concluida = 1
        ) AS treinos_total,
        (
          SELECT TOP 1 CAST(ts.data_sessao AS DATE)
          FROM dbo.treino_sessao ts
          WHERE ts.id_usuario = u.id_usuario AND ts.concluida = 1
          ORDER BY ts.data_sessao DESC
        ) AS ultimo_treino,
        (SELECT COUNT(*) FROM dbo.evolucao_medida WHERE id_usuario = u.id_usuario) AS total_medidas,
        (SELECT COUNT(*) FROM dbo.evolucao_foto   WHERE id_usuario = u.id_usuario) AS total_fotos
      FROM dbo.usuario u
      INNER JOIN dbo.usuario_perfil up ON up.id_usuario = u.id_usuario AND up.ativo = 1
        AND up.id_perfil = (SELECT id_perfil FROM dbo.perfil WHERE nome = 'aluno')
      OUTER APPLY (
        SELECT TOP 1 peso, gordura_pct, massa_magra, data
        FROM dbo.evolucao_medida WHERE id_usuario = u.id_usuario ORDER BY data DESC
      ) em
      WHERE u.ativo = 1
      ORDER BY u.nome
    `)
    res.json(result.recordset)
  } catch (err) { next(err) }
}

async function resumo(req, res, next) {
  try { res.json(await svc.resumo(Number(req.params.id))) }
  catch (err) { next(err) }
}

async function sessoes(req, res, next) {
  try { res.json(await svc.sessoes(Number(req.params.id))) }
  catch (err) { next(err) }
}

async function listarMedidas(req, res, next) {
  try { res.json(await svc.listarMedidas(Number(req.params.id))) }
  catch (err) { next(err) }
}

async function historicoExercicio(req, res, next) {
  try {
    const { idExercicio } = req.query
    if (!idExercicio) return res.status(400).json({ erro: 'idExercicio obrigatório' })
    res.json(await svc.historicoExercicio(Number(req.params.id), Number(idExercicio)))
  } catch (err) { next(err) }
}

async function exercicios(req, res, next) {
  try { res.json(await svc.exerciciosDoProtocolo(Number(req.params.id))) }
  catch (err) { next(err) }
}

async function listarFotos(req, res, next) {
  try { res.json(await svc.listarFotos(Number(req.params.id))) }
  catch (err) { next(err) }
}

async function analiseIA(req, res, next) {
  try {
    res.json({ analise: await svc.analiseIA(Number(req.params.id)) })
  } catch (err) {
    if (err.code === 'SEM_DADOS') {
      return res.status(422).json({ erro: err.message, code: err.code, faltando: err.faltando })
    }
    next(err)
  }
}

async function buscarAnalise(req, res, next) {
  try { res.json(await svc.buscarAnaliseCache(Number(req.params.id)) || {}) }
  catch (err) { next(err) }
}

module.exports = { listarAlunos, resumo, sessoes, listarMedidas, historicoExercicio, exercicios, listarFotos, analiseIA, buscarAnalise }
