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

async function atualizarStatusPlano(req, res, next) {
  try {
    const { status } = req.body
    if (!['rascunho', 'revisao', 'liberado'].includes(status))
      return res.status(400).json({ erro: 'Status inválido' })
    await svc.atualizarStatusPlano(Number(req.params.id), status)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function toggleAtivo(req, res, next) {
  try {
    await svc.toggleAtivo(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function deletar(req, res, next) {
  try {
    await svc.deletar(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function meuPlanoAndamento(req, res, next) {
  try {
    const plano = await svc.buscarPlanoEmAndamento(req.usuario.id)
    res.json(plano || null)
  } catch (err) { next(err) }
}

async function minhaSolicitacao(req, res, next) {
  try {
    const sol = await svc.buscarSolicitacao(req.usuario.id)
    res.json(sol || null)
  } catch (err) { next(err) }
}

async function solicitarDieta(req, res, next) {
  try {
    const result = await svc.solicitarDieta(req.usuario.id, req.body)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

async function listarSolicitacoes(req, res, next) {
  try {
    const { status } = req.query
    const lista = await svc.listarSolicitacoes(status || null)
    res.json(lista)
  } catch (err) { next(err) }
}

async function atualizarStatusSolicitacao(req, res, next) {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ erro: 'status é obrigatório' })
    await svc.atualizarStatusSolicitacao(Number(req.params.id), status)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function gerarComIA(req, res, next) {
  try {
    const idNutri = req.body?.id_nutricionista ? Number(req.body.id_nutricionista) : req.usuario.id
    const result = await svc.gerarComIA(Number(req.params.id), idNutri)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

async function gerarSubstituicoes(req, res, next) {
  try {
    const result = await svc.gerarSubstituicoes(Number(req.params.id))
    res.json(result)
  } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar, toggleAtivo, deletar, atualizarStatusPlano, meuPlano, meuPlanoAndamento, clonar, dadosAluno, minhaSolicitacao, solicitarDieta, listarSolicitacoes, atualizarStatusSolicitacao, gerarComIA, gerarSubstituicoes }
