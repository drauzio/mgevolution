const svc        = require('../services/perfil.service')
const { uploadBuffer, gerarSasReadUrl } = require('../utils/azureBlob')
const blobPaths  = require('../utils/blobPaths')

async function buscar(req, res, next) {
  try { res.json(await svc.buscar(req.usuario.id)) } catch (e) { next(e) }
}

async function atualizar(req, res, next) {
  try {
    await svc.atualizar(req.usuario.id, req.body)
    res.json({ ok: true })
  } catch (e) { next(e) }
}

async function uploadFoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada' })
    const blobName = blobPaths.fotoUsuario({ id_usuario: req.usuario.id, mimeType: req.file.mimetype })
    await uploadBuffer({ buffer: req.file.buffer, blobName, contentType: req.file.mimetype })
    const sasUrl = await gerarSasReadUrl(blobName, { minutes: 60 * 24 * 365 * 5 })
    await svc.atualizarFoto(req.usuario.id, sasUrl)
    res.json({ foto_url: sasUrl })
  } catch (e) { next(e) }
}

async function trocarSenha(req, res, next) {
  try {
    const { senha_atual, nova_senha } = req.body
    if (!senha_atual || !nova_senha) return res.status(400).json({ erro: 'Preencha todos os campos' })
    await svc.trocarSenha(req.usuario.id, senha_atual, nova_senha)
    res.json({ ok: true })
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.message })
  }
}

module.exports = { buscar, atualizar, uploadFoto, trocarSenha }
