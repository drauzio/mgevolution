const router = require('express').Router()
const ctrl   = require('../controllers/evolucao.controller')

router.get('/resumo',    ctrl.resumo)
router.get('/sessoes',   ctrl.sessoes)
router.get('/medidas',   ctrl.listarMedidas)
router.post('/medidas',  ctrl.adicionarMedida)
router.get('/carga',     ctrl.historicoExercicio)
router.get('/exercicios',   ctrl.exercicios)
router.get('/analise-ia',   ctrl.buscarAnalise)
router.post('/analise-ia',  ctrl.analiseIA)
router.get('/fotos',        ctrl.listarFotos)
router.post('/fotos',       ctrl.uploadFoto)
router.delete('/fotos/:id', ctrl.deletarFoto)
router.get('/shape-future',  ctrl.shapeFutureGet)
router.post('/shape-future', ctrl.shapeFuturePost)

module.exports = router
