const feedSvc    = require('../services/feed.service')
const conquistaSvc = require('../services/conquista.service')
const desafioSvc  = require('../services/desafio.service')

async function listar(req, res, next) {
  try {
    const { pagina = 1 } = req.query
    res.json(await feedSvc.listar(req.usuario.id, Number(pagina)))
  } catch (e) { next(e) }
}

async function reagir(req, res, next) {
  try {
    const resultado = await feedSvc.reagir(Number(req.params.id), req.usuario.id)
    res.json(resultado)
  } catch (e) { next(e) }
}

async function minhasConquistas(req, res, next) {
  try {
    res.json(await conquistaSvc.listar(req.usuario.id))
  } catch (e) { next(e) }
}

async function desafios(req, res, next) {
  try {
    res.json(await desafioSvc.listarAtivos(req.usuario.id))
  } catch (e) { next(e) }
}

async function entrarDesafio(req, res, next) {
  try {
    await desafioSvc.entrar(Number(req.params.id), req.usuario.id)
    res.json({ ok: true })
  } catch (e) { next(e) }
}

async function ranking(req, res, next) {
  try {
    const rankingSvc = require('../services/ranking.service')
    res.json(await rankingSvc.mensal(req.usuario.id))
  } catch (e) { next(e) }
}

module.exports = { listar, reagir, minhasConquistas, desafios, entrarDesafio, ranking }
