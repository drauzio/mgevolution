import api from './api'

export const buscarNotificacoes  = ()         => api.get('/notificacoes').then(r => r.data)
export const listarEnviadas      = ()         => api.get('/notificacoes/admin/enviadas').then(r => r.data)
export const listarAlunos        = ()         => api.get('/notificacoes/admin/alunos').then(r => r.data)
export const enviar              = (payload)  => api.post('/notificacoes/admin/enviar', payload).then(r => r.data)
export const deletar             = (id)       => api.delete(`/notificacoes/${id}`).then(r => r.data)
export const marcarLida          = (id)       => api.put(`/notificacoes/${id}/lida`).then(r => r.data)
