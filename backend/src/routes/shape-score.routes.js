const router = require('express').Router()
const ctrl = require('../controllers/shape-score.controller')

router.post('/',          ctrl.registrar)
router.get('/historico',  ctrl.historico)
router.get('/media',      ctrl.media)

module.exports = router
