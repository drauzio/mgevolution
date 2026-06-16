import { useState } from 'react'
import api from '../services/api'

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)

  const token = localStorage.getItem('mg_token')
  const usuario = token ? JSON.parse(atob(token.split('.')[1])) : null

  async function login(email, senha) {
    setLoading(true)
    setErro(null)
    try {
      const { data } = await api.post('/auth/login', { email, senha })
      localStorage.setItem('mg_token', data.token)
      return data
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('mg_token')
    window.location.href = '/login'
  }

  return { usuario, login, logout, loading, erro }
}
