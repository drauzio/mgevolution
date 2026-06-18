const svc       = require('../services/admin.alunos.service')
const waSvc     = require('../services/whatsapp.service')
const auditoria = require('../services/auditoria.service')

function semSenha(obj) { if (!obj) return obj; const { senha, ...resto } = obj; return resto }
function audit(req, dados) { auditoria.registrar({ id_usuario: req.usuario.id, nome_usuario: req.usuario.nome, ip: req.ip, ...dados }).catch(() => {}) }

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
    waSvc.boasVindasAluno({ id_usuario: id, nome, telefone }).catch(() => {})
    audit(req, {
      acao: 'criar', entidade: 'aluno', id_entidade: id,
      descricao: `Aluno criado: ${nome}`,
      dados_depois: { nome, email, telefone },
    })
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
    const id       = Number(req.params.id)
    const anterior = await svc.buscarPorId(id)
    await svc.atualizar(id, { nome, email, telefone, senha })
    const mudancas = []
    if (anterior?.nome     !== nome)     mudancas.push(`nome: ${anterior?.nome} → ${nome}`)
    if (anterior?.email    !== email)    mudancas.push(`email: ${anterior?.email} → ${email}`)
    if (anterior?.telefone !== telefone) mudancas.push(`telefone: ${anterior?.telefone || '—'} → ${telefone || '—'}`)
    if (senha)                           mudancas.push('senha alterada')
    if (mudancas.length) {
      audit(req, {
        acao: 'atualizar', entidade: 'aluno', id_entidade: id,
        descricao: mudancas.join(' · '),
        dados_antes:  semSenha(anterior),
        dados_depois: { nome, email, telefone },
      })
    }
    res.json({ ok: true })
  } catch (err) {
    if (err.number === 2627) return res.status(409).json({ erro: 'E-mail já cadastrado' })
    next(err)
  }
}

async function toggleAtivo(req, res, next) {
  try {
    const id    = Number(req.params.id)
    const aluno = await svc.buscarPorId(id)
    await svc.toggleAtivo(id)
    const ativo = aluno?.ativo
    audit(req, {
      acao: ativo ? 'inativar' : 'reativar', entidade: 'aluno', id_entidade: id,
      descricao: `Aluno ${ativo ? 'inativado' : 'reativado'}: ${aluno?.nome || id}`,
      dados_antes:  semSenha(aluno),
      dados_depois: { ...semSenha(aluno), ativo: ativo ? 0 : 1 },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { listar, criar, buscar, atualizar, toggleAtivo }
