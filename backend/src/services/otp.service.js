const { getPool, sql } = require('../database/connection')
const crypto = require('crypto')
const wa = require('../integrations/whatsapp')

const OTP_EXPIRY_MIN     = 10
const OTP_MAX_TENTATIVAS = 5
const OTP_COOLDOWN_SEG   = 60

function gerarCodigo() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function enviar(telefone) {
  const pool = await getPool()

  const recente = await pool.request()
    .input('tel', sql.VarChar(20), telefone)
    .query(`
      SELECT TOP 1 criado_em FROM dbo.otp_verificacao
      WHERE telefone = @tel
      ORDER BY criado_em DESC
    `)
  if (recente.recordset[0]) {
    const diff = (Date.now() - new Date(recente.recordset[0].criado_em).getTime()) / 1000
    if (diff < OTP_COOLDOWN_SEG) {
      const aguardar = Math.ceil(OTP_COOLDOWN_SEG - diff)
      const err = new Error(`Aguarde ${aguardar}s antes de reenviar`)
      err.status = 429; err.aguardar = aguardar; throw err
    }
  }

  const codigo   = gerarCodigo()
  const expiraEm = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000)

  await pool.request()
    .input('tel', sql.VarChar(20), telefone)
    .input('cod', sql.Char(6),     codigo)
    .input('exp', sql.DateTime2,   expiraEm)
    .query(`INSERT INTO dbo.otp_verificacao (telefone, codigo, expira_em) VALUES (@tel, @cod, @exp)`)

  if (wa.isConfigurado()) {
    await wa.enviarOTP({ phone: telefone, codigo })
  } else {
    console.info(`[OTP DEV] Telefone: ${telefone}  Código: ${codigo}`)
  }

  return { enviado: true, expira_em: expiraEm }
}

async function verificar(telefone, codigo) {
  const pool = await getPool()

  const r = await pool.request()
    .input('tel', sql.VarChar(20), telefone)
    .query(`
      SELECT TOP 1 id_otp_verificacao, tentativas, verificado, expira_em
      FROM dbo.otp_verificacao
      WHERE telefone = @tel
      ORDER BY criado_em DESC
    `)

  const otp = r.recordset[0]
  if (!otp) throw Object.assign(new Error('Código inválido'), { status: 400 })

  if (otp.verificado)
    throw Object.assign(new Error('Código já utilizado'), { status: 400 })

  if (new Date(otp.expira_em) < new Date())
    throw Object.assign(new Error('Código expirado. Solicite um novo.'), { status: 400 })

  if (otp.tentativas >= OTP_MAX_TENTATIVAS)
    throw Object.assign(new Error('Muitas tentativas. Solicite um novo código.'), { status: 400 })

  await pool.request()
    .input('id', sql.Int, otp.id_otp_verificacao)
    .query(`UPDATE dbo.otp_verificacao SET tentativas = tentativas + 1 WHERE id_otp_verificacao = @id`)

  const check = await pool.request()
    .input('id',  sql.Int,     otp.id_otp_verificacao)
    .input('cod', sql.Char(6), codigo)
    .query(`SELECT 1 AS ok FROM dbo.otp_verificacao WHERE id_otp_verificacao = @id AND codigo = @cod`)

  if (!check.recordset[0])
    throw Object.assign(new Error('Código incorreto'), { status: 400 })

  const token = crypto.randomUUID()
  await pool.request()
    .input('id',    sql.Int,         otp.id_otp_verificacao)
    .input('token', sql.VarChar(36), token)
    .query(`UPDATE dbo.otp_verificacao SET verificado = 1, token = @token WHERE id_otp_verificacao = @id`)

  return { token }
}

async function checarToken(telefone, token) {
  const pool = await getPool()
  const r = await pool.request()
    .input('tel',   sql.VarChar(20), telefone)
    .input('token', sql.VarChar(36), token)
    .query(`
      SELECT TOP 1 id_otp_verificacao FROM dbo.otp_verificacao
      WHERE telefone = @tel AND token = @token AND verificado = 1
        AND criado_em >= DATEADD(MINUTE, -30, SYSUTCDATETIME())
    `)
  return !!r.recordset[0]
}

module.exports = { enviar, verificar, checarToken }
