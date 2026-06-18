const svc       = require('../services/admin.planos.service')
const auditoria = require('../services/auditoria.service')

function audit(req, dados) { auditoria.registrar({ id_usuario: req.usuario.id, nome_usuario: req.usuario.nome, ip: req.ip, ...dados }).catch(() => {}) }

async function listar(req, res, next) {
  try { res.json(await svc.listar()) } catch (e) { next(e) }
}

async function buscar(req, res, next) {
  try {
    const p = await svc.buscarPorId(Number(req.params.id))
    if (!p) return res.status(404).json({ erro: 'Plano não encontrado' })
    res.json(p)
  } catch (e) { next(e) }
}

async function criar(req, res, next) {
  try {
    const { nome } = req.body
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' })
    const novo = await svc.criar(req.body)
    audit(req, {
      acao: 'criar', entidade: 'plano', id_entidade: novo.id_plano,
      descricao: `Plano criado: ${nome}`,
      dados_depois: novo,
    })
    res.status(201).json(novo)
  } catch (e) { next(e) }
}

async function atualizar(req, res, next) {
  try {
    const { nome, preco, duracao_dias } = req.body
    if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' })
    const idPlano  = Number(req.params.id)
    const anterior = await svc.buscarPorId(idPlano)
    await svc.atualizar(idPlano, req.body)
    const mudancas = []
    if (anterior?.nome         !== nome)          mudancas.push(`nome: ${anterior?.nome} → ${nome}`)
    if (String(anterior?.preco) !== String(preco)) mudancas.push(`preço: ${anterior?.preco} → ${preco}`)
    if (anterior?.duracao_dias  !== duracao_dias)  mudancas.push(`duração: ${anterior?.duracao_dias}d → ${duracao_dias}d`)
    if (mudancas.length) {
      audit(req, {
        acao: 'atualizar', entidade: 'plano', id_entidade: idPlano,
        descricao: mudancas.join(' · '),
        dados_antes:  anterior,
        dados_depois: { ...anterior, nome, preco, duracao_dias },
      })
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
}

async function toggleAtivo(req, res, next) {
  try {
    const idPlano = Number(req.params.id)
    const plano   = await svc.buscarPorId(idPlano)
    await svc.toggleAtivo(idPlano)
    const acao = plano?.ativo ? 'inativar' : 'reativar'
    audit(req, {
      acao, entidade: 'plano', id_entidade: idPlano,
      descricao: `Plano ${plano?.ativo ? 'inativado' : 'reativado'}: ${plano?.nome || idPlano}`,
      dados_antes:  plano,
      dados_depois: { ...plano, ativo: plano?.ativo ? 0 : 1 },
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
}

module.exports = { listar, buscar, criar, atualizar, toggleAtivo }
