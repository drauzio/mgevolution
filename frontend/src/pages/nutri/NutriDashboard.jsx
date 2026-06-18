import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useMenu } from '../../hooks/useMenu'
import { getIcon } from '../../utils/menuIcons'

const DIAS_PT  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']
const MESES_PT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']

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

// Cores por ícone para dar variedade aos cards
const COR_ICONE = {
  Salad:           { cor: '#16A34A', bg: 'rgba(22,163,74,0.08)',   borda: 'rgba(22,163,74,0.2)'   },
  Users:           { cor: '#2563EB', bg: 'rgba(37,99,235,0.08)',   borda: 'rgba(37,99,235,0.2)'   },
  Dumbbell:        { cor: '#CC1A1A', bg: 'rgba(204,26,26,0.08)',   borda: 'rgba(204,26,26,0.2)'   },
  TrendingUp:      { cor: '#0891B2', bg: 'rgba(8,145,178,0.08)',   borda: 'rgba(8,145,178,0.2)'   },
  ClipboardList:   { cor: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  borda: 'rgba(124,58,237,0.2)'  },
  Activity:        { cor: '#DC2626', bg: 'rgba(220,38,38,0.08)',   borda: 'rgba(220,38,38,0.2)'   },
  UserCheck:       { cor: '#059669', bg: 'rgba(5,150,105,0.08)',   borda: 'rgba(5,150,105,0.2)'   },
  LayoutDashboard: { cor: '#CC1A1A', bg: 'rgba(204,26,26,0.08)',   borda: 'rgba(204,26,26,0.2)'   },
  FileQuestion:    { cor: '#D97706', bg: 'rgba(217,119,6,0.08)',   borda: 'rgba(217,119,6,0.2)'   },
  Settings2:       { cor: '#6B7280', bg: 'rgba(107,114,128,0.08)', borda: 'rgba(107,114,128,0.2)' },
}

const COR_PADRAO = { cor: '#8A7F76', bg: '#F0EBE4', borda: '#E0D6CA' }

export default function NutriDashboard() {
  const { usuario } = useAuthContext()
  const navigate    = useNavigate()
  const nome        = usuario?.nome?.split(' ')[0] || 'Usuário'

  const { itens } = useMenu()
  // Mostra só os itens do painel nutri (sub-rotas de /nutri/), excluindo a própria raiz
  const cards = itens.filter(i => i.caminho.startsWith('/nutri/'))

  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Saudação */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', letterSpacing: '0.01em', marginBottom: 4 }}>
            {saudacao()}, {nome}!
          </h1>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Selecione uma seção para começar</p>
        </div>
        <p style={{ fontSize: 12, color: '#B0A89E', textAlign: 'right', paddingTop: 4 }}>{dataFormatada()}</p>
      </div>

      {/* Cards das seções */}
      {cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: 14, color: '#B0A89E' }}>Nenhuma seção disponível</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {cards.map(item => {
            const Icon  = getIcon(item.icone)
            const cores = COR_ICONE[item.icone] || COR_PADRAO
            return (
              <div
                key={item.id}
                onClick={() => navigate(item.caminho)}
                style={{
                  background: '#FFFFFF', border: `1px solid #E0D6CA`,
                  borderRadius: 18, padding: '24px 22px', cursor: 'pointer',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.15s',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor  = cores.borda
                  e.currentTarget.style.boxShadow    = `0 6px 24px ${cores.bg}`
                  e.currentTarget.style.transform    = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor  = '#E0D6CA'
                  e.currentTarget.style.boxShadow    = '0 2px 12px rgba(0,0,0,0.04)'
                  e.currentTarget.style.transform    = 'translateY(0)'
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cores.bg, border: `1px solid ${cores.borda}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={cores.cor} strokeWidth={1.8} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 }}>{item.nome}</p>
                <p style={{ fontSize: 12, color: '#8A7F76', fontFamily: 'monospace' }}>{item.caminho}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
