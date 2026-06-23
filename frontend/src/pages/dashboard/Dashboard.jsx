import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Flame, Salad, Droplets, Moon, ChevronRight, Sparkles, Bot, TrendingUp, ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { buscarResumoDashboard } from '../../services/dashboard'
import { useMenu } from '../../hooks/useMenu'

const CARD_CONFIG = {
  '/shape-future': { icon: Sparkles,  cor: '#7C3AED', bg: 'rgba(124,58,237,0.08)', titulo: 'Shape Future IA', desc: 'Projeção em 90 e 180 dias' },
  '/coach-ia':     { icon: Bot,        cor: '#CC1A1A', bg: 'rgba(204,26,26,0.08)',  titulo: 'IA Coach',        desc: 'Tire dúvidas agora'       },
  '/evolucao':     { icon: TrendingUp, cor: '#2563EB', bg: 'rgba(37,99,235,0.08)',  titulo: 'Evolução',        desc: 'Medidas e análise IA'    },
  '/dieta':        { icon: Salad,      cor: '#16A34A', bg: 'rgba(22,163,74,0.08)',  titulo: 'Dieta',           desc: 'Plano alimentar'         },
  '/shape-score':  { icon: Flame,      cor: '#EA580C', bg: 'rgba(234,88,12,0.08)',  titulo: 'Shape Score',     desc: 'Pontuação de hoje'       },
  '/treinos':      { icon: Dumbbell,   cor: '#CC1A1A', bg: 'rgba(204,26,26,0.08)',  titulo: 'Treinos',         desc: 'Protocolo de treino'     },
}

const DIAS_PT = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MESES_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function saudacao() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function dataFormatada() {
  const d = new Date()
  return `${DIAS_PT[d.getDay()]}, ${d.getDate()} ${MESES_PT[d.getMonth()]}`
}

function corScore(s) {
  if (s >= 85) return '#16A34A'
  if (s >= 60) return '#CC8800'
  return '#CC1A1A'
}

function Tendencia({ atual, anterior }) {
  if (anterior == null || atual == null) return null
  const diff = atual - anterior
  if (Math.abs(diff) < 0.05) return <span style={{ fontSize: 11, color: '#8A7F76', display: 'flex', alignItems: 'center', gap: 3 }}><Minus size={11} /> estável</span>
  const positivo = diff > 0
  return (
    <span style={{ fontSize: 11, color: positivo ? '#CC1A1A' : '#16A34A', display: 'flex', alignItems: 'center', gap: 3 }}>
      {positivo ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(diff).toFixed(1)} vs anterior
    </span>
  )
}

