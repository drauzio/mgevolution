const router = require('express').Router()
const ctrl = require('../controllers/exercicio.controller')

router.get('/',                    ctrl.listar)
router.post('/',                   ctrl.criar)
router.get('/:id',                 ctrl.buscar)
router.put('/:id',                 ctrl.atualizar)
router.patch('/:id/toggle-ativo',  ctrl.toggleAtivo)

module.exports = router
