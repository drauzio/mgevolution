const svc = require('../services/dashboard.service')

async function resumo(req, res, next) {
  try {
    const data = await svc.resumo(req.usuario.id)
    res.json(data)
  } catch (err) { next(err) }
}

module.exports = { resumo }
