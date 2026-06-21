const svc = require('../services/treino.service')

async function listar(req, res, next) {
  try {
    const { id_aluno } = req.query
    const dados = await svc.listar({ idAluno: id_aluno ? Number(id_aluno) : undefined })
    res.json(dados)
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const proto = await svc.buscar(Number(req.params.id))
    if (!proto) return res.status(404).json({ erro: 'Protocolo não encontrado' })
    res.json(proto)
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
    await svc.atualizar(Number(req.params.id), req.body, req.usuario.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function exercicios(req, res, next) {
  try {
    const { busca, grupo } = req.query
    res.json(await svc.buscarExercicios(busca, grupo))
  } catch (err) { next(err) }
}

async function meuProtocolo(req, res, next) {
  try {
    res.json(await svc.buscarAtivo(req.usuario.id) || null)
  } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar, exercicios, meuProtocolo }
