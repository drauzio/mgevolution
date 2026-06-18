const cron = require('node-cron')
const svc  = require('../services/whatsapp.service')

function iniciarCrons() {
  // Assinaturas vencendo em 7 dias — todo dia às 9h
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Verificando assinaturas vencendo...')
    try { await svc.cronAssinaturaVencendo() }
    catch (e) { console.error('[Cron] Erro assinatura vencendo:', e.message) }
  })

  // Alunos inativos — todo dia às 10h
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron] Verificando alunos inativos...')
    try { await svc.cronAlunoInativo() }
    catch (e) { console.error('[Cron] Erro aluno inativo:', e.message) }
  })

  console.log('[Cron] Jobs WhatsApp iniciados')
}

module.exports = { iniciarCrons }
