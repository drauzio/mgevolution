const svc = require('../services/admin.nutricionistas.service')

async function listar(req, res, next) {
  try {
    const { busca = '', status = 'todos' } = req.query
    res.json(await svc.listar({ busca, status }))
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    const { nome, email, telefone, senha } = req.body
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' })
    const id = await svc.criar({ nome, email, telefone, senha })
    res.status(201).json({ id_usuario: id })
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const nutri = await svc.buscarPorId(Number(req.params.id))
    if (!nutri) return res.status(404).json({ erro: 'Nutricionista não encontrada' })
    res.json(nutri)
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    await svc.atualizar(Number(req.params.id), req.body)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function toggleAtivo(req, res, next) {
  try {
    await svc.toggleAtivo(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, criar, buscar, atualizar, toggleAtivo }
