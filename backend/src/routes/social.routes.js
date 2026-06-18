const { Router } = require('express')
const ctrl = require('../controllers/feed.controller')

const router = Router()

router.get('/feed',                  ctrl.listar)
router.post('/feed/:id/reagir',      ctrl.reagir)
router.get('/conquistas',            ctrl.minhasConquistas)
router.get('/desafios',              ctrl.desafios)
router.post('/desafios/:id/entrar',  ctrl.entrarDesafio)
router.get('/ranking',               ctrl.ranking)

module.exports = router