export default function Dashboard() {
  const { usuario, token } = useAuthContext()
  const navigate = useNavigate()
  const nome = usuario?.nome?.split(' ')[0] || 'Campeão'

  const { data, isLoading } = useSWR(token ? 'dashboard-resumo' : null, buscarResumoDashboard)
  const { itens: itensMenu } = useMenu()

  const score = data?.scoreHoje
  const treino = data?.treinoHoje
  const evolucao = data?.evolucao
  const dieta = data?.dieta

  const pontos = score?.pontos ?? 0
  const CIRCUNF = 2 * Math.PI * 54
  const dashScore = (pontos / 100) * CIRCUNF

  const CHECKS = [
    { key: 'treino', icon: Dumbbell, label: 'Treino' },
    { key: 'cardio', icon: Flame,    label: 'Cardio' },
    { key: 'dieta',  icon: Salad,    label: 'Dieta'  },
    { key: 'agua',   icon: Droplets, label: 'Água'   },
    { key: 'sono',   icon: Moon,     label: 'Sono'   },
  ]

  function valorCheck(key) {
    if (!score) return false
    const v = score[key]
    if (typeof v === 'boolean') return v
    if (key === 'dieta') return v >= 70
    if (key === 'agua')  return v >= 2.5
    if (key === 'sono')  return v >= 7
    return !!v
  }

  const STATUS_DIETA = {
    liberado: { label: 'Plano ativo',       cor: '#16A34A' },
    rascunho: { label: 'Em elaboração',     cor: '#CC8800' },
    revisao:  { label: 'Em revisão',        cor: '#2563EB' },
  }

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Saudação */}
      <div>
        <p style={{ fontSize: 12, color: '#B0A89E', marginBottom: 4 }}>{dataFormatada()}</p>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', letterSpacing: '0.01em', marginBottom: 4 }}>
          {saudacao()}, {nome}!
        </h1>
        <p style={{ fontSize: 13, color: '#8A7F76' }}>Método Márcio Gonçalves</p>
      </div>

      {/* Shape Score */}
      <div className="dash-score-card" style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '24px', display: 'flex', alignItems: 'center', gap: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="54" fill="none" stroke="#E0D6CA" strokeWidth="10" />
            <circle
              cx="64" cy="64" r="54" fill="none"
              stroke={score ? corScore(pontos) : '#E0D6CA'}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${dashScore} ${CIRCUNF}`}
              transform="rotate(-90 64 64)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 8, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>Score</p>
            <p style={{ fontSize: 34, fontWeight: 900, color: score ? corScore(pontos) : '#C4B9A8', lineHeight: 1 }}>
              {score ? pontos : '–'}
            </p>
            <p style={{ fontSize: 9, color: '#B0A89E', marginTop: 2 }}>/ 100</p>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 800, color: '#1A1A1A', fontSize: 16, marginBottom: 4 }}>
            {score
              ? pontos >= 85 ? 'Excelente dia!' : pontos >= 60 ? 'Bom trabalho!' : 'Continue firme!'
              : 'Check-in pendente'}
          </p>
          <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 16 }}>
            {score ? 'Shape Score de hoje' : 'Registre seu dia para ganhar pontos'}
          </p>
          <div className="dash-score-checks" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {CHECKS.map(({ key, icon: Icon, label }) => {
              const feito = valorCheck(key)
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 10, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', border: '1px solid', background: feito ? 'rgba(204,26,26,0.07)' : '#F7F3EE', borderColor: feito ? 'rgba(204,26,26,0.22)' : '#E0D6CA', color: feito ? '#CC1A1A' : '#B0A89E' }}>
                  <Icon size={14} />
                  {label.toUpperCase()}
                </div>
              )
            })}
          </div>
          <button
            onClick={() => navigate('/shape-score')}
            className="dash-score-btn"
            style={{ height: 34, paddingInline: 16, borderRadius: 10, border: 'none', background: score ? '#F7F3EE' : 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: score ? '#6B6560' : '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            {score ? 'Ver / Atualizar check-in' : 'Fazer check-in agora'}
          </button>
        </div>
      </div>

      {/* Treino de hoje */}
      <div
        onClick={() => navigate('/treinos')}
        style={{ display: 'flex', alignItems: 'center', gap: 18, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '22px 24px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.35)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(204,26,26,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Dumbbell size={22} color="#CC1A1A" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 5 }}>Treino de hoje</p>
          {treino ? (
            <>
              <p style={{ fontWeight: 800, color: '#1A1A1A', fontSize: 16, marginBottom: 3 }}>
                {treino.descanso ? 'Dia de descanso' : treino.treino_nome}
              </p>
              <p style={{ fontSize: 12, color: '#8A7F76' }}>
                {treino.descanso
                  ? 'Recuperação ativa — alongue-se!'
                  : `${treino.qtd_exercicios} exercício${treino.qtd_exercicios !== 1 ? 's' : ''} · ${treino.protocolo_nome}`}
              </p>
            </>
          ) : (
            <>
              <p style={{ fontWeight: 800, color: '#C4B9A8', fontSize: 16, marginBottom: 3 }}>Sem protocolo</p>
              <p style={{ fontSize: 12, color: '#B0A89E' }}>Nenhum treino atribuído para hoje</p>
            </>
          )}
        </div>
        <ChevronRight size={18} color="#C4B9A8" style={{ flexShrink: 0 }} />
      </div>

      {/* Stats de evolução */}
      {evolucao?.atual && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {evolucao.atual.peso != null && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>Peso</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 6 }}>
                {parseFloat(evolucao.atual.peso).toFixed(1)}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#B0A89E', marginLeft: 4 }}>kg</span>
              </p>
              <Tendencia atual={evolucao.atual.peso} anterior={evolucao.anterior?.peso} />
            </div>
          )}
          {evolucao.atual.gordura_pct != null && (
            <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, fontWeight: 700 }}>Gordura</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 6 }}>
                {parseFloat(evolucao.atual.gordura_pct).toFixed(1)}
                <span style={{ fontSize: 13, fontWeight: 500, color: '#B0A89E', marginLeft: 2 }}>%</span>
              </p>
              <Tendencia atual={evolucao.atual.gordura_pct} anterior={evolucao.anterior?.gordura_pct} />
            </div>
          )}
        </div>
      )}

      {/* Status da dieta */}
      {dieta && (
        <div
          onClick={() => navigate('/dieta')}
          style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '18px 22px', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA' }}
        >
          <Salad size={20} color="#16A34A" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dieta.nome}</p>
            <p style={{ fontSize: 11, color: STATUS_DIETA[dieta.status_plano]?.cor || '#8A7F76', fontWeight: 600 }}>
              {STATUS_DIETA[dieta.status_plano]?.label || dieta.status_plano}
            </p>
          </div>
          <ChevronRight size={16} color="#C4B9A8" style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* Acesso rápido — baseado no menu do aluno */}
      {(() => {
        const EXCLUIR = ['/dashboard', '/treinos', '/shape-score']
        const cards = itensMenu
          .filter(i => !EXCLUIR.includes(i.caminho) && CARD_CONFIG[i.caminho])
          .map(i => ({ href: i.caminho, ...CARD_CONFIG[i.caminho] }))
        if (cards.length === 0) return null
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {cards.map(({ href, icon: Icon, cor, bg, titulo, desc }) => (
              <div
                key={href}
                onClick={() => navigate(href)}
                style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cor + '55'; e.currentTarget.style.boxShadow = `0 4px 16px ${cor}18` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Icon size={17} color={cor} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 }}>{titulo}</p>
                <p style={{ fontSize: 12, color: '#8A7F76' }}>{desc}</p>
              </div>
            ))}
          </div>
        )
      })()}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (max-width: 480px) {
          .dash-score-card { flex-direction: column !important; align-items: center !important; text-align: center; }
          .dash-score-checks { justify-content: center !important; }
          .dash-score-btn { width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
