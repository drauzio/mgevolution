const { Router } = require('express')
const { listar } = require('../controllers/menu.controller')

const router = Router()

router.get('/', listar)

module.exports = router
