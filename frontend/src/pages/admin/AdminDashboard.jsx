import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import {
  Users, UserCheck, Dumbbell, Salad, ArrowUpRight,
  CheckCircle, Clock, AlertTriangle, Sparkles, ChefHat,
  Activity,
} from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'

const fetcher = () => api.get('/admin/dashboard').then(r => r.data)

const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function Skeleton({ h = 20, w = '100%', radius = 8 }) {
  return (
    <>
      <div style={{ height: h, width: w, borderRadius: radius, background: '#F0EBE4', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </>
  )
}

function KpiCard({ icon: Icon, label, valor, sub, subCor, cor, onClick, destaque }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: destaque ? `${cor.bg}` : '#FFFFFF',
        border: `1px solid ${destaque ? cor.border : '#E0D6CA'}`,
        borderRadius: 16, padding: '18px 20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = cor.border; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = destaque ? cor.border : '#E0D6CA'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: cor.bg, border: `1px solid ${cor.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={cor.icon} strokeWidth={1.8} />
        </div>
        {onClick && <ArrowUpRight size={13} color="#C4B9A8" />}
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 5 }}>
        {valor ?? <span style={{ fontSize: 20, color: '#C4B9A8' }}>—</span>}
      </p>
      <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: sub ? 3 : 0 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, fontWeight: 600, color: subCor || cor.icon }}>{sub}</p>}
    </div>
  )
}

