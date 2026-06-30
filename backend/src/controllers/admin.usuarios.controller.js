const svc        = require('../services/admin.usuarios.service')
const auditoria  = require('../services/auditoria.service')
const perfilSvc  = require('../services/perfil.service')
const { uploadBuffer, gerarSasReadUrl } = require('../utils/azureBlob')
const blobPaths  = require('../utils/blobPaths')

function semSenha(obj) { if (!obj) return obj; const { senha, ...resto } = obj; return resto }
function audit(req, dados) { auditoria.registrar({ id_usuario: req.usuario.id, nome_usuario: req.usuario.nome, ip: req.ip, ...dados }).catch(() => {}) }

async function verificarEmail(req, res, next) {
  try {
    const { email, id } = req.query
    if (!email) return res.json({ disponivel: true })
    const pool = await (require('../database/connection')).getPool()
    const { sql } = require('../database/connection')
    const r = await pool.request()
      .input('email', sql.VarChar(120), email)
      .query(`SELECT id_usuario FROM dbo.usuario WHERE email = @email`)
    const encontrado = r.recordset[0]
    const disponivel = !encontrado || (id && String(encontrado.id_usuario) === String(id))
    res.json({ disponivel })
  } catch (e) { next(e) }
}

async function listar(req, res, next) {
  try {
    const { busca = '', status = 'todos' } = req.query
    res.json(await svc.listar({ busca, status }))
  } catch (e) { next(e) }
}

async function buscar(req, res, next) {
  try {
    const u = await svc.buscarPorId(Number(req.params.id))
    if (!u) return res.status(404).json({ erro: 'Usuário não encontrado' })
    res.json(u)
  } catch (e) { next(e) }
}

async function criar(req, res, next) {
  try {
    const { nome, email, telefone } = req.body
    const id = await svc.criar(req.body)
    audit(req, {
      acao: 'criar', entidade: 'usuario', id_entidade: id,
      descricao: `Usuário criado: ${nome}`,
      dados_depois: { nome, email, telefone },
    })
    res.status(201).json({ id_usuario: id })
  } catch (e) { next(e) }
}

async function atualizar(req, res, next) {
  try {
    const { nome, email, telefone, senha } = req.body
    const id       = Number(req.params.id)
    const anterior = await svc.buscarPorId(id)
    await svc.atualizar(id, req.body)
    const mudancas = []
    if (anterior?.nome     !== nome)     mudancas.push(`nome: ${anterior?.nome} → ${nome}`)
    if (anterior?.email    !== email)    mudancas.push(`email: ${anterior?.email} → ${email}`)
    if (anterior?.telefone !== telefone) mudancas.push(`telefone: ${anterior?.telefone || '—'} → ${telefone || '—'}`)
    if (senha)                           mudancas.push('senha alterada')
    if (mudancas.length) {
      audit(req, {
        acao: 'atualizar', entidade: 'usuario', id_entidade: id,
        descricao: mudancas.join(' · '),
        dados_antes:  semSenha(anterior),
        dados_depois: { nome, email, telefone },
      })
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
}

async function toggleAtivo(req, res, next) {
  try {
    const id      = Number(req.params.id)
    const usuario = await svc.buscarPorId(id)
    await svc.toggleAtivo(id)
    const ativo = usuario?.ativo
    audit(req, {
      acao: ativo ? 'inativar' : 'reativar', entidade: 'usuario', id_entidade: id,
      descricao: `Usuário ${ativo ? 'inativado' : 'reativado'}: ${usuario?.nome || id}`,
      dados_antes:  semSenha(usuario),
      dados_depois: { ...semSenha(usuario), ativo: ativo ? 0 : 1 },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
}

async function uploadFoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ erro: 'Nenhuma imagem enviada' })
    const id      = Number(req.params.id)
    const blobName = blobPaths.fotoUsuario({ id_usuario: id, mimeType: req.file.mimetype })
    await uploadBuffer({ buffer: req.file.buffer, blobName, contentType: req.file.mimetype })
    const sasUrl = await gerarSasReadUrl(blobName, { minutes: 60 * 24 * 365 * 5 })
    await perfilSvc.atualizarFoto(id, sasUrl)
    res.json({ foto_url: sasUrl })
  } catch (e) { next(e) }
}

module.exports = { listar, buscar, criar, atualizar, toggleAtivo, verificarEmail, uploadFoto }
