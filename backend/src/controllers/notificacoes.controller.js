const svc = require('../services/notificacoes.service')

async function listar(req, res, next) {
  try {
    const { id, perfil } = req.usuario
    if (perfil === 'admin') {
      res.json(await svc.buscarParaAdmin())
    } else if (perfil === 'aluno') {
      res.json(await svc.buscarParaAluno(id))
    } else {
      res.json({ total: 0, itens: [] })
    }
  } catch (err) { next(err) }
}

module.exports = { listar }
