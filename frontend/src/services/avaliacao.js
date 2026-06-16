import api from './api'

export const buscarPerguntas    = () => api.get('/avaliacao/perguntas').then(r => r.data)
export const buscarStatus       = () => api.get('/avaliacao/status').then(r => r.data)
export const buscarMinhaAvaliacao = () => api.get('/avaliacao/minha').then(r => r.data)
export const enviar = (respostas) => api.post('/avaliacao', { respostas }).then(r => r.data)

// Admin
export const listarAvaliacoes  = (params = {}) => api.get('/admin/avaliacoes', { params }).then(r => r.data)
export const buscarAvaliacao   = (id) => api.get(`/admin/avaliacoes/${id}`).then(r => r.data)
export const reatribuirTemplate = (id) => api.post(`/admin/avaliacoes/${id}/reatribuir`).then(r => r.data)
