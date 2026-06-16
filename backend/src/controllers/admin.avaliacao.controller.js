const svc = require('../services/admin.avaliacao.service')

async function listar(req, res, next) {
  try {
    const { busca, status } = req.query
    res.json(await svc.listar({ busca, status }))
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const av = await svc.buscarCompleta(Number(req.params.id))
    if (!av) return res.status(404).json({ erro: 'Avaliação não encontrada' })
    res.json(av)
  } catch (err) { next(err) }
}

async function reatribuir(req, res, next) {
  try {
    const resultado = await svc.reatribuirTemplate(Number(req.params.id))
    res.json(resultado)
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ erro: err.message })
    next(err)
  }
}

module.exports = { listar, buscar, reatribuir }
