import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Dumbbell, Ruler, ChevronDown, Plus, X, Calendar, Target, Sparkles, Bot, Camera, Trash2, Home } from 'lucide-react'
import {
  buscarResumo, buscarSessoes, buscarMedidas, adicionarMedida,
  buscarHistoricoCarga, buscarExercicios, buscarAnaliseIA, gerarAnaliseIA,
  buscarFotos, uploadFoto, deletarFoto,
} from '../../services/evolucao'

const TABS = ['Fotos', 'Treinos', 'Medidas', 'Cargas']

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

// ─── Tab Fotos ───────────────────────────────────────────────────────────────
const TIPOS_FOTO = [
  { key: 'antes',     label: 'Antes'     },
  { key: 'depois',    label: 'Depois'    },
  { key: 'progresso', label: 'Progresso' },
]

function TabFotos() {
  const { data: fotos = [], mutate, isLoading } = useSWR('evolucao-fotos', buscarFotos, { revalidateOnFocus: false })
  const [enviando, setEnviando] = useState(false)
  const [tipo, setTipo] = useState('progresso')
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [deletando, setDeletando] = useState(null)
  const inputRef = useState(null)

  const antes   = fotos.find(f => f.tipo === 'antes')
  const depois  = fotos.find(f => f.tipo === 'depois')
  const progresso = fotos.filter(f => f.tipo === 'progresso')

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviando(true)
    try {
      const fd = new FormData()
      fd.append('foto', file)
      fd.append('tipo', tipo)
      fd.append('data', data)
      const nova = await uploadFoto(fd)
      mutate([nova, ...fotos], false)
    } finally {
      setEnviando(false)
      e.target.value = ''
    }
  }

  async function handleDeletar(id) {
    setDeletando(id)
    try {
      await deletarFoto(id)
      mutate(fotos.filter(f => f.id_evolucao_foto !== id), false)
    } finally { setDeletando(null) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Banner IA */}
      <div style={{ borderRadius: 20, padding: '20px 22px', background: 'linear-gradient(135deg, #1A1A1A 0%, #2d1a1a 100%)', boxShadow: '0 4px 24px rgba(0,0,0,0.18)', position: 'relative', overflow: 'hidden' }}>
        {/* Decoração de fundo */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(204,26,26,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 40, width: 70, height: 70, borderRadius: '50%', background: 'rgba(204,26,26,0.1)' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(204,26,26,0.3)', border: '1px solid rgba(204,26,26,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="#FF6B6B" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#FF6B6B', textTransform: 'uppercase', letterSpacing: '0.18em' }}>Exclusivo MG Evolution</span>
          </div>

          <p style={{ fontSize: 16, fontWeight: 900, color: '#FFFFFF', marginBottom: 6, lineHeight: 1.3 }}>
            Suas fotos analisadas por Inteligência Artificial
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 14 }}>
            O GPT-4o analisa visualmente suas fotos de antes e depois junto com seus dados de treino e medidas — e gera um relatório personalizado da sua transformação.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['📸 Análise visual das fotos', '📊 Dados de treino', '📏 Medidas corporais'].map(item => (
              <span key={item} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '4px 10px' }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Upload */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', marginBottom: 14 }}>Adicionar foto</p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {TIPOS_FOTO.map(t => (
            <button
              key={t.key}
              onClick={() => setTipo(t.key)}
              style={{ flex: 1, height: 34, borderRadius: 8, border: `1px solid ${tipo === t.key ? '#CC1A1A' : '#E0D6CA'}`, background: tipo === t.key ? 'rgba(204,26,26,0.07)' : '#FFFFFF', color: tipo === t.key ? '#CC1A1A' : '#8A7F76', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={data}
          onChange={e => setData(e.target.value)}
          style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FAFAF9', marginBottom: 12, boxSizing: 'border-box' }}
        />

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, border: '1.5px dashed #E0D6CA', background: '#FAFAF9', color: '#8A7F76', fontSize: 13, fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer', opacity: enviando ? 0.6 : 1 }}>
          <Camera size={16} />
          {enviando ? 'Enviando...' : 'Escolher foto'}
          <input type="file" accept="image/*" onChange={handleUpload} disabled={enviando} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Antes / Depois */}
      {(antes || depois) && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', marginBottom: 14 }}>Antes &amp; Depois</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[{ tipo: 'antes', foto: antes }, { tipo: 'depois', foto: depois }].map(({ tipo: t, foto }) => (
              <div key={t}>
                {foto ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={foto.url}
                      alt={t}
                      style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 12, display: 'block' }}
                    />
                    <button
                      onClick={() => handleDeletar(foto.id_evolucao_foto)}
                      disabled={deletando === foto.id_evolucao_foto}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 6, textAlign: 'center' }}>
                      {t} · {fmt(foto.data)}
                    </p>
                  </div>
                ) : (
                  <div style={{ aspectRatio: '3/4', background: '#F7F3EE', border: '1px dashed #E0D6CA', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Camera size={24} color="#C4B9A8" />
                    <p style={{ fontSize: 11, color: '#C4B9A8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>{t}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de progresso */}
      {progresso.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', marginBottom: 14 }}>Progresso</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {progresso.map(f => (
              <div key={f.id_evolucao_foto} style={{ position: 'relative' }}>
                <img
                  src={f.url}
                  alt="progresso"
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, display: 'block' }}
                />
                <button
                  onClick={() => handleDeletar(f.id_evolucao_foto)}
                  disabled={deletando === f.id_evolucao_foto}
                  style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Trash2 size={11} />
                </button>
                <p style={{ fontSize: 10, color: '#8A7F76', marginTop: 4, textAlign: 'center' }}>{fmt(f.data)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {fotos.length === 0 && !isLoading && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <Camera size={28} color="#C4B9A8" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Nenhuma foto ainda</p>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Adicione fotos para documentar sua transformação</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab Treinos ─────────────────────────────────────────────────────────────
function TabTreinos() {
  const { data: resumo }  = useSWR('evolucao-resumo',  buscarResumo,  { revalidateOnFocus: false })
  const { data: sessoes } = useSWR('evolucao-sessoes', buscarSessoes, { revalidateOnFocus: false })

  const sessoesMap = {}
  ;(sessoes || []).forEach(s => {
    const key = typeof s.data === 'string' ? s.data.slice(0, 10) : s.data.toISOString().slice(0, 10)
    sessoesMap[key] = s
  })

  // Gera os últimos 42 dias para a grade (6 semanas)
  const hoje = new Date()
  const diasGrade = []
  for (let i = 41; i >= 0; i--) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    diasGrade.push({ key, d, sessao: sessoesMap[key] || null })
  }

  // Alinha para começar na segunda (preenche com nulls no início)
  const primeiroDia = diasGrade[0].d.getDay() // 0=dom
  const offsetInicio = primeiroDia === 0 ? 6 : primeiroDia - 1
  const grade = [...Array(offsetInicio).fill(null), ...diasGrade]

  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
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

      {/* Calendário */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Calendar size={16} color="#CC1A1A" />
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>Últimas 6 semanas</p>
        </div>

        {/* Header dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {diasSemana.map(d => (
            <p key={d} style={{ fontSize: 10, fontWeight: 700, color: '#C4B9A8', textAlign: 'center', textTransform: 'uppercase' }}>{d}</p>
          ))}
        </div>

        {/* Grade */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {grade.map((item, i) => {
            if (!item) return <div key={`empty-${i}`} />
            const isHoje = item.key === hoje.toISOString().slice(0, 10)
            const concluida = item.sessao?.concluidas > 0
            const iniciada  = item.sessao && !concluida
            return (
              <div
                key={item.key}
                title={`${item.d.toLocaleDateString('pt-BR')}${item.sessao ? ` · ${item.sessao.concluidas} treino(s)` : ''}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 6,
                  background: concluida ? '#CC1A1A' : iniciada ? 'rgba(204,26,26,0.2)' : '#F7F3EE',
                  border: isHoje ? '2px solid #CC1A1A' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {concluida && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />}
              </div>
            )
          })}
        </div>

        {/* Legenda */}
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
  { key: 'peso',        label: 'Peso',        sufixo: 'kg',  step: '0.1', max: '300' },
  { key: 'gordura_pct', label: 'Gordura',     sufixo: '%',   step: '0.1', max: '60'  },
  { key: 'massa_magra', label: 'Massa magra', sufixo: 'kg',  step: '0.1', max: '150' },
  { key: 'cintura_cm',  label: 'Cintura',     sufixo: 'cm',  step: '0.5', max: '200' },
  { key: 'quadril_cm',  label: 'Quadril',     sufixo: 'cm',  step: '0.5', max: '200' },
  { key: 'peito_cm',    label: 'Peito',       sufixo: 'cm',  step: '0.5', max: '200' },
  { key: 'braco_cm',    label: 'Braço',       sufixo: 'cm',  step: '0.5', max: '100' },
  { key: 'coxa_cm',     label: 'Coxa',        sufixo: 'cm',  step: '0.5', max: '100' },
]

function TabMedidas() {
  const { data: medidas = [], mutate } = useSWR('evolucao-medidas', buscarMedidas, { revalidateOnFocus: false })
  const [abrirForm, setAbrirForm] = useState(false)
  const [form, setForm] = useState({ data: new Date().toISOString().slice(0, 10) })
  const [salvando, setSalvando] = useState(false)

  async function handleSalvar() {
    const algumCampo = CAMPOS_MEDIDA.some(c => form[c.key])
    if (!algumCampo) return
    setSalvando(true)
    try {
      const nova = await adicionarMedida(form)
      mutate([nova, ...medidas], false)
      setForm({ data: new Date().toISOString().slice(0, 10) })
      setAbrirForm(false)
    } finally { setSalvando(false) }
  }

  const ultima = medidas[0]
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
      {/* Botão adicionar */}
      <button
        onClick={() => setAbrirForm(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 12, border: abrirForm ? '1px solid #E0D6CA' : 'none', background: abrirForm ? '#FFFFFF' : 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: abrirForm ? '#6B6560' : '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: abrirForm ? 'none' : '0 4px 14px rgba(180,26,26,0.3)' }}
      >
        {abrirForm ? <X size={16} /> : <Plus size={16} />}
        {abrirForm ? 'Cancelar' : 'Registrar medidas'}
      </button>

      {/* Formulário */}
      {abrirForm && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', marginBottom: 16 }}>Nova medição</p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A7F76', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Data</label>
            <input
              type="date"
              value={form.data || ''}
              onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
              style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FAFAF9', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {CAMPOS_MEDIDA.map(c => (
              <div key={c.key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8A7F76', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{c.label} <span style={{ color: '#C4B9A8', fontWeight: 400 }}>({c.sufixo})</span></label>
                <input
                  type="number"
                  step={c.step}
                  max={c.max}
                  min="0"
                  value={form[c.key] || ''}
                  onChange={e => setForm(f => ({ ...f, [c.key]: e.target.value }))}
                  placeholder="—"
                  style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FAFAF9', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSalvar}
            disabled={salvando}
            style={{ width: '100%', height: 44, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}
          >
            {salvando ? 'Salvando...' : 'Salvar medidas'}
          </button>
        </div>
      )}

      {/* Última medição + delta */}
      {ultima && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>Última medição</p>
            <p style={{ fontSize: 12, color: '#8A7F76' }}>{fmt(ultima.data)}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
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
                      <p style={{ fontSize: 11, fontWeight: 700, color: d.positivo ? '#CC1A1A' : '#15803d', marginLeft: 2 }}>
                        {d.positivo ? '+' : ''}{d.valor.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
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

      {medidas.length === 0 && !abrirForm && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <Ruler size={28} color="#C4B9A8" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Nenhuma medida registrada</p>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Registre suas medidas para acompanhar sua evolução</p>
        </div>
      )}
    </div>
  )
}

// ─── Tab Cargas ───────────────────────────────────────────────────────────────
function TabCargas() {
  const { data: exercicios = [] } = useSWR('evolucao-exercicios', buscarExercicios, { revalidateOnFocus: false })
  const [exSel, setExSel] = useState(null)

  const { data: historico = [], isLoading } = useSWR(
    exSel ? `evolucao-carga-${exSel}` : null,
    () => buscarHistoricoCarga(exSel),
    { revalidateOnFocus: false }
  )

  const grupos = [...new Set(exercicios.map(e => e.grupo_muscular))].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Seletor de exercício */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', padding: '16px 20px', borderBottom: '1px solid #F0EBE4' }}>Selecione um exercício</p>
        {exercicios.length === 0 ? (
          <p style={{ padding: '24px 20px', fontSize: 13, color: '#8A7F76', textAlign: 'center' }}>Nenhum protocolo ativo</p>
        ) : grupos.map(g => (
          <div key={g}>
            <p style={{ padding: '10px 20px 6px', fontSize: 10, fontWeight: 700, color: '#A09890', textTransform: 'uppercase', letterSpacing: '0.12em', background: '#FAFAF9' }}>{g}</p>
            {exercicios.filter(e => e.grupo_muscular === g).map((e, i, arr) => (
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

      {/* Histórico de carga */}
      {exSel && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #F0EBE4' }}>
            <TrendingUp size={16} color="#CC1A1A" />
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A' }}>Progressão de carga</p>
          </div>

          {isLoading ? (
            <div style={{ padding: '32px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : historico.length === 0 ? (
            <p style={{ padding: '32px 20px', fontSize: 13, color: '#8A7F76', textAlign: 'center' }}>Nenhuma carga registrada para este exercício ainda</p>
          ) : (
            <>
              {/* Mini gráfico de barras */}
              <div style={{ padding: '16px 20px 8px' }}>
                <MiniGrafico dados={historico} />
              </div>

              {/* Lista */}
              <div>
                {[...historico].reverse().map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid #F7F3EE' }}>
                    <p style={{ fontSize: 12, color: '#8A7F76' }}>{fmt(h.data)}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>{h.carga_usada}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!exSel && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '40px 24px', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <Target size={28} color="#C4B9A8" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>Selecione um exercício</p>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Veja como sua carga evoluiu ao longo das sessões</p>
        </div>
      )}
    </div>
  )
}

// ─── Mini gráfico SVG ─────────────────────────────────────────────────────────
function MiniGrafico({ dados }) {
  if (!dados.length) return null

  // Tenta extrair número de strings de carga como "20kg", "20", "barra 40kg"
  const valores = dados.map(d => {
    const match = d.carga_usada?.match(/(\d+[\.,]?\d*)\s*kg/i) || d.carga_usada?.match(/(\d+[\.,]?\d*)/)
    return match ? parseFloat(match[1].replace(',', '.')) : null
  })

  const valoresValidos = valores.filter(v => v !== null)
  if (valoresValidos.length < 2) return null

  const min = Math.min(...valoresValidos) * 0.9
  const max = Math.max(...valoresValidos) * 1.05
  const W = 320, H = 80, padX = 10

  const pts = dados.map((_, i) => {
    if (valores[i] === null) return null
    const x = padX + (i / (dados.length - 1)) * (W - 2 * padX)
    const y = H - ((valores[i] - min) / (max - min)) * (H - 10) - 5
    return [x, y]
  }).filter(Boolean)

  if (pts.length < 2) return null

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#CC1A1A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#CC1A1A" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? '#CC1A1A' : '#E07070'} />
      ))}
    </svg>
  )
}

// ─── Painel Análise IA ────────────────────────────────────────────────────────
function PainelAnaliseIA({ onFechar }) {
  const [analise, setAnalise]       = useState(null)
  const [dataGeracao, setDataGeracao] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [gerando, setGerando]       = useState(false)
  const [semDados, setSemDados]     = useState(null)
  const [erro, setErro]             = useState(null)

  // Carrega cache ao abrir
  useEffect(() => {
    setCarregando(true)
    buscarAnaliseIA()
      .then(d => {
        if (d?.analise) { setAnalise(d.analise); setDataGeracao(d.data_geracao) }
      })
      .catch(() => {})
      .finally(() => setCarregando(false))
  }, [])

  async function gerar() {
    setGerando(true)
    setErro(null)
    setSemDados(null)
    try {
      const { analise: texto } = await gerarAnaliseIA()
      setAnalise(texto)
      setDataGeracao(new Date().toISOString())
    } catch (e) {
      const data = e.response?.data
      if (data?.code === 'SEM_DADOS') {
        setSemDados(data.faltando)
      } else {
        setErro('Erro ao gerar análise. Tente novamente.')
      }
    } finally {
      setGerando(false)
    }
  }

  // Formata markdown bold simples (**texto**) para spans
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

      <div style={{ padding: '20px 20px' }}>
        {carregando && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 24 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!analise && !carregando && !erro && !semDados && (
          <div style={{ textAlign: 'center', paddingBlock: 16 }}>
            <Sparkles size={32} color="#CC1A1A" style={{ marginBottom: 12, opacity: 0.7 }} />
            <p style={{ fontSize: 14, color: '#6B6560', marginBottom: 20, lineHeight: 1.6 }}>
              O GPT-4o vai analisar seus treinos, medidas e fotos e gerar recomendações personalizadas.
            </p>
            <button
              onClick={gerar}
              disabled={gerando}
              style={{ height: 44, paddingInline: 28, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: '#FFFFFF', fontSize: 13, fontWeight: 800, cursor: gerando ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(180,26,26,0.3)', opacity: gerando ? 0.7 : 1 }}
            >
              {gerando ? 'Analisando...' : 'Gerar análise'}
            </button>
          </div>
        )}

        {semDados && (
          <div style={{ paddingBlock: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>Dados insuficientes para análise</p>
            <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 16, lineHeight: 1.5 }}>
              Para gerar uma análise útil, complete pelo menos um dos itens abaixo:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { ok: !semDados.treinos, label: 'Pelo menos 3 treinos concluídos',     detalhe: 'Vá em Treinos e conclua suas sessões' },
                { ok: !semDados.medidas, label: 'Ao menos 1 registro de medidas',       detalhe: 'Vá em Medidas e registre seu peso/circunferências' },
                { ok: !semDados.fotos,   label: 'Ao menos 1 foto de evolução',          detalhe: 'Vá em Fotos e adicione uma foto de progresso' },
              ].map(({ ok, label, detalhe }) => (
                <div key={label} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, background: ok ? 'rgba(21,128,61,0.05)' : '#F7F3EE', border: `1px solid ${ok ? 'rgba(21,128,61,0.2)' : '#E0D6CA'}` }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: ok ? 'rgba(21,128,61,0.15)' : '#E0D6CA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <span style={{ fontSize: 12 }}>{ok ? '✓' : '○'}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: ok ? '#15803d' : '#1A1A1A', marginBottom: 2 }}>{label}</p>
                    {!ok && <p style={{ fontSize: 11, color: '#8A7F76' }}>{detalhe}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gerando && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBlock: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ fontSize: 13, color: '#8A7F76' }}>Analisando seus dados e fotos...</p>
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
export default function Evolucao() {
  const [tab, setTab] = useState('Treinos')
  const [verAnalise, setVerAnalise] = useState(false)
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Evolução</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Acompanhe sua transformação</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
          >
            <Home size={14} />
            Home
          </button>
          <button
            onClick={() => setVerAnalise(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 10, border: 'none', background: verAnalise ? '#1A1A1A' : 'linear-gradient(135deg, #1A1A1A 0%, #2d1a1a 100%)', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.25)', position: 'relative' }}
          >
            <Sparkles size={13} color="#FF6B6B" />
            Análise IA
            {!verAnalise && (
              <span style={{ position: 'absolute', top: -5, right: -5, background: '#CC1A1A', color: '#FFF', fontSize: 9, fontWeight: 800, borderRadius: 10, padding: '2px 5px', letterSpacing: '0.05em' }}>IA</span>
            )}
          </button>
        </div>
      </div>

      {verAnalise && <PainelAnaliseIA onFechar={() => setVerAnalise(false)} />}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 14, padding: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s', background: tab === t ? '#CC1A1A' : 'transparent', color: tab === t ? '#FFFFFF' : '#8A7F76', boxShadow: tab === t ? '0 2px 8px rgba(180,26,26,0.25)' : 'none' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Fotos'   && <TabFotos />}
      {tab === 'Treinos' && <TabTreinos />}
      {tab === 'Medidas' && <TabMedidas />}
      {tab === 'Cargas'  && <TabCargas />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
