import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function RotaAdmin() {
  const { token, usuario } = useAuthContext()
  if (!token) return <Navigate to="/login" replace />
  if (usuario?.perfil !== 'admin') {
    const destino = usuario?.perfil === 'nutricionista' ? '/admin/dieta' : '/dashboard'
    return <Navigate to={destino} replace />
  }
  return <Outlet />
}
