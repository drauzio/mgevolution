import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMenu } from '../../hooks/useMenu'
import { useAuthContext } from '../../context/AuthContext'

export default function RotaMenuDinamica() {
  const { token } = useAuthContext()
  const { itens } = useMenu()
  const location = useLocation()

  if (!token) return <Navigate to="/login" replace />

  const temAcesso = itens.some(item =>
    location.pathname === item.caminho ||
    location.pathname.startsWith(item.caminho + '/')
  )

  if (!temAcesso) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
