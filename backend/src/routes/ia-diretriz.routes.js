const router = require('express').Router()
const ctrl   = require('../controllers/ia-diretriz.controller')

router.get('/',     ctrl.listar)
router.post('/',    ctrl.criar)
router.get('/:id',  ctrl.buscar)
router.put('/:id',  ctrl.atualizar)
router.delete('/:id', ctrl.deletar)

module.exports = router
