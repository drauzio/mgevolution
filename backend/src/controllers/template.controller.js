const svc = require('../services/template.service')

async function listar(req, res, next) {
  try {
    res.json(await svc.listar())
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const t = await svc.buscar(Number(req.params.id))
    if (!t) return res.status(404).json({ erro: 'Template não encontrado' })
    res.json(t)
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    const idPersonal = req.body.id_personal ? Number(req.body.id_personal) : req.usuario.id
    const result = await svc.criar(req.body, idPersonal)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    await svc.atualizar(Number(req.params.id), req.body)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function clonar(req, res, next) {
  try {
    const { id_usuario } = req.body
    if (!id_usuario) return res.status(400).json({ erro: 'id_usuario é obrigatório' })
    const result = await svc.clonarTemplateEspecifico(
      Number(req.params.id),
      Number(id_usuario),
      req.usuario.id
    )
    res.status(201).json(result)
  } catch (err) { next(err) }
}

async function gerarComIA(req, res, next) {
  try {
    const idPersonal = req.body?.id_personal ? Number(req.body.id_personal) : req.usuario.id
    const result = await svc.gerarComIA(req.body, idPersonal)
    res.json(result)
  } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar, clonar, gerarComIA }
