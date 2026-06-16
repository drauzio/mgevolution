const svc = require('../services/avaliacao.service')

async function status(req, res, next) {
  try {
    const data = await svc.getStatus(req.usuario.id)
    res.json(data)
  } catch (err) { next(err) }
}

async function perguntas(req, res, next) {
  try {
    res.json(await svc.getPerguntas())
  } catch (err) { next(err) }
}

async function salvar(req, res, next) {
  try {
    const id = await svc.salvar(req.usuario.id, req.body.respostas)
    res.status(201).json({ id_avaliacao: id })
  } catch (err) { next(err) }
}

async function minha(req, res, next) {
  try {
    const data = await svc.getMinhaAvaliacao(req.usuario.id)
    res.json(data)
  } catch (err) { next(err) }
}

module.exports = { status, perguntas, salvar, minha }
