const svc = require('../services/dieta.service')

async function listar(req, res, next) {
  try {
    const { id_aluno } = req.query
    const dados = await svc.listarPlanos(id_aluno ? Number(id_aluno) : undefined)
    res.json(dados)
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const plano = await svc.buscarCompleto(Number(req.params.id))
    if (!plano) return res.status(404).json({ erro: 'Plano não encontrado' })
    res.json(plano)
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    const result = await svc.criar(req.body, req.usuario.id)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    await svc.atualizar(Number(req.params.id), req.body)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function meuPlano(req, res, next) {
  try {
    const plano = await svc.buscarPlanoAtivo(req.usuario.id)
    res.json(plano || null)
  } catch (err) { next(err) }
}

async function dadosAluno(req, res, next) {
  try {
    const dados = await svc.dadosAlunoParaDieta(Number(req.params.id))
    res.json(dados || null)
  } catch (err) { next(err) }
}

async function clonar(req, res, next) {
  try {
    const { id_usuario } = req.body
    if (!id_usuario) return res.status(400).json({ erro: 'id_usuario é obrigatório' })
    const result = await svc.clonar(Number(req.params.id), Number(id_usuario), req.usuario.id)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar, meuPlano, clonar, dadosAluno }
