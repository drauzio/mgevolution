const { Router } = require('express')
const ctrl = require('../controllers/avaliacao.controller')

const router = Router()

router.get('/status',    ctrl.status)
router.get('/minha',     ctrl.minha)
router.get('/perguntas', ctrl.perguntas)
router.post('/',         ctrl.salvar)

module.exports = router
