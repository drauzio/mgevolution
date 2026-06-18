const router = require('express').Router()
const ctrl = require('../controllers/notificacoes.controller')

router.get('/', ctrl.listar)

module.exports = router
