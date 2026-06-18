import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { ArrowLeft, Calendar, Ruler, Dumbbell, Camera, ChevronDown, Sparkles, Bot, X } from 'lucide-react'
import * as svc from '../../services/adminEvolucao'
import * as alunosService from '../../services/alunos'

const TABS = ['Treinos', 'Medidas', 'Cargas', 'Fotos']

function fmt(dateStr) {
  if (!dateStr) return ''
  const s = typeof dateStr === 'string' ? dateStr : dateStr.toISOString()
  const d = new Date(s.includes('T') ? s : s + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function fmtNum(v, suffix = '') {
  if (v == null) return '—'
  return `${parseFloat(v).toLocaleString('pt-BR')}${suffix}`
}

// ─── Tab Treinos ─────────────────────────────────────────────────────────────
function TabTreinos({ id }) {
  const { data: resumo }  = useSWR(['ae-resumo',  id], () => svc.buscarResumo(id),  { revalidateOnFocus: false })
  const { data: sessoes } = useSWR(['ae-sessoes', id], () => svc.buscarSessoes(id), { revalidateOnFocus: false })

  const sessoesMap = {}
  ;(sessoes || []).forEach(s => {
    const key = typeof s.data === 'string' ? s.data.slice(0, 10) : s.data.toISOString().slice(0, 10)
    sessoesMap[key] = s
  })

  const hoje = new Date()
  const diasGrade = []
  for (let i = 41; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    diasGrade.push({ key, d, sessao: sessoesMap[key] || null })
  }

  const primeiroDia = diasGrade[0].d.getDay()
  const offsetInicio = primeiroDia === 0 ? 6 : primeiroDia - 1
  const grade = [...Array(offsetInicio).fill(null), ...diasGrade]
  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Este mês</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: '#CC1A1A', lineHeight: 1, marginBottom: 4 }}>{resumo?.total_mes ?? '—'}</p>
          <p style={{ fontSize: 12, color: '#8A7F76' }}>treinos concluídos</p>
        </div>
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Total geral</p>
          <p style={{ fontSize: 32, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{resumo?.total_sessoes ?? '—'}</p>
          <p style={{ fontSize: 12, color: '#8A7F76' }}>treinos realizados</p>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Calendar size={16} color="#CC1A1A" />
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>Últimas 6 semanas</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {diasSemana.map(d => (
            <p key={d} style={{ fontSize: 10, fontWeight: 700, color: '#C4B9A8', textAlign: 'center', textTransform: 'uppercase' }}>{d}</p>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {grade.map((item, i) => {
            if (!item) return <div key={`e-${i}`} />
            const isHoje  = item.key === hoje.toISOString().slice(0, 10)
            const concluida = item.sessao?.concluidas > 0
            const iniciada  = item.sessao && !concluida
            return (
              <div
                key={item.key}
                title={`${item.d.toLocaleDateString('pt-BR')}${item.sessao ? ` · ${item.sessao.concluidas} treino(s)` : ''}`}
                style={{ aspectRatio: '1', borderRadius: 6, background: concluida ? '#CC1A1A' : iniciada ? 'rgba(204,26,26,0.2)' : '#F7F3EE', border: isHoje ? '2px solid #CC1A1A' : '1px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {concluida && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 14, justifyContent: 'flex-end' }}>
          {[['#CC1A1A', 'Concluído'], ['rgba(204,26,26,0.2)', 'Iniciado'], ['#F7F3EE', 'Sem treino']].map(([bg, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: bg, border: '1px solid rgba(0,0,0,0.08)' }} />
              <p style={{ fontSize: 10, color: '#8A7F76' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Tab Medidas ─────────────────────────────────────────────────────────────
const CAMPOS_MEDIDA = [
  { key: 'peso',        label: 'Peso',        sufixo: 'kg' },
  { key: 'gordura_pct', label: 'Gordura',     sufixo: '%'  },
  { key: 'massa_magra', label: 'Massa magra', sufixo: 'kg' },
  { key: 'cintura_cm',  label: 'Cintura',     sufixo: 'cm' },
  { key: 'quadril_cm',  label: 'Quadril',     sufixo: 'cm' },
  { key: 'peito_cm',    label: 'Peito',       sufixo: 'cm' },
  { key: 'braco_cm',    label: 'Braço',       sufixo: 'cm' },
  { key: 'coxa_cm',     label: 'Coxa',        sufixo: 'cm' },
]

function TabMedidas({ id }) {
  const { data: medidas = [] } = useSWR(['ae-medidas', id], () => svc.buscarMedidas(id), { revalidateOnFocus: false })

  const ultima  = medidas[0]
  const anterior = medidas[1]

  function delta(campo) {
    if (!ultima || !anterior) return null
    const a = parseFloat(ultima[campo])
    const b = parseFloat(anterior[campo])
    if (isNaN(a) || isNaN(b)) return null
    const d = a - b
    return { valor: d, positivo: d > 0 }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ultima ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>Última medição</p>
            <p style={{ fontSize: 12, color: '#8A7F76' }}>{fmt(ultima.data)}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {CAMPOS_MEDIDA.map((c, i) => {
              const val = ultima[c.key]
              if (val == null) return null
              const d = delta(c.key)
              return (
                <div key={c.key} style={{ padding: '14px 20px', borderBottom: i < CAMPOS_MEDIDA.length - 2 ? '1px solid #F7F3EE' : 'none', borderRight: i % 2 === 0 ? '1px solid #F7F3EE' : 'none' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#A09890', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{c.label}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>{fmtNum(val)}</p>
                    <p style={{ fontSize: 11, color: '#8A7F76' }}>{c.sufixo}</p>
                    {d && (
                      <p style={{ fontSize: 11, fontWeight: 700, color: d.positivo ? '#CC1A1A' : '#15803d' }}>
                        {d.positivo ? '+' : ''}{d.valor.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
          <Ruler size={28} color="#C4B9A8" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Nenhuma medida registrada</p>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>O aluno ainda não registrou nenhuma medida</p>
        </div>
      )}

      {medidas.length > 1 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', padding: '16px 20px', borderBottom: '1px solid #F0EBE4' }}>Histórico</p>
          {medidas.slice(1).map((m, i) => (
            <div key={m.id_evolucao_medida} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: i > 0 ? '1px solid #F7F3EE' : 'none' }}>
              <p style={{ fontSize: 12, color: '#8A7F76', minWidth: 64 }}>{fmt(m.data)}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CAMPOS_MEDIDA.map(c => m[c.key] != null && (
                  <span key={c.key} style={{ fontSize: 12, color: '#6B6560' }}>
                    <span style={{ color: '#A09890' }}>{c.label}: </span>{fmtNum(m[c.key])}{c.sufixo}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab Cargas ───────────────────────────────────────────────────────────────
function TabCargas({ id }) {
  const { data: exercicios = [] } = useSWR(['ae-exercicios', id], () => svc.buscarExercicios(id), { revalidateOnFocus: false })
  const [exSel, setExSel] = useState(null)

  const { data: historico = [], isLoading } = useSWR(
    exSel ? ['ae-carga', id, exSel] : null,
    () => svc.buscarHistoricoCarga(id, exSel),
    { revalidateOnFocus: false }
  )

  const grupos = [...new Set(exercicios.map(e => e.grupo_muscular))].sort()
  const maxCarga = historico.length ? Math.max(...historico.map(h => Number(h.max_carga) || 0)) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', padding: '16px 20px', borderBottom: '1px solid #F0EBE4' }}>Selecione um exercício</p>
        {exercicios.length === 0 ? (
          <p style={{ padding: '24px 20px', fontSize: 13, color: '#8A7F76', textAlign: 'center' }}>Nenhum protocolo ativo</p>
        ) : grupos.map(g => (
          <div key={g}>
            <p style={{ padding: '10px 20px 6px', fontSize: 10, fontWeight: 700, color: '#A09890', textTransform: 'uppercase', letterSpacing: '0.12em', background: '#FAFAF9' }}>{g}</p>
            {exercicios.filter(e => e.grupo_muscular === g).map(e => (
              <button
                key={e.id_exercicio}
                onClick={() => setExSel(e.id_exercicio === exSel ? null : e.id_exercicio)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', border: 'none', borderTop: '1px solid #F7F3EE', background: exSel === e.id_exercicio ? 'rgba(204,26,26,0.05)' : '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
              >
                <p style={{ fontSize: 13, fontWeight: exSel === e.id_exercicio ? 700 : 500, color: exSel === e.id_exercicio ? '#CC1A1A' : '#1A1A1A' }}>{e.nome}</p>
                <ChevronDown size={14} color={exSel === e.id_exercicio ? '#CC1A1A' : '#C4B9A8'} style={{ transform: exSel === e.id_exercicio ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
            ))}
          </div>
        ))}
      </div>

      {exSel && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', padding: '16px 20px', borderBottom: '1px solid #F0EBE4' }}>
            Histórico de carga
          </p>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : historico.length === 0 ? (
            <p style={{ padding: '24px 20px', fontSize: 13, color: '#8A7F76', textAlign: 'center' }}>Nenhum registro ainda</p>
          ) : (
            <div>
              {historico.slice(0, 10).map((h, i) => {
                const pct = maxCarga > 0 ? (Number(h.max_carga) / maxCarga) * 100 : 0
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderTop: i > 0 ? '1px solid #F7F3EE' : 'none' }}>
                    <p style={{ fontSize: 11, color: '#8A7F76', minWidth: 56 }}>{fmt(h.data)}</p>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 6, background: '#F7F3EE', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #CC1A1A, #FF6B6B)', borderRadius: 3 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 72 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>{fmtNum(h.max_carga)} <span style={{ fontSize: 11, fontWeight: 400, color: '#8A7F76' }}>kg</span></p>
                      <p style={{ fontSize: 10, color: '#A09890' }}>{h.total_series} séries · {h.total_reps} reps</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab Fotos ───────────────────────────────────────────────────────────────
function TabFotos({ id }) {
  const { data: fotos = [], isLoading } = useSWR(['ae-fotos', id], () => svc.buscarFotos(id), { revalidateOnFocus: false })

  const antes    = fotos.find(f => f.tipo === 'antes')
  const depois   = fotos.find(f => f.tipo === 'depois')
  const progresso = fotos.filter(f => f.tipo === 'progresso')

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (fotos.length === 0) return (
    <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
      <Camera size={28} color="#C4B9A8" style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Nenhuma foto ainda</p>
      <p style={{ fontSize: 13, color: '#8A7F76' }}>O aluno ainda não enviou fotos de evolução</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(antes || depois) && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', marginBottom: 14 }}>Antes e Depois</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['Antes', 'Depois'].map(t => {
              const foto = t === 'Antes' ? antes : depois
              return (
                <div key={t}>
                  {foto ? (
                    <div>
                      <img src={foto.url} alt={t} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                      <p style={{ fontSize: 10, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6, textAlign: 'center' }}>
                        {t} · {fmt(foto.data)}
                      </p>
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '3/4', background: '#F7F3EE', border: '1px dashed #E0D6CA', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Camera size={24} color="#C4B9A8" />
                      <p style={{ fontSize: 11, color: '#C4B9A8', textTransform: 'uppercase', fontWeight: 700 }}>{t}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {progresso.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', marginBottom: 14 }}>Progresso ({progresso.length} fotos)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {progresso.map(f => (
              <div key={f.id_evolucao_foto}>
                <img src={f.url} alt="progresso" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                <p style={{ fontSize: 10, color: '#8A7F76', marginTop: 4, textAlign: 'center' }}>{fmt(f.data)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Painel Análise IA ───────────────────────────────────────────────────────
function PainelAnaliseIA({ id, onFechar }) {
  const [analise, setAnalise]         = useState(null)
  const [dataGeracao, setDataGeracao] = useState(null)
  const [carregando, setCarregando]   = useState(true)
  const [gerando, setGerando]         = useState(false)
  const [erro, setErro]               = useState(null)
  const [semDados, setSemDados]       = useState(null)

  useEffect(() => {
    setCarregando(true)
    svc.buscarAnaliseIA(id)
      .then(d => { if (d?.analise) { setAnalise(d.analise); setDataGeracao(d.data_geracao) } })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [id])

  async function gerar() {
    setGerando(true)
    setErro(null)
    setSemDados(null)
    try {
      const { analise: texto } = await svc.gerarAnaliseIA(id)
      setAnalise(texto)
      setDataGeracao(new Date().toISOString())
    } catch (e) {
      const data = e.response?.data
      if (data?.code === 'SEM_DADOS') setSemDados(data.faltando)
      else setErro('Erro ao gerar análise. Tente novamente.')
    } finally { setGerando(false) }
  }

  function renderTexto(texto) {
    return texto.split('\n').map((linha, i) => {
      const partes = linha.split(/\*\*(.*?)\*\*/g)
      return (
        <p key={i} style={{ fontSize: 14, lineHeight: 1.7, color: '#1A1A1A', marginBottom: linha.trim() === '' ? 8 : 0 }}>
          {partes.map((p, j) => j % 2 === 1
            ? <strong key={j} style={{ fontWeight: 800, color: '#CC1A1A' }}>{p}</strong>
            : p
          )}
        </p>
      )
    })
  }

  return (
    <div style={{ background: '#FFFFFF', border: '1px solid rgba(204,26,26,0.25)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 24px rgba(204,26,26,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F0EBE4', background: 'linear-gradient(135deg, rgba(204,26,26,0.06) 0%, rgba(204,26,26,0.02) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={16} color="#CC1A1A" />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>Análise Coach IA</p>
            <p style={{ fontSize: 11, color: '#8A7F76' }}>Dados + fotos analisados pelo GPT-4o</p>
          </div>
        </div>
        <button onClick={onFechar} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E0D6CA', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={14} color="#8A7F76" />
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {carregando && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 24 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!analise && !carregando && !erro && !semDados && (
          <div style={{ textAlign: 'center', paddingBlock: 16 }}>
            <Sparkles size={32} color="#CC1A1A" style={{ marginBottom: 12, opacity: 0.7 }} />
            <p style={{ fontSize: 14, color: '#6B6560', marginBottom: 20, lineHeight: 1.6 }}>
              O GPT-4o vai analisar os treinos, medidas e fotos do aluno e gerar um relatório personalizado.
            </p>
            <button
              onClick={gerar}
              disabled={gerando}
              style={{ height: 44, paddingInline: 28, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: gerando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(180,26,26,0.3)', opacity: gerando ? 0.7 : 1 }}
            >
              Gerar análise
            </button>
          </div>
        )}

        {semDados && (
          <div style={{ paddingBlock: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Dados insuficientes para análise</p>
            <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 16, lineHeight: 1.5 }}>Complete ao menos um dos itens abaixo:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { ok: !semDados.treinos, label: 'Pelo menos 3 treinos concluídos' },
                { ok: !semDados.medidas, label: 'Ao menos 1 registro de medidas' },
                { ok: !semDados.fotos,   label: 'Ao menos 1 foto de evolução' },
              ].map(({ ok, label }) => (
                <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: ok ? 'rgba(21,128,61,0.05)' : '#F7F3EE', border: `1px solid ${ok ? 'rgba(21,128,61,0.2)' : '#E0D6CA'}` }}>
                  <span style={{ fontSize: 13, color: ok ? '#15803d' : '#8A7F76' }}>{ok ? '✓' : '○'}</span>
                  <p style={{ fontSize: 13, fontWeight: 600, color: ok ? '#15803d' : '#1A1A1A' }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {gerando && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBlock: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#8A7F76' }}>Analisando dados e fotos do aluno...</p>
          </div>
        )}

        {erro && (
          <div style={{ textAlign: 'center', paddingBlock: 16 }}>
            <p style={{ fontSize: 13, color: '#CC1A1A', marginBottom: 12 }}>{erro}</p>
            <button onClick={gerar} style={{ height: 36, paddingInline: 20, borderRadius: 10, border: '1px solid #CC1A1A', background: 'transparent', color: '#CC1A1A', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Tentar novamente
            </button>
          </div>
        )}

        {analise && !gerando && (
          <div>
            {dataGeracao && (
              <p style={{ fontSize: 11, color: '#A09890', marginBottom: 14 }}>
                Gerada em {new Date(dataGeracao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <div>{renderTexto(analise)}</div>
            <button
              onClick={gerar}
              disabled={gerando}
              style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 16, borderRadius: 10, border: '1px solid rgba(204,26,26,0.3)', background: 'rgba(204,26,26,0.05)', color: '#CC1A1A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              <Sparkles size={13} />
              Atualizar análise
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AdminEvolucaoAluno() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const [tab, setTab] = useState('Treinos')
  const [verAnalise, setVerAnalise] = useState(false)

  const { data: resumo }      = useSWR(['ae-resumo',  id], () => svc.buscarResumo(id),      { revalidateOnFocus: false })
  const { data: medidas = [] } = useSWR(['ae-medidas', id], () => svc.buscarMedidas(id),    { revalidateOnFocus: false })
  const { data: aluno }        = useSWR(['admin-aluno', id], () => alunosService.buscarPorId(id), { revalidateOnFocus: false })

  const ultimaMedida = medidas[0]
  const nomeAluno = aluno?.nome || null

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <button
            onClick={() => navigate('/gestao/evolucao-alunos')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10, height: 30, paddingInline: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#8A7F76' }}
            onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
            onMouseLeave={e => e.currentTarget.style.color = '#8A7F76'}
          >
            <ArrowLeft size={14} /> Evolução dos alunos
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>
            {nomeAluno || '...'}
          </h1>
          {ultimaMedida?.peso && (
            <p style={{ fontSize: 13, color: '#8A7F76' }}>
              {parseFloat(ultimaMedida.peso).toLocaleString('pt-BR')} kg
              {ultimaMedida.gordura_pct && ` · ${parseFloat(ultimaMedida.gordura_pct).toLocaleString('pt-BR')}% gordura`}
            </p>
          )}
        </div>
        <button
          onClick={() => setVerAnalise(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 10, border: 'none', background: verAnalise ? '#1A1A1A' : 'linear-gradient(135deg, #1A1A1A 0%, #2d1a1a 100%)', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.25)', flexShrink: 0, position: 'relative' }}
        >
          <Sparkles size={13} color="#FF6B6B" />
          Análise IA
          {!verAnalise && (
            <span style={{ position: 'absolute', top: -5, right: -5, background: '#CC1A1A', color: '#FFF', fontSize: 9, fontWeight: 800, borderRadius: 10, padding: '2px 5px' }}>IA</span>
          )}
        </button>
      </div>

      {verAnalise && <PainelAnaliseIA id={id} onFechar={() => setVerAnalise(false)} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 14, padding: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: tab === t ? '#CC1A1A' : 'transparent', color: tab === t ? '#FFFFFF' : '#8A7F76', boxShadow: tab === t ? '0 2px 8px rgba(180,26,26,0.25)' : 'none' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Treinos' && <TabTreinos id={id} />}
      {tab === 'Medidas' && <TabMedidas id={id} />}
      {tab === 'Cargas'  && <TabCargas  id={id} />}
      {tab === 'Fotos'   && <TabFotos   id={id} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
