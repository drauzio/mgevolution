const router = require('express').Router()
const ctrl = require('../controllers/dieta.controller')

router.get('/',           ctrl.listar)
router.post('/',          ctrl.criar)
router.get('/meu-plano',        ctrl.meuPlano)
router.get('/aluno/:id/dados',  ctrl.dadosAluno)
router.get('/:id',        ctrl.buscar)
router.put('/:id',        ctrl.atualizar)
router.post('/:id/clonar', ctrl.clonar)

module.exports = router
