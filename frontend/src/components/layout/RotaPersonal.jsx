import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function RotaPersonal() {
  const { token, usuario } = useAuthContext()
  if (!token) return <Navigate to="/login" replace />
  if (!['personal', 'admin'].includes(usuario?.perfil)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