function AlertaItem({ icon: Icon, cor, titulo, desc, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderRadius: 12, background: `${cor}0d`, border: `1px solid ${cor}30`, cursor: 'pointer', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = `${cor}18`}
      onMouseLeave={e => e.currentTarget.style.background = `${cor}0d`}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${cor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={cor} strokeWidth={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{titulo}</p>
        <p style={{ fontSize: 11, color: '#8A7F76' }}>{desc}</p>
      </div>
      <ArrowUpRight size={13} color={cor} style={{ flexShrink: 0 }} />
    </div>
  )
}

function Avatar({ nome }) {
  return (
    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#CC1A1A' }}>
      {nome?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function MiniBarChart({ dados }) {
  if (!dados?.length) return null
  const max = Math.max(...dados.map(d => d.total), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
      {dados.map(({ mes, total }) => {
        const mesNum = parseInt(mes.split('-')[1]) - 1
        const pct = (total / max) * 100
        return (
          <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 9, color: '#B0A89E', fontWeight: 700 }}>{total}</span>
            <div style={{ width: '100%', height: `${Math.max(pct, 8)}%`, background: 'rgba(204,26,26,0.75)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' }} />
            <span style={{ fontSize: 9, color: '#C4B9A8' }}>{MESES_CURTO[mesNum]}</span>
          </div>
        )
      })}
    </div>
  )
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
  const porMes = data?.cadastrosPorMes || []

  const alertas = st ? [
    st.solicitacoes_dieta_pendentes > 0 && {
      icon: Salad, cor: '#7C3AED',
      titulo: `${st.solicitacoes_dieta_pendentes} solicitaç${st.solicitacoes_dieta_pendentes > 1 ? 'ões' : 'ão'} de dieta pendente${st.solicitacoes_dieta_pendentes > 1 ? 's' : ''}`,
      desc: 'Alunos aguardando atribuição de plano alimentar',
      rota: '/admin/dieta',
    },
    st.alunos_sem_treino > 0 && {
      icon: Dumbbell, cor: '#CC8800',
      titulo: `${st.alunos_sem_treino} aluno${st.alunos_sem_treino > 1 ? 's' : ''} sem protocolo de treino`,
      desc: 'Sem protocolo ativo atribuído',
      rota: '/admin/alunos',
    },
    st.avaliacoes_pendentes > 0 && {
      icon: ClipboardList, cor: '#2563EB',
      titulo: `${st.avaliacoes_pendentes} avaliação${st.avaliacoes_pendentes > 1 ? 'ões' : ''} em andamento`,
      desc: 'Alunos com questionário iniciado mas não concluído',
      rota: '/admin/avaliacoes',
    },
    st.dietas_rascunho > 0 && {
      icon: ChefHat, cor: '#CC1A1A',
      titulo: `${st.dietas_rascunho} plano${st.dietas_rascunho > 1 ? 's' : ''} de dieta em rascunho`,
      desc: 'Aguardando finalização e liberação para o aluno',
      rota: '/admin/dieta',
    },
  ].filter(Boolean) : []

  const pctAvaliados = st?.alunos_ativos > 0
    ? Math.round((st.avaliacoes_concluidas / st.alunos_ativos) * 100)
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            Painel Administrativo
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            Olá, {usuario?.nome?.split(' ')[0] || 'Admin'} — visão geral do sistema
          </p>
        </div>
        {!isLoading && st?.checkins_hoje > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12 }}>
            <Activity size={14} color="#16A34A" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A' }}>{st.checkins_hoje} check-in{st.checkins_hoje > 1 ? 's' : ''} hoje</span>
          </div>
        )}
      </div>

      {/* KPIs principais — linha 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Skeleton h={34} w={34} radius={9} />
                <Skeleton h={32} w="55%" />
                <Skeleton h={13} w="75%" />
                <Skeleton h={11} w="50%" />
              </div>
            ))
          : [
              {
                icon: Users, label: 'Alunos ativos',
                valor: st?.alunos_ativos,
                sub: st?.alunos_novos_30d > 0 ? `+${st.alunos_novos_30d} nos últimos 30 dias` : 'Nenhum novo este mês',
                subCor: st?.alunos_novos_30d > 0 ? '#16A34A' : '#B0A89E',
                cor: { icon: '#2563EB', bg: 'rgba(37,99,235,0.08)', border: 'rgba(37,99,235,0.18)' },
                rota: '/admin/alunos',
              },
              {
                icon: CheckCircle, label: 'Avaliados',
                valor: `${pctAvaliados}%`,
                sub: `${st?.avaliacoes_concluidas ?? '—'} de ${st?.alunos_ativos ?? '—'} alunos`,
                cor: { icon: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.18)' },
                rota: '/admin/avaliacoes',
              },
              {
                icon: UserCheck, label: 'Personais ativos',
                valor: st?.personais_ativos,
                sub: st?.nutricionistas_ativas > 0 ? `${st.nutricionistas_ativas} nutricionista${st.nutricionistas_ativas > 1 ? 's' : ''}` : undefined,
                cor: { icon: '#CC1A1A', bg: 'rgba(204,26,26,0.08)', border: 'rgba(204,26,26,0.18)' },
                rota: '/admin/personais',
              },
              {
                icon: Salad, label: 'Planos liberados',
                valor: st?.dietas_liberadas,
                sub: st?.dietas_rascunho > 0 ? `${st.dietas_rascunho} em rascunho` : 'Nenhum em rascunho',
                subCor: st?.dietas_rascunho > 0 ? '#CC8800' : undefined,
                cor: { icon: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.18)' },
                rota: '/admin/dieta',
              },
            ].map(c => (
              <KpiCard key={c.label} {...c} onClick={() => navigate(c.rota)} />
            ))
        }
      </div>

      {/* Linha central: alertas+recentes + gráfico */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* Coluna esquerda: alertas + alunos recentes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Alertas de ação */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #F0EBE4', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={14} color="#CC8800" />
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Itens que precisam de atenção</p>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 14px', borderRadius: 12, background: '#F7F3EE' }}>
                      <Skeleton h={34} w={34} radius={9} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <Skeleton h={13} w="70%" />
                        <Skeleton h={11} w="85%" />
                      </div>
                    </div>
                  ))
                : alertas.length === 0
                  ? (
                    <div style={{ padding: '28px 0', textAlign: 'center' }}>
                      <CheckCircle size={28} color="#16A34A" style={{ marginBottom: 10 }} />
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Tudo em ordem!</p>
                      <p style={{ fontSize: 12, color: '#8A7F76' }}>Nenhum item pendente no momento.</p>
                    </div>
                  )
                  : alertas.map(a => (
                    <AlertaItem
                      key={a.rota + a.titulo}
                      icon={a.icon} cor={a.cor}
                      titulo={a.titulo} desc={a.desc}
                      onClick={() => navigate(a.rota)}
                    />
                  ))
              }
            </div>
          </div>

          {/* Alunos recentes */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #F0EBE4' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Alunos recentes</p>
              <button
                onClick={() => navigate('/admin/alunos')}
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#CC1A1A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Ver todos <ArrowUpRight size={13} />
              </button>
            </div>

            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 22px', borderTop: i > 0 ? '1px solid #F0EBE4' : 'none' }}>
                    <Skeleton h={36} w={36} radius={10} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}><Skeleton h={13} w="50%" /><Skeleton h={11} w="65%" /></div>
                    <Skeleton h={18} w={60} radius={6} />
                  </div>
                ))
              : recentes.length === 0
                ? <div style={{ padding: '40px 24px', textAlign: 'center', color: '#B0A89E', fontSize: 14 }}>Nenhum aluno cadastrado ainda.</div>
                : recentes.map((a, i) => (
                  <div
                    key={a.id_usuario}
                    onClick={() => navigate(`/admin/alunos/${a.id_usuario}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px', borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FDFAF7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Avatar nome={a.nome} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.nome}</p>
                      <p style={{ fontSize: 11, color: '#8A7F76', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.email}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: a.avaliacao_concluida ? '#15803d' : '#B0A89E' }}>
                        {a.avaliacao_concluida ? <CheckCircle size={9} /> : <Clock size={9} />}
                        {a.avaliacao_concluida ? 'Avaliado' : 'Pendente'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: a.tem_treino ? '#2563EB' : '#C4B9A8' }}>
                        <Dumbbell size={9} />
                        {a.tem_treino ? 'Com treino' : 'Sem treino'}
                      </span>
                    </div>
                  </div>
                ))
            }
          </div>

        </div>

        {/* Gráfico cadastros por mês + KPIs secundários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Gráfico */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '18px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Novos alunos — 6 meses</p>
            {isLoading
              ? <Skeleton h={64} radius={6} />
              : <MiniBarChart dados={porMes} />
            }
          </div>

          {/* KPIs secundários */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: Dumbbell, label: 'Treinos', valor: st?.treinos_ativos, sub: `${st?.treinos_template ?? 0} templates`, cor: { icon: '#16A34A', bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.18)' }, rota: '/admin/treinos' },
              { icon: Sparkles, label: 'Templates', valor: st?.treinos_template, sub: 'protocolos base', cor: { icon: '#CC8800', bg: 'rgba(204,136,0,0.08)', border: 'rgba(204,136,0,0.18)' }, rota: '/admin/treinos' },
            ].map(c => (
              isLoading
                ? <div key={c.label} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}><Skeleton h={28} w={28} radius={8} /><Skeleton h={24} w="55%" /><Skeleton h={11} w="75%" /></div>
                : <KpiCard key={c.label} {...c} onClick={() => navigate(c.rota)} />
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
