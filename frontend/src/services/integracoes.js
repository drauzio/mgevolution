import api from './api'

export const buscarStatus     = ()       => api.get('/admin/integracoes/whatsapp/status').then(r => r.data)
export const listarLogs       = (params) => api.get('/admin/integracoes/whatsapp/logs', { params }).then(r => r.data)
export const enviarTeste      = (dados)  => api.post('/admin/integracoes/whatsapp/teste', dados).then(r => r.data)
export const executarCron     = (tipo)   => api.post(`/admin/integracoes/whatsapp/cron/${tipo}`).then(r => r.data)
