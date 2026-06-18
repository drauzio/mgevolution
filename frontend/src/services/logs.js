import api from './api'

export const listarAuditoria      = (params)           => api.get('/admin/logs/auditoria', { params }).then(r => r.data)
export const listarWhatsapp        = (params)           => api.get('/admin/logs/whatsapp',  { params }).then(r => r.data)
export const ultimaModificacao     = (entidade, id)    => api.get(`/admin/logs/ultima-modificacao/${entidade}/${id}`).then(r => r.data)
