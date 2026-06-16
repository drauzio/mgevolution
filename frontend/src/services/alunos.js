import api from './api'

export const listar = (params = {}) => api.get('/admin/alunos', { params }).then(r => r.data)
export const buscarPorId = (id) => api.get(`/admin/alunos/${id}`).then(r => r.data)
export const criar = (dados) => api.post('/admin/alunos', dados).then(r => r.data)
export const atualizar = (id, dados) => api.put(`/admin/alunos/${id}`, dados).then(r => r.data)
export const toggleAtivo = (id) => api.patch(`/admin/alunos/${id}/toggle-ativo`).then(r => r.data)
