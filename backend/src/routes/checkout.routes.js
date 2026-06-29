const router = require('express').Router()
const svc    = require('../services/mp.service')
const sql    = require('mssql')
const { getPool } = require('../database/db')

router.post('/preferencia', async (req, res, next) => {
  try {
    const { id_plano } = req.body
    if (!id_plano) return res.status(400).json({ erro: 'id_plano obrigatório' })

    const pool = await getPool()
    const u = await pool.request()
      .input('id', sql.Int, req.usuario.id)
      .query('SELECT nome, email FROM dbo.usuario WHERE id_usuario = @id')

    const usuario = u.recordset[0]
    const result  = await svc.criarPreferencia({
      id_usuario:    req.usuario.id,
      id_plano:      Number(id_plano),
      nome_usuario:  usuario.nome,
      email_usuario: usuario.email,
    })

    res.json(result)
  } catch (err) { next(err) }
})

router.get('/status', async (req, res, next) => {
  try {
    const status = await svc.buscarStatusAluno(req.usuario.id)
    res.json(status)
  } catch (err) { next(err) }
})

module.exports = router
