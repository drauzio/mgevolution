const svc       = require('../services/admin.nutricionistas.service')
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
    const { nome, email, telefone, tipo_documento, numero_documento, senha } = req.body
    if (!nome || !email) return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios' })
    const resultado = await svc.criar({ nome, email, telefone, tipo_documento, numero_documento, senha })
    audit(req, {
      acao: 'criar', entidade: 'nutricionista', id_entidade: resultado.id_usuario,
      descricao: `Nutricionista criada: ${nome}`,
      dados_depois: { nome, email, telefone, tipo_documento, numero_documento },
    })
    res.status(201).json(resultado)
  } catch (err) {
    if (err.status) return res.status(err.status).json({ erro: err.message })
    next(err)
  }
}

async function buscar(req, res, next) {
  try {
    const nutri = await svc.buscarPorId(Number(req.params.id))
    if (!nutri) return res.status(404).json({ erro: 'Nutricionista não encontrada' })
    res.json(nutri)
  } catch (err) { next(err) }
}

async function atualizar(req, res, next) {
  try {
    const { nome, email, telefone, tipo_documento, numero_documento, senha } = req.body
    if (!nome || !email) return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios' })
    const id       = Number(req.params.id)
    const anterior = await svc.buscarPorId(id)
    await svc.atualizar(id, req.body)
    const mudancas = []
    if (anterior?.nome             !== nome)             mudancas.push(`nome: ${anterior?.nome} → ${nome}`)
    if (anterior?.email            !== email)            mudancas.push(`email: ${anterior?.email} → ${email}`)
    if (anterior?.telefone         !== telefone)         mudancas.push(`telefone: ${anterior?.telefone || '—'} → ${telefone || '—'}`)
    if (anterior?.numero_documento !== numero_documento) mudancas.push(`documento: ${anterior?.numero_documento || '—'} → ${numero_documento || '—'}`)
    if (senha)                                           mudancas.push('senha alterada')
    if (mudancas.length) {
      audit(req, {
        acao: 'atualizar', entidade: 'nutricionista', id_entidade: id,
        descricao: mudancas.join(' · '),
        dados_antes:  semSenha(anterior),
        dados_depois: { nome, email, telefone, tipo_documento, numero_documento },
      })
    }
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function toggleAtivo(req, res, next) {
  try {
    const id    = Number(req.params.id)
    const nutri = await svc.buscarPorId(id)
    await svc.toggleAtivo(id)
    const ativo = nutri?.ativo
    audit(req, {
      acao: ativo ? 'inativar' : 'reativar', entidade: 'nutricionista', id_entidade: id,
      descricao: `Nutricionista ${ativo ? 'inativada' : 'reativada'}: ${nutri?.nome || id}`,
      dados_antes:  semSenha(nutri),
      dados_depois: { ...semSenha(nutri), ativo: ativo ? 0 : 1 },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, criar, buscar, atualizar, toggleAtivo }
