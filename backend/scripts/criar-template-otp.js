require('dotenv').config()
const axios = require('axios')

const TOKEN   = process.env.WHATSAPP_TOKEN
const WABA_ID = process.env.WHATSAPP_WABA_ID

if (!TOKEN || !WABA_ID) {
  console.error('WHATSAPP_TOKEN e WHATSAPP_WABA_ID precisam estar no .env')
  process.exit(1)
}

async function criar() {
  const url = `https://graph.facebook.com/v22.0/${WABA_ID}/message_templates`

  const payload = {
    name: 'verificacao_otp',
    language: 'pt_BR',
    category: 'AUTHENTICATION',
    components: [
      {
        type: 'BODY',
        text: 'Seu código de verificação MG Evolution é: *{{1}}*. Válido por 10 minutos.',
        example: { body_text: [['123456']] },
      },
      {
        type: 'FOOTER',
        text: 'Não compartilhe este código com ninguém.',
      },
    ],
  }

  try {
    const r = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    })
    console.log('✅ Template criado com sucesso!')
    console.log('ID:', r.data.id)
    console.log('Status:', r.data.status)
  } catch (e) {
    const err = e.response?.data?.error
    console.error('❌ Erro ao criar template:')
    console.error('Código:', err?.code)
    console.error('Mensagem:', err?.message)
    console.error('Detalhes:', err?.error_data?.details)
  }
}

criar()
