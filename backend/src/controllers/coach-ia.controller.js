const service = require('../services/coach-ia.service')

async function iniciar(req, res, next) {
  try {
    const dados = await service.iniciarSessao(req.usuario.id)
    res.json(dados)
  } catch (e) { next(e) }
}

async function chat(req, res, next) {
  try {
    const { mensagem } = req.body
    if (!mensagem?.trim()) return res.status(400).json({ erro: 'Mensagem obrigatória' })
    const resultado = await service.chat(req.usuario.id, mensagem.trim())
    res.json(resultado)
  } catch (e) { next(e) }
}

async function limpar(req, res) {
  service.limparSessao(req.usuario.id)
  res.json({ ok: true })
}

module.exports = { iniciar, chat, limpar }
