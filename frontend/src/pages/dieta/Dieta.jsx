import { Salad, Flame, ChevronRight } from 'lucide-react'

const refeicoes = [
  { horario: '07:00', nome: 'Café da Manhã', calorias: 450, proteina: 35, feita: true },
  { horario: '10:00', nome: 'Lanche 1',      calorias: 200, proteina: 20, feita: true },
  { horario: '13:00', nome: 'Almoço',         calorias: 700, proteina: 55, feita: false },
  { horario: '16:00', nome: 'Pré-treino',     calorias: 300, proteina: 25, feita: false },
  { horario: '19:00', nome: 'Jantar',         calorias: 550, proteina: 45, feita: false },
  { horario: '22:00', nome: 'Ceia',           calorias: 200, proteina: 20, feita: false },
]

const totalCal      = refeicoes.reduce((a, r) => a + r.calorias, 0)
const totalProt     = refeicoes.reduce((a, r) => a + r.proteina, 0)
const consumidoCal  = refeicoes.filter((r) => r.feita).reduce((a, r) => a + r.calorias, 0)
const consumidoProt = refeicoes.filter((r) => r.feita).reduce((a, r) => a + r.proteina, 0)
const pctCal        = Math.round((consumidoCal / totalCal) * 100)
const pctProt       = Math.round((consumidoProt / totalProt) * 100)

export default function Dieta() {
  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
          Dieta
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>Plano alimentar do método MG</p>
      </div>

      {/* Resumo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Calorias */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={15} color="#CC1A1A" />
            </div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Calorias</p>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 12 }}>
            {consumidoCal}
            <span style={{ fontSize: 13, color: '#B0A89E', fontWeight: 400 }}>/{totalCal} kcal</span>
          </p>
          <div style={{ height: 6, background: '#F0EBE4', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctCal}%`, background: 'linear-gradient(90deg, #A81515, #CC1A1A)', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
          <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 8 }}>{pctCal}% do objetivo</p>
        </div>

        {/* Proteína */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Salad size={15} color="#16A34A" />
            </div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Proteína</p>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 12 }}>
            {consumidoProt}g
            <span style={{ fontSize: 13, color: '#B0A89E', fontWeight: 400 }}>/{totalProt}g</span>
          </p>
          <div style={{ height: 6, background: '#F0EBE4', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctProt}%`, background: 'linear-gradient(90deg, #15803D, #16A34A)', borderRadius: 99, transition: 'width 0.4s' }} />
          </div>
          <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 8 }}>{pctProt}% da meta diária</p>
        </div>
      </div>

      {/* Lista de refeições */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {refeicoes.map((r, i) => (
          <div
            key={r.horario}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '16px 24px',
              borderTop: i > 0 ? '1px solid #F0EBE4' : 'none',
              background: r.feita ? 'rgba(204,26,26,0.03)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!r.feita) e.currentTarget.style.background = '#FDFAF7' }}
            onMouseLeave={e => { e.currentTarget.style.background = r.feita ? 'rgba(204,26,26,0.03)' : 'transparent' }}
          >
            {/* Indicador feita */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: r.feita ? '#CC1A1A' : '#E0D6CA',
              boxShadow: r.feita ? '0 0 6px rgba(204,26,26,0.4)' : 'none',
            }} />

            {/* Horário */}
            <div style={{ width: 44, flexShrink: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76' }}>{r.horario}</p>
            </div>

            {/* Nome + macros */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: r.feita ? '#1A1A1A' : '#6B6560', marginBottom: 3 }}>
                {r.nome}
              </p>
              <p style={{ fontSize: 12, color: '#B0A89E' }}>
                {r.calorias} kcal · {r.proteina}g prot
              </p>
            </div>

            <ChevronRight size={15} color="#C4B9A8" style={{ flexShrink: 0 }} />
          </div>
        ))}
      </div>

    </div>
  )
}
