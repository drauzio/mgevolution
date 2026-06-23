import api from './api'

export const resumo          = ()        => api.get('/admin/pagamentos/resumo').then(r => r.data)
export const pendentes       = ()        => api.get('/admin/pagamentos/pendentes').then(r => r.data)
export const historico       = (params)  => api.get('/admin/pagamentos/historico', { params }).then(r => r.data)
export const pagar           = (id, dados) => api.patch(`/admin/pagamentos/${id}/pagar`, dados).then(r => r.data)
export const cancelar        = (id)      => api.patch(`/admin/pagamentos/${id}/cancelar`).then(r => r.data)
export const criar           = (dados)   => api.post('/admin/pagamentos', dados).then(r => r.data)
export const gerarCobranca   = (id)      => api.post(`/admin/assinaturas/${id}/gerar-cobranca`).then(r => r.data)
