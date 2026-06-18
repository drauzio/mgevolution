const svc = require('../services/desafio.service')

async function listar(req, res, next) {
  try { res.json(await svc.listarAdmin()) } catch (e) { next(e) }
}

async function criar(req, res, next) {
  try {
    const { titulo, tipo_meta, valor_meta, data_inicio, data_fim } = req.body
    if (!titulo || !tipo_meta || !valor_meta || !data_inicio || !data_fim)
      return res.status(400).json({ erro: 'Título, tipo, meta e datas são obrigatórios' })
    res.status(201).json(await svc.criar(req.body))
  } catch (e) { next(e) }
}

async function toggleAtivo(req, res, next) {
  try {
    await svc.toggleAtivo(Number(req.params.id))
    res.json({ ok: true })
  } catch (e) { next(e) }
}

module.exports = { listar, criar, toggleAtivo }
