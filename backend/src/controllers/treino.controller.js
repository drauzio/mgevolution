const svc = require('../services/treino.service')

async function listar(req, res, next) {
  try {
    const { id_aluno, templates } = req.query
    const apenasTemplates = templates === '1' ? true : templates === '0' ? false : undefined
    const dados = await svc.listarProtocolos({
      idPersonal: req.usuario.perfis?.includes('admin') ? undefined : req.usuario.id,
      idAluno: id_aluno ? Number(id_aluno) : undefined,
      apenasTemplates,
    })
    res.json(dados)
  } catch (err) { next(err) }
}

async function buscar(req, res, next) {
  try {
    const proto = await svc.buscarCompleto(Number(req.params.id))
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
    const lista = await svc.buscarExercicios(busca, grupo)
    res.json(lista)
  } catch (err) { next(err) }
}

async function meuProtocolo(req, res, next) {
  try {
    const proto = await svc.buscarProtocoloAtivo(req.usuario.id)
    res.json(proto || null)
  } catch (err) { next(err) }
}

module.exports = { listar, buscar, criar, atualizar, exercicios, meuProtocolo }
