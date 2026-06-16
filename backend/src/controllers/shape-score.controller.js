const service = require('../services/shape-score.service')

async function registrar(req, res) {
  try {
    const { treino, cardio, dieta, sono, agua } = req.body
    const result = await service.registrar(req.usuario.id, { treino, cardio, dieta, sono, agua })
    res.json(result)
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao registrar score' })
  }
}

async function historico(req, res) {
  try {
    const dias = parseInt(req.query.dias) || 30
    const data = await service.historico(req.usuario.id, dias)
    res.json(data)
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar histórico' })
  }
}

async function media(req, res) {
  try {
    const media = await service.mediaSemanal(req.usuario.id)
    res.json({ media })
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao calcular média' })
  }
}

module.exports = { registrar, historico, media }
