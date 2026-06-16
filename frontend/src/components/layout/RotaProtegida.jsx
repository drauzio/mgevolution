import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function RotaProtegida() {
  const { token } = useAuthContext()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
