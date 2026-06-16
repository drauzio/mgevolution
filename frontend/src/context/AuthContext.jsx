import { createContext, useContext, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('mg_token'))

  const usuario = token
    ? (() => { try { return JSON.parse(atob(token.split('.')[1])) } catch { return null } })()
    : null

  async function login(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha })
    localStorage.setItem('mg_token', data.token)
    setToken(data.token)
    return data
  }

  function logout() {
    localStorage.removeItem('mg_token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)
