const service = require('../services/coach-ia.service')

async function chat(req, res) {
  try {
    const { mensagem } = req.body
    if (!mensagem?.trim()) return res.status(400).json({ erro: 'Mensagem obrigatória' })
    const resposta = await service.chat(req.usuario.id, mensagem.trim())
    res.json({ resposta })
  } catch (e) {
    console.error('Coach IA error:', e.message)
    res.status(500).json({ erro: 'Erro ao processar mensagem' })
  }
}

async function limpar(req, res) {
  service.limparSessao(req.usuario.id)
  res.json({ ok: true })
}

module.exports = { chat, limpar }
