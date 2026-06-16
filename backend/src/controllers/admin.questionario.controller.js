const svc = require('../services/admin.questionario.service')

async function listar(req, res, next) {
  try { res.json(await svc.listar()) } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const p = await svc.buscar(Number(req.params.id))
    if (!p) return res.status(404).json({ erro: 'Pergunta não encontrada' })
    res.json(p)
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try { res.status(201).json({ id: await svc.criar(req.body) }) } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try { await svc.atualizar(Number(req.params.id), req.body); res.json({ ok: true }) } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar }
