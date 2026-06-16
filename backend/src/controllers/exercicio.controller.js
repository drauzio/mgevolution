const svc = require('../services/exercicio.service')

async function listar(req, res, next) {
  try {
    const { busca, grupo, ativo } = req.query
    const dados = await svc.listar({
      busca,
      grupo,
      ativo: ativo === undefined ? undefined : ativo === 'true',
    })
    res.json(dados)
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const ex = await svc.buscarPorId(Number(req.params.id))
    if (!ex) return res.status(404).json({ erro: 'Exercício não encontrado' })
    res.json(ex)
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    const result = await svc.criar(req.body)
    res.status(201).json(result)
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

module.exports = { listar, buscar, criar, atualizar, toggleAtivo }
