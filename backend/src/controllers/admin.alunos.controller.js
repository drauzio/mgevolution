const svc = require('../services/admin.alunos.service')

async function listar(req, res, next) {
  try {
    const { busca, status } = req.query
    res.json(await svc.listar({ busca, status }))
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    const { nome, email, telefone, senha } = req.body
    if (!nome || !email || !senha) return res.status(400).json({ erro: 'nome, email e senha obrigatórios' })
    const id = await svc.criar({ nome, email, telefone, senha })
    res.status(201).json({ id_usuario: id })
  } catch (err) {
    if (err.number === 2627) return res.status(409).json({ erro: 'E-mail já cadastrado' })
    next(err)
  }
}

async function buscar(req, res, next) {
  try {
    const aluno = await svc.buscarPorId(Number(req.params.id))
    if (!aluno) return res.status(404).json({ erro: 'Aluno não encontrado' })
    res.json(aluno)
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    const { nome, email, telefone, senha } = req.body
    if (!nome || !email) return res.status(400).json({ erro: 'nome e email obrigatórios' })
    await svc.atualizar(Number(req.params.id), { nome, email, telefone, senha })
    res.json({ ok: true })
  } catch (err) {
    if (err.number === 2627) return res.status(409).json({ erro: 'E-mail já cadastrado' })
    next(err)
  }
}

async function toggleAtivo(req, res, next) {
  try {
    await svc.toggleAtivo(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, criar, buscar, atualizar, toggleAtivo }
