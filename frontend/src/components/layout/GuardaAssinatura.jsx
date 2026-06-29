import { Outlet } from 'react-router-dom'
import useSWR from 'swr'
import { Clock, ShieldCheck } from 'lucide-react'
import { buscarStatus, buscarPlanos, criarPreferencia } from '../../services/checkout'
import { useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'

function BannerCarencia({ dias }) {
  const urgente = dias <= 3
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px', gap: 12, flexWrap: 'wrap',
      background: urgente ? '#FEF2F2' : '#FFFBEB',
      borderBottom: `1px solid ${urgente ? '#FCA5A5' : '#FDE68A'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Clock size={15} color={urgente ? '#CC1A1A' : '#B45309'} />
        <span style={{ fontSize: 13, color: urgente ? '#CC1A1A' : '#B45309', fontWeight: 600 }}>
          {dias === 0
            ? 'Último dia de carência!'
            : `Período gratuito: ${dias} dia${dias > 1 ? 's' : ''} restante${dias > 1 ? 's' : ''}`}
        </span>
      </div>
      <a
        href="/assinar"
        style={{ fontSize: 12, fontWeight: 700, color: urgente ? '#CC1A1A' : '#B45309', textDecoration: 'none', whiteSpace: 'nowrap', border: `1px solid ${urgente ? '#FCA5A5' : '#FDE68A'}`, borderRadius: 8, padding: '4px 12px' }}
      >
        Assinar agora →
      </a>
    </div>
  )
}

function TelaExpirado() {
  const { data: planos = [] } = useSWR('planos-publicos', buscarPlanos)
  const [assinando, setAssinando] = useState(null)

  async function assinar(id_plano) {
    setAssinando(id_plano)
    try {
      const { init_point } = await criarPreferencia(id_plano)
      window.location.href = init_point
    } catch { setAssinando(null) }
  }

  const ativos = planos.filter(p => p.ativo)

  return (
    <div style={{ minHeight: '100vh', background: '#F7F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(204,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <ShieldCheck size={26} color="#CC1A1A" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>Sua carência expirou</h2>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Escolha um plano para continuar usando o MG Evolution.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ativos.map(p => (
            <div key={p.id_plano} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>{p.nome}</p>
                <p style={{ fontSize: 12, color: '#8A7F76' }}>{p.duracao_dias} dias</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#CC1A1A', marginBottom: 6 }}>
                  R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                </p>
                <button
                  onClick={() => assinar(p.id_plano)}
                  disabled={!!assinando}
                  style={{ height: 34, paddingInline: 16, borderRadius: 8, border: 'none', background: assinando === p.id_plano ? '#C4B9A8' : '#CC1A1A', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: assinando ? 'not-allowed' : 'pointer' }}
                >
                  {assinando === p.id_plano ? 'Aguarde...' : 'Assinar'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#C4B9A8', marginTop: 20 }}>
          Pagamento seguro via Mercado Pago · Pix ou Cartão
        </p>
      </div>
    </div>
  )
}

export default function GuardaAssinatura() {
  const { usuario } = useAuthContext()

  // Admin, personal e nutricionista não precisam de assinatura
  const perfil = usuario?.perfil
  if (perfil && perfil !== 'aluno') return <Outlet />

  const { data, isLoading } = useSWR('checkout-status', buscarStatus, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  })

  if (isLoading || !data) return <Outlet />

  if (data.status === 'expirado') return <TelaExpirado />

  return (
    <>
      {data.status === 'carencia' && <BannerCarencia dias={data.dias_restantes} />}
      <Outlet />
    </>
  )
}
