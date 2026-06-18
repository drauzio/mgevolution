const nodemailer = require('nodemailer')

const APP_NOME = process.env.APP_NOME || 'MG Evolution'
const APP_TAGLINE = process.env.APP_TAGLINE || 'Sistema de Gestão'

function criarTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    family: 4,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

async function enviarRedefinicaoSenha(destinatario, nomeUsuario, linkRedefinicao) {
  const transport = criarTransport()

  await transport.sendMail({
    from: `"${process.env.SMTP_FROM_NAME || APP_NOME}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: destinatario,
    subject: `Redefinição de senha — ${APP_NOME}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0EBE4;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E0D6CA">

        <!-- Header -->
        <tr>
          <td style="background:#CC1A1A;padding:28px 32px;text-align:center">
            <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.7)">
              ${APP_NOME}
            </p>
            <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#FFFFFF;letter-spacing:-0.01em">
              Redefinição de senha
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px">
            <p style="margin:0 0 16px;font-size:15px;color:#1A1A1A">Olá, <strong>${nomeUsuario}</strong>!</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6B6560;line-height:1.6">
              Recebemos uma solicitação para redefinir a senha da sua conta.
              Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
            </p>

            <div style="text-align:center;margin-bottom:28px">
              <a href="${linkRedefinicao}"
                style="display:inline-block;padding:14px 32px;background:#CC1A1A;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.03em">
                Redefinir minha senha
              </a>
            </div>

            <p style="margin:0 0 8px;font-size:12px;color:#8A7F76;line-height:1.6">
              Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá a mesma.
            </p>
            <p style="margin:0;font-size:12px;color:#B0A89E;line-height:1.6;word-break:break-all">
              Ou copie o link: ${linkRedefinicao}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #E0D6CA;text-align:center">
            <p style="margin:0;font-size:11px;color:#C4B9A8;text-transform:uppercase;letter-spacing:0.12em">
              ${APP_NOME} · ${APP_TAGLINE}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}

module.exports = { enviarRedefinicaoSenha }
