const router = require('express').Router()
const ctrl   = require('../controllers/treino.controller')
const sessao = require('../controllers/treino.sessao.controller')

router.get('/',                ctrl.listar)
router.post('/',               ctrl.criar)
router.get('/exercicios',      ctrl.exercicios)
router.get('/meu-protocolo',   ctrl.meuProtocolo)
router.get('/sessao/historico',                          sessao.historico)
router.get('/sessao',                                    sessao.buscarOuCriar)
router.patch('/sessao/:idSessao/iniciar',                sessao.iniciar)
router.patch('/sessao/:idSessao/concluir',               sessao.concluir)
router.delete('/sessao/:idSessao',                       sessao.cancelar)
router.patch('/sessao/:idSessao/exercicio/:idExercicio', sessao.marcarExercicio)
router.get('/:id',             ctrl.buscar)
router.put('/:id',             ctrl.atualizar)

module.exports = router
