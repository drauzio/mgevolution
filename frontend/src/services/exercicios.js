import api from './api'

export const listar = (params = {}) => api.get('/exercicios', { params }).then(r => r.data)
export const buscarPorId = (id) => api.get(`/exercicios/${id}`).then(r => r.data)
export const criar = (dados) => api.post('/exercicios', dados).then(r => r.data)
export const atualizar = (id, dados) => api.put(`/exercicios/${id}`, dados).then(r => r.data)
export const toggleAtivo = (id) => api.patch(`/exercicios/${id}/toggle-ativo`).then(r => r.data)

export const uploadVideo = (id, file, onProgress) => {
  const fd = new FormData()
  fd.append('video', file)
  return api.post(`/exercicios/${id}/video`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress ? (e) => onProgress(Math.round((e.loaded * 100) / e.total)) : undefined,
  }).then(r => r.data)
}

export const buscarVideoUrl = (id) => api.get(`/exercicios/${id}/video-url`).then(r => r.data)
export const removerVideo   = (id) => api.delete(`/exercicios/${id}/video`).then(r => r.data)
