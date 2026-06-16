import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { Users, UserCheck, Dumbbell, Salad, ArrowUpRight, CheckCircle, Clock, TrendingUp, ClipboardList } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'

const fetcher = () => api.get('/admin/dashboard').then(r => r.data)

function StatCard({ icon: Icon, label, valor, sub, cor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', cursor: onClick ? 'pointer' : 'default', transition: 'box-shadow 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = cor.border; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: cor.bg, border: `1px solid ${cor.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={cor.icon} strokeWidth={1.8} />
        </div>
        {onClick && <ArrowUpRight size={14} color="#C4B9A8" />}
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 6 }}>
        {valor ?? <span style={{ fontSize: 22, color: '#C4B9A8' }}>—</span>}
      </p>
      <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 2 }}>{label}</p>
      {sub !== undefined && (
        <p style={{ fontSize: 11, color: cor.icon, fontWeight: 600 }}>{sub}</p>
      )}
    </div>
  )
}

function Avatar({ nome }) {
  return (
    <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14, fontWeight: 800, color: '#CC1A1A' }}>
      {nome?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function Skeleton({ h = 20, w = '100%', radius = 8 }) {
  return <div style={{ height: h, width: w, borderRadius: radius, background: '#F0EBE4', animation: 'pulse 1.5s ease-in-out infinite' }} />
}

export default function AdminDashboard() {
  const { token, usuario } = useAuthContext()
  const navigate = useNavigate()

  const { data, isLoading } = useSWR(
    token ? 'admin-dashboard' : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const st = data?.estatisticas
  const recentes = data?.recentes || []

  const cards = [
    {
      icon: Users,
      label: 'Alunos ativos',
      valor: st?.alunos_ativos,
      sub: st?.alunos_novos_30d > 0 ? `+${st.alunos_novos_30d} nos últimos 30 dias` : 'Nenhum novo este mês',
      cor: { icon: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.18)' },
      rota: '/admin/alunos',
    },
    {
      icon: UserCheck,
      label: 'Personais ativos',
      valor: st?.personais_ativos,
      sub: undefined,
      cor: { icon: '#CC1A1A', bg: 'rgba(204,26,26,0.08)', border: 'rgba(204,26,26,0.18)' },
      rota: '/admin/personais',
    },
    {
      icon: Dumbbell,
      label: 'Treinos ativos',
      valor: st?.treinos_ativos,
      sub: undefined,
      cor: { icon: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.18)' },
      rota: '/admin/treinos',
    },
    {
      icon: Salad,
      label: 'Planos alimentares',
      valor: st?.dietas_ativas,
      sub: undefined,
      cor: { icon: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.18)' },
      rota: '/admin/dieta',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
          Painel Administrativo
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>
          Olá, {usuario?.nome?.split(' ')[0] || 'Admin'} — visão geral do sistema
        </p>
      </div>

      {/* Cards de stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton h={36} w={36} radius={10} />
                <Skeleton h={36} w="60%" />
                <Skeleton h={14} w="80%" />
                <Skeleton h={12} w="50%" />
              </div>
            ))
          : cards.map(c => (
              <StatCard key={c.label} {...c} onClick={() => navigate(c.rota)} />
            ))
        }
      </div>

      {/* Linha: alunos recentes + acesso rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* Alunos recentes */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F0EBE4' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Alunos recentes
            </p>
            <button
              onClick={() => navigate('/admin/alunos')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#CC1A1A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              Ver todos <ArrowUpRight size={13} />
            </button>
          </div>

          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderTop: i > 0 ? '1px solid #F0EBE4' : 'none' }}>
                  <Skeleton h={38} w={38} radius={12} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Skeleton h={14} w="55%" />
                    <Skeleton h={12} w="70%" />
                  </div>
                </div>
              ))
            : recentes.length === 0
              ? (
                <div style={{ padding: '40px 24px', textAlign: 'center', color: '#B0A89E', fontSize: 14 }}>
                  Nenhum aluno cadastrado ainda.
                </div>
              )
              : recentes.map((a, i) => (
                <div
                  key={a.id_usuario}
                  onClick={() => navigate(`/admin/alunos/${a.id_usuario}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FDFAF7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar nome={a.nome} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</p>
                    <p style={{ fontSize: 12, color: '#8A7F76', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    {a.personal && (
                      <p style={{ fontSize: 11, color: '#8A7F76' }}>{a.personal}</p>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600, color: a.avaliacao_concluida ? '#15803d' : '#B0A89E' }}>
                      {a.avaliacao_concluida
                        ? <><CheckCircle size={10} /> Avaliado</>
                        : <><Clock size={10} /> Pendente</>}
                    </span>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Acesso rápido */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Acesso rápido</p>
          {[
            { label: 'Novo aluno',       icon: Users,         rota: '/admin/alunos/novo' },
            { label: 'Novo treino',      icon: Dumbbell,      rota: '/admin/treinos/novo' },
            { label: 'Novo plano de dieta', icon: Salad,      rota: '/admin/dieta/novo' },
            { label: 'Avaliações',       icon: TrendingUp,    rota: '/admin/avaliacoes' },
            { label: 'Exercícios',       icon: ClipboardList, rota: '/admin/exercicios' },
          ].map(({ label, icon: Icon, rota }) => (
            <button
              key={rota}
              onClick={() => navigate(rota)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.3)'; e.currentTarget.style.background = '#FDFAF7' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFFFFF' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F7F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={15} color="#8A7F76" strokeWidth={1.7} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{label}</span>
              <ArrowUpRight size={14} color="#C4B9A8" style={{ marginLeft: 'auto' }} />
            </button>
          ))}

          {/* Card avaliações concluídas */}
          {!isLoading && st && (
            <div style={{ marginTop: 8, padding: '16px 18px', background: 'rgba(204,26,26,0.05)', border: '1px solid rgba(204,26,26,0.15)', borderRadius: 14 }}>
              <p style={{ fontSize: 11, color: '#CC1A1A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Avaliações concluídas</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{st.avaliacoes_concluidas}</p>
              <p style={{ fontSize: 12, color: '#8A7F76' }}>de {st.alunos_ativos} alunos ativos</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
