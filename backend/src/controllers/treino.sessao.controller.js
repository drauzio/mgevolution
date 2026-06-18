const svc          = require('../services/treino.sessao.service')
const conquistaSvc = require('../services/conquista.service')
const desafioSvc   = require('../services/desafio.service')
const feedSvc      = require('../services/feed.service')

async function buscarOuCriar(req, res, next) {
  try {
    const { idTreinoDia, idProtocolo } = req.query
    if (!idTreinoDia || !idProtocolo) return res.status(400).json({ erro: 'idTreinoDia e idProtocolo obrigatórios' })
    const sessao = await svc.buscarOuCriar(req.usuario.id, Number(idTreinoDia), Number(idProtocolo))
    if (!sessao) return res.status(404).json({ erro: 'Nenhum exercício cadastrado para este dia' })
    res.json(sessao)
  } catch (err) { next(err) }
}

async function iniciar(req, res, next) {
  try {
    const dados = await svc.iniciar(Number(req.params.idSessao), req.usuario.id)
    res.json(dados)
  } catch (err) { next(err) }
}

async function marcarExercicio(req, res, next) {
  try {
    const { idSessao, idExercicio } = req.params
    const { feito, carga_usada } = req.body
    await svc.marcarExercicio(Number(idSessao), Number(idExercicio), feito, carga_usada)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function concluir(req, res, next) {
  try {
    const idSessao  = Number(req.params.idSessao)
    const idUsuario = req.usuario.id
    const nome      = req.usuario.nome

    await svc.concluir(idSessao, idUsuario)
    res.json({ ok: true })

    // fire-and-forget: conquistas, desafios e feed
    ;(async () => {
      try {
        feedSvc.publicar({ id_usuario: idUsuario, tipo: 'treino', titulo: `${nome} concluiu um treino 💪`, id_referencia: idSessao })

        const [novasConquistas, desafiosConcluidos] = await Promise.all([
          conquistaSvc.verificarEDesbloquear(idUsuario),
          desafioSvc.atualizarProgressoTreinos(idUsuario),
        ])

        for (const c of novasConquistas) {
          feedSvc.publicar({ id_usuario: idUsuario, tipo: 'conquista', titulo: `${nome} desbloqueou "${c.nome}" ${c.icone}`, subtitulo: c.descricao })
        }
        for (const d of desafiosConcluidos) {
          feedSvc.publicar({ id_usuario: idUsuario, tipo: 'desafio', titulo: `${nome} completou o desafio "${d.titulo}" 🎖️`, id_referencia: d.id_desafio })
        }
      } catch {}
    })()
  } catch (err) { next(err) }
}

async function cancelar(req, res, next) {
  try {
    await svc.cancelar(Number(req.params.idSessao), req.usuario.id)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function historico(req, res, next) {
  try {
    const dados = await svc.historico(req.usuario.id)
    res.json(dados)
  } catch (err) { next(err) }
}

module.exports = { buscarOuCriar, iniciar, marcarExercicio, concluir, cancelar, historico }
