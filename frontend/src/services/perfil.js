import api from './api'

export const buscar       = ()       => api.get('/perfil').then(r => r.data)
export const atualizar    = (dados)  => api.put('/perfil', dados).then(r => r.data)
export const trocarSenha  = (dados)  => api.put('/perfil/senha', dados).then(r => r.data)
export const uploadFoto   = (file)   => {
  const form = new FormData()
  form.append('foto', file)
  return api.post('/perfil/foto', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
}
export const excluirConta = ()       => api.delete('/perfil').then(r => r.data)
