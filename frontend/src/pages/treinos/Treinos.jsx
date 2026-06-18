import { useState, useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import { Dumbbell, Play, RotateCcw, X, Check, ChevronDown, ChevronUp, Trophy, History, Clock, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { buscarMeuProtocolo, buscarSessao, iniciarSessao, marcarExercicio, concluirSessao, cancelarSessao, buscarHistorico } from '../../services/treinos'
import { buscarVideoUrl } from '../../services/exercicios'

const DIAS = [
  { num: 1, label: 'Seg', labelLong: 'Segunda' },
  { num: 2, label: 'Ter', labelLong: 'Terça' },
  { num: 3, label: 'Qua', labelLong: 'Quarta' },
  { num: 4, label: 'Qui', labelLong: 'Quinta' },
  { num: 5, label: 'Sex', labelLong: 'Sexta' },
  { num: 6, label: 'Sáb', labelLong: 'Sábado' },
  { num: 7, label: 'Dom', labelLong: 'Domingo' },
]

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function diaSemanaHoje() {
  const d = new Date().getDay()
  return d === 0 ? 7 : d
}

function formatarData(dateStr) {
  if (!dateStr) return ''
  const s = typeof dateStr === 'string' ? dateStr : dateStr.toISOString()
  const d = new Date(s.includes('T') ? s : s + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatarDuracao(segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}min`
  if (m > 0) return `${m}min ${String(s).padStart(2,'0')}s`
  return `${s}s`
}

function useTimer(dataInicio, parado) {
  const [segundos, setSegundos] = useState(() => {
    if (!dataInicio) return 0
    return Math.floor((Date.now() - new Date(dataInicio).getTime()) / 1000)
  })
  const ref = useRef(null)

  useEffect(() => {
    if (!dataInicio || parado) { clearInterval(ref.current); return }
    const base = new Date(dataInicio).getTime()
    ref.current = setInterval(() => {
      setSegundos(Math.floor((Date.now() - base) / 1000))
    }, 1000)
    return () => clearInterval(ref.current)
  }, [dataInicio, parado])

  return segundos
}

// ─── Modal de vídeo ──────────────────────────────────────────────────────────
function ModalVideo({ ex, onClose }) {
  const [url, setUrl] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (!ex.video_url) return
    if (ex.video_url.startsWith('http')) {
      setUrl(ex.video_url); setCarregando(false); return
    }
    buscarVideoUrl(ex.id_exercicio)
      .then(r => { setUrl(r.url); setCarregando(false) })
      .catch(() => { setErro('Não foi possível carregar o vídeo.'); setCarregando(false) })
  }, [])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#1A1A1A', borderRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 560, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 2 }}>{ex.exercicio_nome}</p>
            <p style={{ fontSize: 12, color: '#8A7F76' }}>{ex.grupo_muscular}{ex.equipamento ? ` · ${ex.equipamento}` : ''}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #333', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#8A7F76" />
          </button>
        </div>
        <div style={{ background: '#000', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {carregando ? (
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #333', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
          ) : erro ? (
            <p style={{ fontSize: 13, color: '#8A7F76' }}>{erro}</p>
          ) : (
            <video src={url} controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}
        </div>
        {(ex.series || ex.repeticoes) && (
          <div style={{ padding: '14px 20px', display: 'flex', gap: 10 }}>
            {ex.series && ex.repeticoes && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 8, background: 'rgba(204,26,26,0.12)', border: '1px solid rgba(204,26,26,0.2)', fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>
                {ex.series}×{ex.repeticoes}
              </span>
            )}
            {ex.carga_sugerida && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 8, background: '#222', border: '1px solid #333', fontSize: 13, color: '#8A7F76' }}>
                <Dumbbell size={12} color="#8A7F76" />{ex.carga_sugerida}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Card de exercício com check ─────────────────────────────────────────────
function ExercicioCard({ ex, num, onVerVideo, onToggle, salvando, concluida }) {
  const [expandirCarga, setExpandirCarga] = useState(false)
  const [carga, setCarga] = useState(ex.carga_usada || '')

  function handleCheck() {
    if (concluida) return
    onToggle(ex, !ex.feito, ex.feito ? '' : carga)
  }

  function handleCargaConfirmar() {
    if (concluida) return
    onToggle(ex, ex.feito, carga)
    setExpandirCarga(false)
  }

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid #F7F3EE' }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Check */}
        <button
          onClick={handleCheck}
          disabled={salvando || concluida}
          style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${ex.feito ? '#CC1A1A' : '#E0D6CA'}`, background: ex.feito ? '#CC1A1A' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (salvando || concluida) ? 'default' : 'pointer', flexShrink: 0, marginTop: 2, transition: 'all 0.15s' }}
        >
          {ex.feito && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: ex.feito ? '#8A7F76' : '#1A1A1A', textDecoration: ex.feito ? 'line-through' : 'none', transition: 'all 0.15s' }}>
              {ex.exercicio_nome}
            </p>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {ex.video_url && (
                <button
                  onClick={() => onVerVideo(ex)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 28, paddingInline: 10, borderRadius: 8, border: '1px solid rgba(204,26,26,0.25)', background: 'rgba(204,26,26,0.06)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#CC1A1A' }}
                >
                  <Play size={10} fill="#CC1A1A" />
                  Vídeo
                </button>
              )}
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#8A7F76', marginBottom: 8 }}>{ex.grupo_muscular}{ex.equipamento ? ` · ${ex.equipamento}` : ''}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
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
            {ex.carga_usada && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 12, color: '#15803d' }}>
                <Dumbbell size={11} color="#15803d" />{ex.carga_usada}
              </span>
            )}
            {!concluida && (
              <button
                onClick={() => setExpandirCarga(v => !v)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: '#F7F3EE', border: '1px solid #E0D6CA', fontSize: 12, color: '#8A7F76', cursor: 'pointer' }}
              >
                <Dumbbell size={11} color="#8A7F76" />
                {ex.carga_usada ? 'Alterar' : 'Minha carga'}
                {expandirCarga ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}
          </div>

          {expandirCarga && !concluida && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <input
                value={carga}
                onChange={e => setCarga(e.target.value)}
                placeholder="Ex: 20kg, barra 40kg..."
                style={{ flex: 1, height: 36, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FFFFFF' }}
              />
              <button
                onClick={handleCargaConfirmar}
                style={{ height: 36, paddingInline: 16, borderRadius: 8, border: 'none', background: '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Salvar
              </button>
            </div>
          )}

          {ex.observacao && (
            <p style={{ fontSize: 11, color: '#A09890', marginTop: 6, fontStyle: 'italic' }}>{ex.observacao}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Histórico ───────────────────────────────────────────────────────────────
function HistoricoModal({ onClose }) {
  const { token } = useAuthContext()
  const { data: historico = [], isLoading } = useSWR(
    token ? 'treino-historico' : null,
    buscarHistorico,
    { revalidateOnFocus: false }
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #F0EBE4', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={18} color="#CC1A1A" />
            <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A' }}>Histórico de treinos</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E0D6CA', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#8A7F76" />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : historico.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#C4B9A8' }}>
              <p style={{ fontSize: 14 }}>Nenhum treino registrado ainda</p>
            </div>
          ) : historico.map(s => {
            const pct = s.total_exercicios > 0 ? Math.round((s.exercicios_feitos / s.total_exercicios) * 100) : 0
            const duracao = s.data_inicio && s.data_conclusao
              ? Math.floor((new Date(s.data_conclusao) - new Date(s.data_inicio)) / 1000)
              : null
            return (
              <div key={s.id_treino_sessao} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: '1px solid #F7F3EE' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.concluida ? 'rgba(34,197,94,0.1)' : '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {s.concluida ? <Trophy size={18} color="#15803d" /> : <Dumbbell size={18} color="#C4B9A8" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{s.dia_nome || DIAS.find(d => d.num === s.dia_semana)?.labelLong}</p>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <p style={{ fontSize: 11, color: '#8A7F76' }}>{formatarData(s.data_sessao)}</p>
                      {duracao !== null && (
                        <p style={{ fontSize: 11, color: '#8A7F76', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                          <Clock size={10} color="#8A7F76" />{formatarDuracao(duracao)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 4, background: '#F0EBE4', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: s.concluida ? '#15803d' : '#CC1A1A', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.concluida ? '#15803d' : '#CC1A1A', flexShrink: 0 }}>
                      {s.exercicios_feitos}/{s.total_exercicios}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Countdown ───────────────────────────────────────────────────────────────
function Countdown({ onFim }) {
  const [num, setNum] = useState(5)

  useEffect(() => {
    if (num <= 0) { onFim(); return }
    const t = setTimeout(() => setNum(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [num])

  return (
    <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        Prepare-se!
      </p>
      <div
        key={num}
        style={{
          width: 120, height: 120, borderRadius: '50%',
          background: num <= 1 ? 'linear-gradient(135deg, #15803d, #16a34a)' : 'linear-gradient(135deg, #A81515, #CC1A1A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: num <= 1 ? '0 0 40px rgba(21,128,61,0.4)' : '0 0 40px rgba(204,26,26,0.35)',
          animation: 'countPulse 0.9s ease-out',
        }}
      >
        <span style={{ fontSize: 56, fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
          {num === 0 ? '🏃' : num}
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#C4B9A8' }}>O treino vai começar</p>

      <style>{`
        @keyframes countPulse {
          0%   { transform: scale(1.4); opacity: 0.6; }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// ─── Painel de sessão ─────────────────────────────────────────────────────────
function PainelSessao({ diaInfo, protocolo, onConcluir }) {
  const [sessao, setSessao] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [iniciado, setIniciado] = useState(false)
  const [contagem, setContagem] = useState(false)
  const [salvando, setSalvando] = useState(null)
  const [exVideo, setExVideo] = useState(null)
  const [concluindo, setConcluindo] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [confirmarCancel, setConfirmarCancel] = useState(false)

  useEffect(() => {
    if (!diaInfo || diaInfo.descanso) return
    setSessao(null)
    setErro(null)
    setIniciado(false)
    setContagem(false)
    setCarregando(true)
    buscarSessao(diaInfo.id_treino_dia, protocolo.id_protocolo)
      .then(s => {
        setSessao(s)
        setCarregando(false)
        const jaComecou = s.concluida || s.data_inicio || (s.exercicios || []).some(e => e.feito)
        if (jaComecou) setIniciado(true)
      })
      .catch(e => { setErro(e.response?.data?.erro || 'Erro ao carregar treino'); setCarregando(false) })
  }, [diaInfo?.id_treino_dia])

  const segundos = useTimer(sessao?.data_inicio, sessao?.concluida)

  const handleIniciar = useCallback(async () => {
    if (!sessao) return
    setContagem(true)
    try {
      const r = await iniciarSessao(sessao.id_treino_sessao)
      setSessao(prev => ({ ...prev, data_inicio: r.data_inicio }))
    } catch {}
  }, [sessao])

  const handleToggle = useCallback(async (ex, feito, carga) => {
    if (!sessao || sessao.concluida) return
    setSalvando(ex.id_treino_dia_exercicio)
    try {
      await marcarExercicio(sessao.id_treino_sessao, ex.id_treino_dia_exercicio, feito, carga)
      setSessao(prev => ({
        ...prev,
        exercicios: prev.exercicios.map(e =>
          e.id_treino_dia_exercicio === ex.id_treino_dia_exercicio
            ? { ...e, feito, carga_usada: carga || e.carga_usada }
            : e
        ),
      }))
    } finally {
      setSalvando(null)
    }
  }, [sessao])

  async function handleCancelar() {
    if (!sessao || cancelando) return
    setCancelando(true)
    try {
      await cancelarSessao(sessao.id_treino_sessao)
      const nova = await buscarSessao(diaInfo.id_treino_dia, protocolo.id_protocolo)
      setSessao(nova)
      setIniciado(false)
      setContagem(false)
      setConfirmarCancel(false)
    } catch {}
    finally { setCancelando(false) }
  }

  async function handleConcluir() {
    if (!sessao || concluindo) return
    setConcluindo(true)
    try {
      await concluirSessao(sessao.id_treino_sessao)
      setSessao(prev => ({ ...prev, concluida: true, data_conclusao: new Date().toISOString() }))
      onConcluir?.()
    } finally {
      setConcluindo(false)
    }
  }

  if (!diaInfo || diaInfo.descanso) return null
  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (erro) return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#CC1A1A', marginBottom: 8 }}>{erro}</p>
      <p style={{ fontSize: 12, color: '#8A7F76' }}>Verifique se as migrations 015 e 016 foram executadas no banco.</p>
    </div>
  )
  if (!sessao) return null

  const exercicios    = sessao.exercicios || []
  const feitos        = exercicios.filter(e => e.feito).length
  const total         = exercicios.length
  const todosMarcados = total > 0 && feitos === total
  const pct           = total > 0 ? Math.round((feitos / total) * 100) : 0

  // duração final quando concluído
  const duracaoFinal = sessao.concluida && sessao.data_inicio && sessao.data_conclusao
    ? Math.floor((new Date(sessao.data_conclusao) - new Date(sessao.data_inicio)) / 1000)
    : null

  if (contagem) return <Countdown onFim={() => { setContagem(false); setIniciado(true) }} />

  if (!iniciado) return (
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, rgba(204,26,26,0.12) 0%, rgba(204,26,26,0.06) 100%)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Dumbbell size={28} color="#CC1A1A" />
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', marginBottom: 6 }}>{diaInfo.nome || 'Treino'}</p>
        <p style={{ fontSize: 13, color: '#8A7F76' }}>{total} exercícios · Marque cada um conforme for realizando</p>
      </div>
      <button
        onClick={handleIniciar}
        style={{ height: 48, paddingInline: 32, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: '#FFFFFF', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 16px rgba(180,26,26,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        <Play size={16} fill="white" />
        Iniciar treino
      </button>
    </div>
  )

  return (
    <>
      {/* Progresso + Timer */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #F0EBE4' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76' }}>
            {sessao.concluida ? 'Treino concluído!' : `${feitos} de ${total} exercícios`}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Timer */}
            {sessao.data_inicio && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: sessao.concluida ? '#15803d' : '#8A7F76' }}>
                <Clock size={12} color={sessao.concluida ? '#15803d' : '#8A7F76'} />
                {formatarDuracao(sessao.concluida && duracaoFinal !== null ? duracaoFinal : segundos)}
              </span>
            )}
            <span style={{ fontSize: 12, fontWeight: 800, color: sessao.concluida ? '#15803d' : '#CC1A1A' }}>{pct}%</span>
          </div>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: '#F0EBE4', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: sessao.concluida ? '#15803d' : '#CC1A1A', borderRadius: 6, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Exercícios */}
      <div style={{ padding: '0 24px' }}>
        {exercicios.map((ex, i) => (
          <ExercicioCard
            key={ex.id_treino_dia_exercicio}
            ex={ex}
            num={i + 1}
            onVerVideo={setExVideo}
            onToggle={handleToggle}
            salvando={salvando === ex.id_treino_dia_exercicio}
            concluida={!!sessao?.concluida}
          />
        ))}
      </div>

      {/* Concluir + Cancelar */}
      {!sessao.concluida && (
        <div style={{ padding: '20px 24px', borderTop: '1px solid #F0EBE4', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todosMarcados && (
            <button
              onClick={handleConcluir}
              disabled={concluindo}
              style={{ width: '100%', height: 48, borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)', color: '#FFFFFF', fontSize: 14, fontWeight: 800, cursor: concluindo ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px rgba(21,128,61,0.3)', opacity: concluindo ? 0.7 : 1 }}
            >
              <Trophy size={18} />
              {concluindo ? 'Salvando...' : 'Concluir treino'}
            </button>
          )}

          {confirmarCancel ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                style={{ flex: 1, height: 40, borderRadius: 12, border: '1px solid #CC1A1A', background: '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: cancelando ? 'not-allowed' : 'pointer', opacity: cancelando ? 0.7 : 1 }}
              >
                {cancelando ? 'Cancelando...' : 'Sim, cancelar'}
              </button>
              <button
                onClick={() => setConfirmarCancel(false)}
                style={{ flex: 1, height: 40, borderRadius: 12, border: '1px solid #E0D6CA', background: '#FFFFFF', color: '#6B6560', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Voltar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmarCancel(true)}
              style={{ width: '100%', height: 36, borderRadius: 10, border: '1px solid #E0D6CA', background: 'transparent', color: '#A09890', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar treino
            </button>
          )}
        </div>
      )}

      {sessao.concluida && (
        <div style={{ padding: '16px 24px', borderTop: '1px solid #F0EBE4', background: 'rgba(34,197,94,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: duracaoFinal ? 6 : 0 }}>
            <Trophy size={16} color="#15803d" />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Treino concluído!</p>
          </div>
          <div style={{ display: 'flex', gap: 16, paddingLeft: 26 }}>
            {sessao.data_conclusao && (
              <span style={{ fontSize: 12, color: '#6B6560' }}>
                {new Date(sessao.data_conclusao).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {duracaoFinal !== null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B6560' }}>
                <Clock size={11} color="#8A7F76" />
                {formatarDuracao(duracaoFinal)}
              </span>
            )}
          </div>
        </div>
      )}

      {exVideo && <ModalVideo ex={exVideo} onClose={() => setExVideo(null)} />}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Treinos() {
  const { token }  = useAuthContext()
  const navigate   = useNavigate()
  const hoje       = diaSemanaHoje()
  const [diaSel, setDiaSel] = useState(hoje)
  const [verHistorico, setVerHistorico] = useState(false)

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
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Treinos</h1>
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 40, textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Dumbbell size={24} color="#C4B9A8" />
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Nenhum protocolo atribuído</p>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>Seu personal trainer ainda não atribuiu um protocolo de treino. Aguarde — você será notificado quando estiver disponível.</p>
      </div>
    </div>
  )

  const diasMap     = {}
  ;(protocolo.dias || []).forEach(d => { diasMap[d.dia_semana] = d })
  const diaCorrente = diasMap[diaSel]
  const diaHoje     = diasMap[hoje]
  const labelHoje   = DIAS.find(d => d.num === hoje)?.labelLong || ''

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Treinos</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{protocolo.nome}</p>
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
            onClick={() => setVerHistorico(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
          >
            <History size={14} />
            Histórico
          </button>
        </div>
      </div>

      {/* Card hoje */}
      {diaHoje && !diaHoje.descanso ? (
        <div style={{ background: 'linear-gradient(135deg, rgba(204,26,26,0.08) 0%, rgba(204,26,26,0.03) 100%)', border: '1px solid rgba(204,26,26,0.22)', borderRadius: 20, padding: '24px 28px' }}>
          <p style={{ fontSize: 10, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, marginBottom: 8 }}>Treino de Hoje · {labelHoje}</p>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 6 }}>{diaHoje.nome || 'Treino'}</h2>
          <p style={{ fontSize: 13, color: '#8A7F76' }}><Dumbbell size={12} color="#8A7F76" style={{ display: 'inline', marginRight: 4 }} />{diaHoje.exercicios?.length || 0} exercícios</p>
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
              {temExs && !ativo && <span style={{ position: 'absolute', top: 5, right: 5, width: 5, height: 5, borderRadius: '50%', background: '#CC1A1A' }} />}
            </button>
          )
        })}
      </div>

      {/* Painel do dia */}
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
            <span style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>{diaCorrente.exercicios?.length || 0} exercícios</span>
          )}
        </div>

        {!diaCorrente || diaCorrente.descanso || !diaCorrente.exercicios?.length ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', color: '#C4B9A8' }}>
            <p style={{ fontSize: 14 }}>
              {diaCorrente?.descanso
                ? 'Dia de descanso — sem exercícios'
                : diaCorrente && !diaCorrente.exercicios?.length
                  ? 'Nenhum exercício cadastrado para este dia'
                  : 'Sem treino configurado para este dia'}
            </p>
          </div>
        ) : (
          <PainelSessao
            key={diaCorrente.id_treino_dia}
            diaInfo={diaCorrente}
            protocolo={protocolo}
          />
        )}
      </div>

      {verHistorico && <HistoricoModal onClose={() => setVerHistorico(false)} />}
    </div>
  )
}
