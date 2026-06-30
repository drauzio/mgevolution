import { Outlet, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Clock, ShieldCheck, Loader2, LogOut } from 'lucide-react'
import { buscarStatus, buscarPlanos } from '../../services/checkout'
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

function duracaoLabel(dias) {
  if (dias <= 30)  return 'Mensal'
  if (dias <= 60)  return 'Bimestral'
  if (dias <= 90)  return 'Trimestral'
  if (dias <= 180) return 'Semestral'
  return 'Anual'
}

function TelaExpirado() {
  const { logout } = useAuthContext()
  const navigate = useNavigate()
  const { data: planos = [], isLoading, error } = useSWR('planos-publicos', buscarPlanos)
  const [assinando, setAssinando] = useState(null)
  const [erro, setErro] = useState(null)

  function assinar(id_plano) {
    setAssinando(id_plano)
    navigate(`/assinar?id_plano=${id_plano}`)
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

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader2 size={24} color="#CC1A1A" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13, textAlign: 'center' }}>
            Não foi possível carregar os planos. Recarregue a página.
          </div>
        ) : ativos.length === 0 ? (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280', fontSize: 13, textAlign: 'center' }}>
            Nenhum plano disponível no momento. Entre em contato com seu personal.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ativos.map(p => (
              <div key={p.id_plano} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
                  <p style={{ fontSize: 12, color: '#8A7F76' }}>{duracaoLabel(p.duracao_dias)} · {p.duracao_dias} dias</p>
                  {p.descricao && <p style={{ fontSize: 12, color: '#8A7F76', marginTop: 2 }}>{p.descricao}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#CC1A1A', marginBottom: 6 }}>
                    R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                  </p>
                  <button
                    onClick={() => assinar(p.id_plano)}
                    disabled={!!assinando}
                    style={{ height: 34, paddingInline: 16, borderRadius: 8, border: 'none', background: assinando === p.id_plano ? '#C4B9A8' : '#CC1A1A', color: '#FFF', fontSize: 12, fontWeight: 700, cursor: assinando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {assinando === p.id_plano
                      ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</>
                      : 'Assinar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {erro && (
          <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13, textAlign: 'center' }}>
            {erro}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 11, color: '#C4B9A8', marginTop: 20 }}>
          Pagamento seguro via Mercado Pago · Pix ou Cartão
        </p>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={logout}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#8A7F76', padding: '6px 12px', borderRadius: 8 }}
          >
            <LogOut size={14} />
            Sair da conta
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
