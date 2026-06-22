const authService = require('../services/auth.service')
const otpService  = require('../services/otp.service')

async function registro(req, res) {
  try {
    const { nome, email, senha, telefone, token_otp } = req.body
    if (!nome || !email || !senha || !telefone) return res.status(400).json({ erro: 'Preencha todos os campos' })
    if (!token_otp) return res.status(400).json({ erro: 'Verifique seu WhatsApp antes de criar a conta' })
    const valido = await otpService.checarToken(telefone, token_otp)
    if (!valido) return res.status(400).json({ erro: 'Verificação de telefone inválida ou expirada' })
    const id = await authService.registro({ nome, email, senha, telefone })
    res.status(201).json({ id_usuario: id })
  } catch (e) {
    console.error('[registro]', e)
    if (e.number === 2627 && e.campo === 'telefone') return res.status(409).json({ erro: 'Telefone já cadastrado' })
    if (e.number === 2627) return res.status(409).json({ erro: 'E-mail já cadastrado' })
    res.status(500).json({ erro: 'Erro ao criar conta', detalhe: e.message })
  }
}

async function otpEnviar(req, res) {
  try {
    const { telefone } = req.body
    if (!telefone) return res.status(400).json({ erro: 'Telefone obrigatório' })
    const r = await otpService.enviar(telefone)
    res.json(r)
  } catch (e) {
    const status = e.status || 500
    res.status(status).json({ erro: e.message, aguardar: e.aguardar })
  }
}

async function otpVerificar(req, res) {
  try {
    const { telefone, codigo } = req.body
    if (!telefone || !codigo) return res.status(400).json({ erro: 'Telefone e código obrigatórios' })
    const r = await otpService.verificar(telefone, codigo)
    res.json(r)
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.message })
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body
    if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha obrigatórios' })
    const data = await authService.login(email, senha)
    res.json(data)
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro interno' })
  }
}

async function cadastrar(req, res) {
  try {
    const id = await authService.criarUsuario(req.body)
    res.status(201).json({ id_usuario: id })
  } catch (e) {
    if (e.number === 2627) return res.status(409).json({ erro: 'E-mail já cadastrado' })
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro interno' })
  }
}

async function esqueciSenha(req, res) {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ erro: 'Informe o e-mail' })
    await authService.esqueciSenha(email)
    res.json({ mensagem: 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.' })
  } catch (e) {
    console.error('[esqueciSenha]', e)
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao enviar e-mail' })
  }
}

async function redefinirSenha(req, res) {
  try {
    const { token, senha } = req.body
    if (!token || !senha) return res.status(400).json({ erro: 'Token e senha são obrigatórios' })
    await authService.redefinirSenha(token, senha)
    res.json({ mensagem: 'Senha redefinida com sucesso!' })
  } catch (e) {
    console.error('[redefinirSenha]', e)
    res.status(e.status || 500).json({ erro: e.mensagem || 'Erro ao redefinir senha' })
  }
}

async function redefinirSenhaOtp(req, res) {
  try {
    const { telefone, token_otp, nova_senha } = req.body
    if (!telefone || !token_otp || !nova_senha) return res.status(400).json({ erro: 'Campos obrigatórios ausentes' })
    if (nova_senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter mínimo 6 caracteres' })
    const valido = await otpService.checarToken(telefone, token_otp)
    if (!valido) return res.status(400).json({ erro: 'Código inválido ou expirado' })
    await authService.redefinirSenhaPorTelefone(telefone, nova_senha)
    res.json({ ok: true })
  } catch (e) {
    res.status(e.status || 500).json({ erro: e.mensagem || e.message || 'Erro ao redefinir senha' })
  }
}

module.exports = { login, registro, cadastrar, esqueciSenha, redefinirSenha, otpEnviar, otpVerificar, redefinirSenhaOtp }
