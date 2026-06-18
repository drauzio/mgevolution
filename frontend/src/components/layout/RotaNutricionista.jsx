import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function RotaNutricionista() {
  const { token, usuario } = useAuthContext()
  if (!token) return <Navigate to="/login" replace />
  const permitido = ['admin', 'nutricionista'].includes(usuario?.perfil)
  if (!permitido) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
