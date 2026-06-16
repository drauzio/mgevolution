const svc = require('../services/admin.dashboard.service')

async function resumo(req, res, next) {
  try {
    const [estatisticas, recentes] = await Promise.all([
      svc.stats(),
      svc.alunosRecentes(),
    ])
    res.json({ estatisticas, recentes })
  } catch (err) { next(err) }
}

module.exports = { resumo }
