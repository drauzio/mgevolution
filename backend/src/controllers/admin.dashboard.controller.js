const svc = require('../services/admin.dashboard.service')

async function resumo(req, res, next) {
  try {
    const [estatisticas, recentes, cadastrosPorMes] = await Promise.all([
      svc.stats(),
      svc.alunosRecentes(),
      svc.cadastrosPorMes(),
    ])
    res.json({ estatisticas, recentes, cadastrosPorMes })
  } catch (err) { next(err) }
}

module.exports = { resumo }
