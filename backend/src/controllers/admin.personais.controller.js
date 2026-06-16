const svc = require('../services/admin.personais.service')

async function listar(req, res, next) {
  try {
    const { busca = '', status = 'todos' } = req.query
    const dados = await svc.listar({ busca, status })
    res.json(dados)
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
    const personal = await svc.buscarPorId(Number(req.params.id))
    if (!personal) return res.status(404).json({ erro: 'Personal não encontrado' })
    res.json(personal)
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
