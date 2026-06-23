const axios = require('axios')

function formatarTelefone(telefone) {
  if (!telefone) return null
  const d = String(telefone).replace(/\D+/g, '')
  if (!d) return null
  return d.startsWith('55') ? d : '55' + d
}

async function postTemplate(payloadBase) {
  const token       = process.env.WHATSAPP_TOKEN
  const phoneId     = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return { ok: false, motivo: 'config_invalida' }

  const fone = formatarTelefone(payloadBase.to)
  if (!fone) return { ok: false, motivo: 'telefone_invalido' }

  const url = `https://graph.facebook.com/v22.0/${phoneId}/messages`
  try {
    const r = await axios.post(url, { ...payloadBase, to: fone, recipient_type: 'individual' }, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    const messageId = r.data?.messages?.[0]?.id || null
    return { ok: !!messageId, messageId, motivo: messageId ? null : 'sem_message_id', telefone: fone }
  } catch (err) {
    const error  = err.response?.data?.error || {}
    const motivo = error.message || err.message
    console.error('[WhatsApp] Erro:', motivo)
    console.error('[WhatsApp] Detalhes:', JSON.stringify(error, null, 2))
    return { ok: false, messageId: null, motivo, telefone: fone }
  }
}

// ─── Templates MG Evolution ───────────────────────────────────────────────────

async function enviarBoasVindas({ phone, nomeAluno }) {
  return postTemplate({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'boasvindas_aluno',
      language: { code: 'pt_BR' },
      components: [{ type: 'body', parameters: [{ type: 'text', text: nomeAluno || '' }] }],
    },
  })
}

async function enviarAssinaturaNova({ phone, nomeAluno, nomePlano, dataInicio, dataFim, valor }) {
  return postTemplate({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'assinatura_nova',
      language: { code: 'pt_BR' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: nomeAluno   || '' },
          { type: 'text', text: nomePlano   || '' },
          { type: 'text', text: dataInicio  || '' },
          { type: 'text', text: dataFim     || '' },
          { type: 'text', text: valor       || '' },
        ],
      }],
    },
  })
}

async function enviarAssinaturaVencendo({ phone, nomeAluno, nomePlano, diasRestantes, dataFim, telefoneAcademia }) {
  return postTemplate({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'assinatura_vencendo',
      language: { code: 'pt_BR' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: nomeAluno         || '' },
          { type: 'text', text: nomePlano         || '' },
          { type: 'text', text: String(diasRestantes) },
          { type: 'text', text: dataFim           || '' },
          { type: 'text', text: telefoneAcademia  || '' },
        ],
      }],
    },
  })
}

async function enviarAlunoInativo({ phone, nomeAluno, diasSemTreinar }) {
  return postTemplate({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'aluno_inativo',
      language: { code: 'pt_BR' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: nomeAluno             || '' },
          { type: 'text', text: String(diasSemTreinar)     },
        ],
      }],
    },
  })
}

function isConfigurado() {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

async function enviarOTP({ phone, codigo }) {
  return postTemplate({
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'otp_verificacao',
      language: { code: 'pt_BR' },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: String(codigo) }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: String(codigo) }] },
      ],
    },
  })
}

module.exports = { formatarTelefone, enviarBoasVindas, enviarAssinaturaNova, enviarAssinaturaVencendo, enviarAlunoInativo, enviarOTP, isConfigurado }
