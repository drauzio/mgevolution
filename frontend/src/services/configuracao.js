import api from './api'

export const getAll           = ()                  => api.get('/admin/configuracoes').then(r => r.data)
export const salvarCategoria  = (categoria, dados)  => api.put(`/admin/configuracoes/${categoria}`, dados).then(r => r.data)
