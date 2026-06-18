const svc       = require('../services/admin.personais.service')
const auditoria = require('../services/auditoria.service')

function semSenha(obj) { if (!obj) return obj; const { senha, ...resto } = obj; return resto }
function audit(req, dados) { auditoria.registrar({ id_usuario: req.usuario.id, nome_usuario: req.usuario.nome, ip: req.ip, ...dados }).catch(() => {}) }

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
    audit(req, {
      acao: 'criar', entidade: 'personal', id_entidade: id,
      descricao: `Personal criado: ${nome}`,
      dados_depois: { nome, email, telefone },
    })
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
    const { nome, email, telefone, senha } = req.body
    if (!nome || !email) return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios' })
    const id       = Number(req.params.id)
    const anterior = await svc.buscarPorId(id)
    await svc.atualizar(id, req.body)
    const mudancas = []
    if (anterior?.nome     !== nome)     mudancas.push(`nome: ${anterior?.nome} → ${nome}`)
    if (anterior?.email    !== email)    mudancas.push(`email: ${anterior?.email} → ${email}`)
    if (anterior?.telefone !== telefone) mudancas.push(`telefone: ${anterior?.telefone || '—'} → ${telefone || '—'}`)
    if (senha)                           mudancas.push('senha alterada')
    if (mudancas.length) {
      audit(req, {
        acao: 'atualizar', entidade: 'personal', id_entidade: id,
        descricao: mudancas.join(' · '),
        dados_antes:  semSenha(anterior),
        dados_depois: { nome, email, telefone },
      })
    }
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function toggleAtivo(req, res, next) {
  try {
    const id      = Number(req.params.id)
    const personal = await svc.buscarPorId(id)
    await svc.toggleAtivo(id)
    const ativo = personal?.ativo
    audit(req, {
      acao: ativo ? 'inativar' : 'reativar', entidade: 'personal', id_entidade: id,
      descricao: `Personal ${ativo ? 'inativado' : 'reativado'}: ${personal?.nome || id}`,
      dados_antes:  semSenha(personal),
      dados_depois: { ...semSenha(personal), ativo: ativo ? 0 : 1 },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, criar, buscar, atualizar, toggleAtivo }
