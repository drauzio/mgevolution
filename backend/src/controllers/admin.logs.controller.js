const auditoria = require('../services/auditoria.service')
const whatsapp  = require('../services/whatsapp.service')

async function listarAuditoria(req, res, next) {
  try {
    const { pagina = 1, acao, entidade, id_usuario } = req.query
    res.json(await auditoria.listar({ pagina: Number(pagina), acao: acao || undefined, entidade: entidade || undefined, id_usuario_filtro: id_usuario ? Number(id_usuario) : undefined }))
  } catch (err) { next(err) }
}

async function listarWhatsapp(req, res, next) {
  try {
    const { pagina = 1, tipo, status } = req.query
    res.json(await whatsapp.listarLogs({ pagina: Number(pagina), tipo: tipo || undefined, status: status || undefined }))
  } catch (err) { next(err) }
}

async function ultimaModificacao(req, res, next) {
  try {
    const { entidade, id } = req.params
    res.json(await auditoria.ultimaModificacao(entidade, Number(id)) || {})
  } catch (err) { next(err) }
}

module.exports = { listarAuditoria, listarWhatsapp, ultimaModificacao }
