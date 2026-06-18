import api from './api'

export const listar          = ()                    => api.get('/menu-admin').then(r => r.data)
export const atualizarPerfis = (id, perfis)          => api.put(`/menu-admin/${id}/perfis`, { perfis }).then(r => r.data)
export const criar           = (dados)               => api.post('/menu-admin', dados).then(r => r.data)
export const editar          = (id, dados)            => api.put(`/menu-admin/${id}`, dados).then(r => r.data)
export const deletar         = (id)                  => api.delete(`/menu-admin/${id}`).then(r => r.data)
export const reordenar       = (itens)               => api.patch('/menu-admin/ordem', { itens }).then(r => r.data)
