import api from './api'

export const listar = () => api.get('/templates').then(r => r.data)
export const buscarPorId = (id) => api.get(`/templates/${id}`).then(r => r.data)
export const criar = (dados) => api.post('/templates', dados).then(r => r.data)
export const atualizar = (id, dados) => api.put(`/templates/${id}`, dados).then(r => r.data)
export const clonarParaAluno = (id, id_usuario) => api.post(`/templates/${id}/clonar`, { id_usuario }).then(r => r.data)
export const gerarComIA = (dados) => api.post('/templates/gerar-ia', dados).then(r => r.data)
