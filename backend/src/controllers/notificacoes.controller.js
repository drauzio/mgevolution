const svc = require('../services/notificacoes.service')

async function listar(req, res, next) {
  try {
    const { id, perfis = [] } = req.usuario
    const isAdmin = perfis.includes('admin') || req.usuario.perfil === 'admin'
    const isAluno = perfis.includes('aluno') || req.usuario.perfil === 'aluno'

    const itens = []

    if (isAdmin) {
      const adminData = await svc.buscarParaAdmin()
      itens.push(...adminData.itens)
    }

    if (isAluno || isAdmin) {
      const adminMsgs = await svc.buscarParaAlunoComAdmin(id).catch(() => [])
      itens.push(...adminMsgs.filter(n => !n.lida).map(n => ({ ...n, tipo: 'admin', fonte: 'admin' })))
      if (isAluno) {
        const { itens: automaticas = [] } = await svc.buscarParaAluno(id)
        itens.push(...automaticas.map(n => ({ ...n, fonte: 'sistema' })))
      }
    }

    const total = itens.filter(n => n.fonte === 'admin' ? !n.lida : true).length
    res.json({ total, itens })
  } catch (err) { next(err) }
}

async function enviar(req, res, next) {
  try {
    const { id_usuario, titulo, descricao, urgente } = req.body
    if (!id_usuario || !titulo) return res.status(400).json({ erro: 'id_usuario e titulo obrigatórios' })
    await svc.enviarParaAluno({ id_admin: req.usuario.id, id_usuario, titulo, descricao, urgente })
    res.status(201).json({ ok: true })
  } catch (err) { next(err) }
}

async function listarEnviadas(req, res, next) {
  try {
    const lista = await svc.listarTodas()
    res.json(lista)
  } catch (err) { next(err) }
}

async function deletar(req, res, next) {
  try {
    await svc.deletarNotificacao(Number(req.params.id))
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function marcarLida(req, res, next) {
  try {
    await svc.marcarLida(Number(req.params.id), req.usuario.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function listarAlunos(req, res, next) {
  try {
    res.json(await svc.listarAlunos())
  } catch (err) { next(err) }
}

module.exports = { listar, enviar, listarEnviadas, deletar, marcarLida, listarAlunos }
