import { useState } from 'react'
import useSWR from 'swr'
import { Dumbbell, Clock, ChevronRight, Play, RotateCcw } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { buscarMeuProtocolo } from '../../services/treinos'

const DIAS = [
  { num: 1, label: 'Seg', labelLong: 'Segunda' },
  { num: 2, label: 'Ter', labelLong: 'Terça' },
  { num: 3, label: 'Qua', labelLong: 'Quarta' },
  { num: 4, label: 'Qui', labelLong: 'Quinta' },
  { num: 5, label: 'Sex', labelLong: 'Sexta' },
  { num: 6, label: 'Sáb', labelLong: 'Sábado' },
  { num: 7, label: 'Dom', labelLong: 'Domingo' },
]

// JS getDay(): 0=Dom, 1=Seg ... 6=Sáb → dia_semana: 1=Seg ... 7=Dom
function diaSemanaHoje() {
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

function ExercicioCard({ ex, num }) {
  return (
    <div style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #F7F3EE', alignItems: 'flex-start' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#8A7F76', flexShrink: 0, marginTop: 2 }}>
        {num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{ex.exercicio_nome}</p>
        <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 8 }}>{ex.grupo_muscular}{ex.equipamento ? ` · ${ex.equipamento}` : ''}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ex.series && ex.repeticoes && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: 'rgba(204,26,26,0.07)', border: '1px solid rgba(204,26,26,0.15)', fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}>
              {ex.series}×{ex.repeticoes}
            </span>
          )}
          {ex.carga_sugerida && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: '#F7F3EE', border: '1px solid #E0D6CA', fontSize: 12, color: '#6B6560' }}>
              <Dumbbell size={11} color="#8A7F76" />{ex.carga_sugerida}
            </span>
          )}
          {ex.descanso_seg && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: '#F7F3EE', border: '1px solid #E0D6CA', fontSize: 12, color: '#6B6560' }}>
              <RotateCcw size={11} color="#8A7F76" />{ex.descanso_seg}s
            </span>
          )}
        </div>
        {ex.observacao && (
          <p style={{ fontSize: 11, color: '#A09890', marginTop: 6, fontStyle: 'italic' }}>{ex.observacao}</p>
        )}
      </div>
    </div>
  )
}

export default function Treinos() {
  const { token }  = useAuthContext()
  const hoje       = diaSemanaHoje()
  const [diaSel, setDiaSel] = useState(hoje)

  const { data: protocolo, isLoading } = useSWR(
    token ? 'meu-protocolo' : null,
    buscarMeuProtocolo,
    { revalidateOnFocus: false }
  )

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (!protocolo) return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Treinos</h1>
      </div>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Dumbbell size={24} color="#C4B9A8" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Nenhum protocolo ativo</p>
        <p style={{ fontSize: 14, color: '#8A7F76', marginBottom: 24 }}>Conclua o questionário de avaliação para receber seu protocolo de treino personalizado.</p>
        <a
          href="/onboarding"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, paddingInline: 24, borderRadius: 12, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 4px 14px rgba(180,26,26,0.3)' }}
        >
          Fazer avaliação
        </a>
      </div>
    </div>
  )

  // Mapeia dias do protocolo pelo número do dia
  const diasMap = {}
  ;(protocolo.dias || []).forEach(d => { diasMap[d.dia_semana] = d })

  const diaCorrente = diasMap[diaSel]
  const diaHoje     = diasMap[hoje]
  const labelHoje   = DIAS.find(d => d.num === hoje)?.labelLong || ''

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
          Treinos
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>{protocolo.nome}</p>
      </div>

      {/* Treino de hoje */}
      {diaHoje && !diaHoje.descanso ? (
        <div style={{ background: 'linear-gradient(135deg, rgba(204,26,26,0.08) 0%, rgba(204,26,26,0.03) 100%)', border: '1px solid rgba(204,26,26,0.22)', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 16px rgba(204,26,26,0.08)' }}>
          <p style={{ fontSize: 10, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>
            Treino de Hoje · {labelHoje}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 12 }}>
            {diaHoje.nome || 'Treino'}
          </h2>
          <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8A7F76' }}>
              <Dumbbell size={14} color="#8A7F76" />
              {diaHoje.exercicios?.length || 0} exercícios
            </span>
          </div>
          <button
            onClick={() => setDiaSel(hoje)}
            style={{ height: 42, paddingInline: 20, borderRadius: 12, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', fontSize: 12, fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: '0 4px 14px rgba(180,26,26,0.3)', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            <Play size={14} fill="white" />
            Ver exercícios
          </button>
        </div>
      ) : diaHoje?.descanso ? (
        <div style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: 20, padding: '24px 28px' }}>
          <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>Hoje · {labelHoje}</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#8A7F76' }}>Dia de descanso</p>
          <p style={{ fontSize: 13, color: '#A09890', marginTop: 6 }}>Recuperação é parte do treino. Aproveite!</p>
        </div>
      ) : null}

      {/* Tabs dos dias */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {DIAS.map(d => {
          const diaInfo = diasMap[d.num]
          const ativo   = diaSel === d.num
          const temExs  = diaInfo && !diaInfo.descanso && diaInfo.exercicios?.length > 0
          const ehHoje  = d.num === hoje
          return (
            <button
              key={d.num}
              onClick={() => setDiaSel(d.num)}
              style={{ flexShrink: 0, height: 40, paddingInline: 14, borderRadius: 10, border: '1px solid', borderColor: ativo ? '#CC1A1A' : ehHoje ? 'rgba(204,26,26,0.35)' : '#E0D6CA', background: ativo ? '#CC1A1A' : '#FFFFFF', color: ativo ? '#FFFFFF' : ehHoje ? '#CC1A1A' : '#6B6560', fontSize: 12, fontWeight: 700, cursor: 'pointer', position: 'relative', transition: 'all 0.15s' }}
            >
              {d.label}
              {temExs && !ativo && (
                <span style={{ position: 'absolute', top: 5, right: 5, width: 5, height: 5, borderRadius: '50%', background: '#CC1A1A' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Detalhes do dia selecionado */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              {DIAS.find(d => d.num === diaSel)?.labelLong}
              {diaSel === hoje && <span style={{ marginLeft: 8, color: '#CC1A1A' }}>· Hoje</span>}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>
              {diaCorrente?.nome || (diaCorrente?.descanso ? 'Descanso' : '—')}
            </p>
          </div>
          {diaCorrente && !diaCorrente.descanso && (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>
              {diaCorrente.exercicios?.length || 0} exercícios
            </span>
          )}
        </div>

        <div style={{ padding: '0 24px' }}>
          {!diaCorrente || diaCorrente.descanso ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#C4B9A8' }}>
              <p style={{ fontSize: 14 }}>
                {diaCorrente?.descanso ? 'Dia de descanso — sem exercícios' : 'Sem treino configurado para este dia'}
              </p>
            </div>
          ) : diaCorrente.exercicios?.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#C4B9A8' }}>
              <p style={{ fontSize: 14 }}>Nenhum exercício cadastrado</p>
            </div>
          ) : (
            <div>
              {diaCorrente.exercicios.map((ex, i) => (
                <ExercicioCard key={ex.id_treino_dia_exercicio || i} ex={ex} num={i + 1} />
              ))}
              <div style={{ height: 16 }} />
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
