const router = require('express').Router()
const ctrl = require('../controllers/treino.controller')

router.get('/',                ctrl.listar)
router.post('/',               ctrl.criar)
router.get('/exercicios',      ctrl.exercicios)
router.get('/meu-protocolo',   ctrl.meuProtocolo)
router.get('/:id',             ctrl.buscar)
router.put('/:id',             ctrl.atualizar)

module.exports = router
