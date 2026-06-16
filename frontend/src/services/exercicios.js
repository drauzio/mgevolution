import api from './api'

export const listar = (params = {}) => api.get('/exercicios', { params }).then(r => r.data)
export const buscarPorId = (id) => api.get(`/exercicios/${id}`).then(r => r.data)
export const criar = (dados) => api.post('/exercicios', dados).then(r => r.data)
export const atualizar = (id, dados) => api.put(`/exercicios/${id}`, dados).then(r => r.data)
export const toggleAtivo = (id) => api.patch(`/exercicios/${id}/toggle-ativo`).then(r => r.data)
