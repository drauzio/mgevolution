const svc = require('../services/ia-diretriz.service')

async function listar(req, res, next) {
  try {
    const { id_nutricionista } = req.query
    const lista = await svc.listar(id_nutricionista ? Number(id_nutricionista) : null)
    res.json(lista)
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const d = await svc.buscar(Number(req.params.id))
    if (!d) return res.status(404).json({ erro: 'Diretriz não encontrada' })
    res.json(d)
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    const result = await svc.criar(req.body)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    await svc.atualizar(Number(req.params.id), req.body)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function deletar(req, res, next) {
  try {
    await svc.deletar(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar, deletar }
