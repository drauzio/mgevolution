const svc = require('../services/menu-admin.service')

function soAdmin(req, res) {
  if (req.usuario?.perfil !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito' })
    return false
  }
  return true
}

async function listar(req, res, next) {
  try {
    if (!soAdmin(req, res)) return
    res.json(await svc.listar())
  } catch (err) { next(err) }
}

async function atualizarPerfis(req, res, next) {
  try {
    if (!soAdmin(req, res)) return
    const { perfis } = req.body
    if (!Array.isArray(perfis)) return res.status(400).json({ erro: 'perfis deve ser array' })
    await svc.atualizarPerfis(Number(req.params.id), perfis)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function criar(req, res, next) {
  try {
    if (!soAdmin(req, res)) return
    const { id_menu, nome, caminho, icone, perfis } = req.body
    if (!id_menu || !nome || !caminho) return res.status(400).json({ erro: 'id_menu, nome e caminho são obrigatórios' })
    const id = await svc.criarItem({ id_menu, nome, caminho, icone, perfisNomes: perfis || [] })
    res.status(201).json({ id_menu_item: id })
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    if (!soAdmin(req, res)) return
    const { id_menu, nome, caminho, icone, perfis } = req.body
    if (!id_menu || !nome || !caminho) return res.status(400).json({ erro: 'id_menu, nome e caminho são obrigatórios' })
    await svc.atualizarItem(Number(req.params.id), { id_menu, nome, caminho, icone, perfisNomes: perfis || [] })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function deletar(req, res, next) {
  try {
    if (!soAdmin(req, res)) return
    await svc.deletarItem(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function reordenar(req, res, next) {
  try {
    if (!soAdmin(req, res)) return
    const { itens } = req.body
    if (!Array.isArray(itens)) return res.status(400).json({ erro: 'itens deve ser array' })
    await svc.reordenarItens(itens)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, atualizarPerfis, criar, atualizar, deletar, reordenar }
