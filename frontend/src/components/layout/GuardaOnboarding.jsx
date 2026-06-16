import { Navigate, Outlet } from 'react-router-dom'
import { useAvaliacaoStatus } from '../../hooks/useAvaliacao'

export default function GuardaOnboarding() {
  const { status, isLoading } = useAvaliacaoStatus()

  if (isLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0EBE4' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (status && !status.concluida) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
