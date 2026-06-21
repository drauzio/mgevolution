const router = require('express').Router()
const ctrl   = require('../controllers/template.controller')

router.get('/',              ctrl.listar)
router.post('/',             ctrl.criar)
router.post('/gerar-ia',     ctrl.gerarComIA)
router.get('/:id',           ctrl.buscar)
router.put('/:id',           ctrl.atualizar)
router.post('/:id/clonar',   ctrl.clonar)

module.exports = router
