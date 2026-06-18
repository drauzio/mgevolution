const svc = require('../services/configuracao.service')

async function getAll(req, res, next) {
  try { res.json(await svc.getAll()) } catch (e) { next(e) }
}

async function salvarCategoria(req, res, next) {
  try {
    const { categoria } = req.params
    const updates = Object.entries(req.body).map(([chave, valor]) => ({ categoria, chave, valor }))
    await svc.setMany(updates)
    res.json({ ok: true })
  } catch (e) { next(e) }
}

module.exports = { getAll, salvarCategoria }
