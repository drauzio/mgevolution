const jwt = require('jsonwebtoken')

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não informado' })
  }
  try {
    req.usuario = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' })
  }
}

function adminMiddleware(req, res, next) {
  if (!req.usuario?.administrador) {
    return res.status(403).json({ erro: 'Acesso restrito a administradores' })
  }
  next()
}

module.exports = { authMiddleware, adminMiddleware }
