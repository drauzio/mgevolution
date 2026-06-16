const { getMenuByPerfis } = require('../services/menu.service')

async function listar(req, res, next) {
  try {
    const perfis = req.usuario?.perfis || [req.usuario?.perfil || 'aluno']
    const itens = await getMenuByPerfis(perfis)
    res.json(itens)
  } catch (err) {
    // Tabelas ainda não existem (migrations pendentes) — retorna vazio sem quebrar o frontend
    if (err.number === 208) return res.json([])
    next(err)
  }
}

module.exports = { listar }
