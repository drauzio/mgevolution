import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { Plus, Trash2, Search, GripVertical, LayoutTemplate, Zap, Pencil, Sparkles } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAuthContext } from '../../context/AuthContext'
import { BtnSalvar, BtnCancelar } from '../../components/ui/Botoes'
import * as alunosService from '../../services/alunos'
import * as treinosService from '../../services/treinos'
import * as templatesService from '../../services/templates'
import * as personaisService from '../../services/personais'

const DIAS = [
  { num: 1, label: 'Seg' },
  { num: 2, label: 'Ter' },
  { num: 3, label: 'Qua' },
  { num: 4, label: 'Qui' },
  { num: 5, label: 'Sex' },
  { num: 6, label: 'Sáb' },
  { num: 7, label: 'Dom' },
]

const GRUPOS = ['Peito','Costas','Pernas','Ombro','Bíceps','Tríceps','Abdômen','Cardio']

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  height: 42, padding: '0 14px',
  border: '1px solid #E0D6CA', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF',
  width: '100%', boxSizing: 'border-box',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

function ExercicioSelector({ onAdd }) {
  const [busca, setBusca] = useState('')
  const [grupo, setGrupo] = useState('')
  const [exercicios, setExercicios] = useState([])
  const [loading, setLoading] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [abrirAcima, setAbrirAcima] = useState(false)
  const [destacado, setDestacado] = useState(-1)
  const wrapRef = useRef(null)
  const listRef = useRef(null)

  async function buscarExs() {
    setLoading(true)
    const params = {}
    if (busca) params.busca = busca
    if (grupo) params.grupo = grupo
    const data = await treinosService.buscarExercicios(params)
    setExercicios(data)
    setDestacado(data.length > 0 ? 0 : -1)
    if (data.length > 0) {
      const rect = wrapRef.current?.getBoundingClientRect()
      setAbrirAcima((window.innerHeight - (rect?.bottom ?? 0)) < 260)
      setAberto(true)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!busca && !grupo) return
    const t = setTimeout(buscarExs, 350)
    return () => clearTimeout(t)
  }, [busca, grupo])

  useEffect(() => {
    if (!aberto) return
    const fn = (e) => { if (!wrapRef.current?.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [aberto])

  useEffect(() => {
    if (destacado < 0 || !listRef.current) return
    listRef.current.children[destacado]?.scrollIntoView({ block: 'nearest' })
  }, [destacado])

  function selecionar(ex) {
    onAdd(ex)
    setAberto(false)
    setBusca('')
    setExercicios([])
    setDestacado(-1)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!aberto) { buscarExs(); return }
      const idx = destacado >= 0 ? destacado : 0
      if (exercicios[idx]) selecionar(exercicios[idx])
      return
    }
    if (!aberto || exercicios.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setDestacado(i => Math.min(i + 1, exercicios.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setDestacado(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Escape') setAberto(false)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'flex', gap: 8 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 10, overflow: 'hidden', height: 38 }}>
        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {loading
            ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.7s linear infinite' }} />
            : <Search size={14} color="#8A7F76" />}
        </div>
        <input
          value={busca}
          onChange={e => { setBusca(e.target.value); setDestacado(0) }}
          onKeyDown={onKeyDown}
          placeholder="Digite e pressione Enter para adicionar..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#1A1A1A', background: 'transparent', height: '100%' }}
        />
      </div>
      <select
        value={grupo}
        onChange={e => setGrupo(e.target.value)}
        style={{ height: 38, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 12, color: '#6B6560', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}
      >
        <option value="">Todos os grupos</option>
        {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
      </select>

      {aberto && (
        <div
          ref={listRef}
          style={{ position: 'absolute', ...(abrirAcima ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }), left: 0, right: 0, zIndex: 200, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: 260, overflowY: 'auto' }}
        >
          {exercicios.map((ex, i) => (
            <button
              key={ex.id_exercicio}
              onClick={() => selecionar(ex)}
              onMouseEnter={() => setDestacado(i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', border: 'none', background: i === destacado ? '#FDF5F5' : 'transparent', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F0EBE4', borderLeft: i === destacado ? '3px solid #CC1A1A' : '3px solid transparent' }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{ex.nome}</p>
                <p style={{ fontSize: 11, color: '#8A7F76' }}>{ex.grupo_muscular} · {ex.equipamento}</p>
              </div>
              <Plus size={14} color="#CC1A1A" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ExercicioRow({ id, ex, onChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'grid', gridTemplateColumns: '20px 1fr 64px 80px 80px 80px 32px', gap: 8,
        alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F7F3EE',
        transform: CSS.Transform.toString(transform), transition,
        opacity: isDragging ? 0.4 : 1, background: isDragging ? '#FDF5F5' : 'transparent',
      }}
    >
      <div {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center', touchAction: 'none' }}>
        <GripVertical size={14} color="#C4B9A8" />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{ex.nome}</p>
        <p style={{ fontSize: 11, color: '#8A7F76' }}>{ex.grupo_muscular}</p>
      </div>
      {[
        ['series', 'Séries'],
        ['repeticoes', 'Reps'],
        ['carga_sugerida', 'Carga'],
        ['descanso_seg', 'Desc(s)'],
      ].map(([key, ph]) => (
        <input
          key={key}
          value={ex[key] || ''}
          onChange={e => onChange(key, e.target.value)}
          placeholder={ph}
          style={{ height: 34, padding: '0 8px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', width: '100%', background: '#FFFFFF' }}
        />
      ))}
      <button
        onClick={onRemove}
        style={{ width: 32, height: 32, border: '1px solid #F0EBE4', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
      >
        <Trash2 size={13} color="#CC1A1A" />
      </button>
    </div>
  )
}

const DIAS_VAZIOS = DIAS.map(d => ({ dia_semana: d.num, nome: '', descanso: d.num === 7, exercicios: [] }))

export default function TreinoForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()
  const location = useLocation()
  const { token } = useAuthContext()

  const isProtocolos = location.pathname.startsWith('/conteudo/protocolos') || location.pathname.startsWith('/admin/protocolos')
  const base = location.pathname.startsWith('/conteudo/protocolos') ? '/conteudo/protocolos'
             : location.pathname.startsWith('/admin/protocolos')    ? '/admin/protocolos'
             : location.pathname.startsWith('/conteudo/treinos')    ? '/conteudo/treinos'
             : '/admin/treinos'

  const { data: alunos = [] } = useSWR(
    token && !isProtocolos ? 'alunos-lista' : null,
    () => alunosService.listar()
  )

  const { data: templatesList = [] } = useSWR(
    token && !isProtocolos && !isEdicao ? 'templates-lista' : null,
    () => templatesService.listar()
  )

  const { data: personais = [] } = useSWR(
    token && isProtocolos ? 'personais-lista' : null,
    () => personaisService.listar({ status: 'ativos' })
  )

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const [isDirty, setIsDirty] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)

  useEffect(() => {
    if (!isDirty) return
    const fn = e => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', fn)
    return () => window.removeEventListener('beforeunload', fn)
  }, [isDirty])

  const [form, setForm] = useState({
    id_usuario: '', nome: '', objetivo: '', observacoes: '',
    data_inicio: '', data_fim: '',
    criterio_objetivo: '', criterio_nivel: '', criterio_sexo: '',
    criterio_idade_min: '', criterio_idade_max: '',
  })
  const [dias, setDias] = useState(DIAS_VAZIOS)
  const [diaAtivo, setDiaAtivo] = useState(1)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(isEdicao)
  const [gerandoIA, setGerandoIA] = useState(false)
  const [numDias, setNumDias] = useState('5')
  const [idPersonalIA, setIdPersonalIA] = useState('')
  const [msgIA, setMsgIA] = useState(null)

  // Seletor de template como base (apenas em novo treino individual)
  const [modoBase, setModoBase] = useState('vazio')   // 'vazio' | 'template'
  const [templateBaseId, setTemplateBaseId] = useState('')
  const [carregandoBase, setCarregandoBase] = useState(false)
  const [baseCarregada, setBaseCarregada] = useState(false)
  const [idTemplateOrigem, setIdTemplateOrigem] = useState(null)

  useEffect(() => {
    if (!isEdicao) return
    const svc = isProtocolos ? templatesService : treinosService
    svc.buscarPorId(id)
      .then(data => {
        setForm({
          id_usuario: data.id_usuario || '',
          nome: data.nome,
          objetivo: data.objetivo || '',
          observacoes: data.observacoes || '',
          data_inicio: data.data_inicio?.slice(0, 10) || '',
          data_fim: data.data_fim?.slice(0, 10) || '',
          criterio_objetivo: data.criterio_objetivo || '',
          criterio_nivel: data.criterio_nivel || '',
          criterio_sexo: data.criterio_sexo || '',
          criterio_idade_min: data.criterio_idade_min ?? '',
          criterio_idade_max: data.criterio_idade_max ?? '',
        })
        const diaKey = isProtocolos ? 'id_template_dia' : 'id_treino_dia'
        const exKey  = isProtocolos ? 'id_template_dia_exercicio' : 'id_treino_dia_exercicio'
        const diasCarregados = DIAS.map(d => {
          const found = data.dias?.find(x => x.dia_semana === d.num)
          if (found) return {
            dia_semana: d.num, nome: found.nome, descanso: !!found.descanso,
            exercicios: found.exercicios.map((e, i) => ({
              ...e, _uid: e[exKey] ?? `${d.num}-${i}`, nome: e.exercicio_nome,
            }))
          }
          return { dia_semana: d.num, nome: '', descanso: d.num === 7, exercicios: [] }
        })
        setDias(diasCarregados)
        if (data.id_template_origem) setIdTemplateOrigem(data.id_template_origem)
      })
      .finally(() => setCarregando(false))
  }, [id])

  async function carregarTemplate() {
    if (!templateBaseId) return
    setCarregandoBase(true)
    try {
      const tmpl = await templatesService.buscarPorId(templateBaseId)
      const diasBase = DIAS.map(d => {
        const found = tmpl.dias?.find(x => x.dia_semana === d.num)
        if (found) return {
          dia_semana: d.num, nome: found.nome, descanso: !!found.descanso,
          exercicios: found.exercicios.map((e, i) => ({
            _uid: `base-${d.num}-${i}`,
            id_exercicio: e.id_exercicio,
            nome: e.exercicio_nome,
            grupo_muscular: e.grupo_muscular,
            series: e.series ?? '3',
            repeticoes: e.repeticoes ?? '12',
            carga_sugerida: e.carga_sugerida ?? '',
            descanso_seg: e.descanso_seg ?? '60',
            observacao: '',
          }))
        }
        return { dia_semana: d.num, nome: '', descanso: d.num === 7, exercicios: [] }
      })
      setDias(diasBase)
      if (!form.nome && tmpl.nome) setForm(f => ({ ...f, nome: tmpl.nome, objetivo: tmpl.objetivo || '' }))
      setIdTemplateOrigem(Number(templateBaseId))
      setBaseCarregada(true)
      setIsDirty(true)
    } finally {
      setCarregandoBase(false)
    }
  }

  function limparBase() {
    setBaseCarregada(false)
    setTemplateBaseId('')
    setIdTemplateOrigem(null)
    setDias(DIAS_VAZIOS)
    setIsDirty(false)
  }

  function setF(k) { return e => { setForm(f => ({ ...f, [k]: e.target.value })); setIsDirty(true) } }

  function toggleDescanso() {
    setDias(prev => prev.map(d => d.dia_semana === diaAtivo ? { ...d, descanso: !d.descanso, exercicios: d.descanso ? d.exercicios : [] } : d))
    setIsDirty(true)
  }

  function setNomeDia(nome) {
    setDias(prev => prev.map(d => d.dia_semana === diaAtivo ? { ...d, nome } : d))
    setIsDirty(true)
  }

  function adicionarExercicio(ex) {
    setDias(prev => prev.map(d => d.dia_semana === diaAtivo
      ? { ...d, exercicios: [...d.exercicios, { _uid: Date.now() + Math.random(), id_exercicio: ex.id_exercicio, nome: ex.nome, grupo_muscular: ex.grupo_muscular, series: '3', repeticoes: '12', carga_sugerida: '', descanso_seg: '60', observacao: '' }] }
      : d
    ))
    setIsDirty(true)
  }

  function atualizarExercicio(idx, key, val) {
    setDias(prev => prev.map(d => {
      if (d.dia_semana !== diaAtivo) return d
      const exs = [...d.exercicios]
      exs[idx] = { ...exs[idx], [key]: val }
      return { ...d, exercicios: exs }
    }))
    setIsDirty(true)
  }

  function removerExercicio(idx) {
    setDias(prev => prev.map(d => d.dia_semana === diaAtivo
      ? { ...d, exercicios: d.exercicios.filter((_, i) => i !== idx) }
      : d
    ))
    setIsDirty(true)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setDias(prev => prev.map(d => {
      if (d.dia_semana !== diaAtivo) return d
      const oldIdx = d.exercicios.findIndex(e => e._uid === active.id)
      const newIdx = d.exercicios.findIndex(e => e._uid === over.id)
      return { ...d, exercicios: arrayMove(d.exercicios, oldIdx, newIdx) }
    }))
    setIsDirty(true)
  }

  const podeGerar = !!idPersonalIA && !!form.criterio_objetivo && !!form.criterio_sexo && !!form.criterio_idade_min && !!form.criterio_idade_max
  const faltandoIA = [
    !idPersonalIA          && 'personal',
    !form.criterio_objetivo && 'objetivo',
    !form.criterio_sexo     && 'sexo',
    !form.criterio_idade_min && 'idade mín.',
    !form.criterio_idade_max && 'idade máx.',
  ].filter(Boolean)

  async function handleGerarIA() {
    if (!idPersonalIA)              { setErro('Selecione o personal antes de gerar com IA'); return }
    if (!form.criterio_objetivo)    { setErro('Selecione o objetivo do protocolo'); return }
    if (!form.criterio_sexo)        { setErro('Selecione o sexo (critério obrigatório para geração com IA)'); return }
    if (!form.criterio_idade_min)   { setErro('Informe a idade mínima (critério obrigatório para geração com IA)'); return }
    if (!form.criterio_idade_max)   { setErro('Informe a idade máxima (critério obrigatório para geração com IA)'); return }
    setGerandoIA(true); setErro(null); setMsgIA(null)
    try {
      const result = await templatesService.gerarComIA({
        criterio_objetivo:  form.criterio_objetivo,
        criterio_nivel:     form.criterio_nivel,
        criterio_sexo:      form.criterio_sexo,
        criterio_idade_min: form.criterio_idade_min || undefined,
        criterio_idade_max: form.criterio_idade_max || undefined,
        num_dias:           Number(numDias),
        id_personal:        idPersonalIA || undefined,
      })
      setDias(result.dias)
      if (!form.nome)     setForm(f => ({ ...f, nome: result.nome }))
      if (!form.objetivo) setForm(f => ({ ...f, objetivo: result.objetivo }))
      setMsgIA(`Treino gerado com IA — ${result.dias.filter(d => !d.descanso).length} dias de treino. Revise e salve.`)
      setIsDirty(true)
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao gerar com IA')
    } finally {
      setGerandoIA(false)
    }
  }

  async function salvar() {
    if (!form.nome) { setErro('Nome é obrigatório'); return }
    if (!isProtocolos && !form.id_usuario) { setErro('Selecione o aluno'); return }
    if (isProtocolos && !form.criterio_objetivo) { setErro('Selecione o objetivo do protocolo'); return }
    setSalvando(true); setErro(null)
    try {
      if (isProtocolos) {
        const payload = { ...form, dias }
        if (isEdicao) await templatesService.atualizar(id, payload)
        else await templatesService.criar(payload)
      } else {
        const payload = { ...form, id_template_origem: idTemplateOrigem || null, dias }
        if (isEdicao) await treinosService.atualizar(id, payload)
        else await treinosService.criar(payload)
      }
      setIsDirty(false)
      navigate(base)
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  function handleCancel() {
    if (isDirty) { setShowLeaveModal(true); return }
    navigate(base)
  }

  const diaCorrente = dias.find(d => d.dia_semana === diaAtivo)

  const titulo = isEdicao
    ? (isProtocolos ? 'Editar Protocolo' : 'Editar Treino')
    : (isProtocolos ? 'Novo Protocolo'   : 'Novo Treino')

  const subtitulo = isProtocolos
    ? 'Configure o protocolo — será atribuído automaticamente pelo perfil do aluno.'
    : 'Selecione o aluno e configure os dias de treino individualmente.'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {titulo}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>{subtitulo}</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <BtnCancelar onClick={handleCancel} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {msgIA && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#15803d' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{msgIA}</span>
          <button onClick={() => setMsgIA(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Seletor de modo — apenas em novo treino individual */}
      {!isProtocolos && !isEdicao && (
        <div style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Como deseja criar este treino?
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setModoBase('vazio'); limparBase() }}
              style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: `2px solid ${modoBase === 'vazio' ? '#CC1A1A' : '#E0D6CA'}`, background: modoBase === 'vazio' ? 'rgba(204,26,26,0.04)' : '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Pencil size={14} color={modoBase === 'vazio' ? '#CC1A1A' : '#8A7F76'} />
                <span style={{ fontSize: 13, fontWeight: 700, color: modoBase === 'vazio' ? '#CC1A1A' : '#1A1A1A' }}>Treino Específico</span>
              </div>
              <p style={{ fontSize: 12, color: '#8A7F76', margin: 0 }}>Cria um treino específico para este aluno do início</p>
            </button>

            <button
              onClick={() => setModoBase('template')}
              style={{ flex: 1, padding: '14px 16px', borderRadius: 12, border: `2px solid ${modoBase === 'template' ? '#CC1A1A' : '#E0D6CA'}`, background: modoBase === 'template' ? 'rgba(204,26,26,0.04)' : '#FFFFFF', cursor: 'pointer', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <LayoutTemplate size={14} color={modoBase === 'template' ? '#CC1A1A' : '#8A7F76'} />
                <span style={{ fontSize: 13, fontWeight: 700, color: modoBase === 'template' ? '#CC1A1A' : '#1A1A1A' }}>Usar protocolo</span>
              </div>
              <p style={{ fontSize: 12, color: '#8A7F76', margin: 0 }}>Copia a estrutura de um protocolo e personaliza para o aluno</p>
            </button>
          </div>

          {modoBase === 'template' && (
            baseCarregada ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={14} color="#15803d" />
                  <span style={{ fontSize: 13, color: '#1A1A1A' }}>
                    Base: <strong>{templatesList.find(t => String(t.id_template) === String(templateBaseId))?.nome}</strong> — dias e exercícios carregados
                  </span>
                </div>
                <button
                  onClick={limparBase}
                  style={{ fontSize: 12, color: '#CC1A1A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}
                >
                  Remover base
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <select
                  value={templateBaseId}
                  onChange={e => setTemplateBaseId(e.target.value)}
                  style={{ ...selectStyle, height: 38, fontSize: 13, flex: 1 }}
                >
                  <option value="">Selecione um protocolo como ponto de partida...</option>
                  {templatesList.map(t => (
                    <option key={t.id_template} value={t.id_template}>
                      {t.nome}{t.criterio_objetivo ? ` — ${t.criterio_objetivo}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  onClick={carregarTemplate}
                  disabled={!templateBaseId || carregandoBase}
                  style={{ height: 38, paddingInline: 16, borderRadius: 10, border: `1px solid ${templateBaseId ? '#CC1A1A' : '#E0D6CA'}`, background: templateBaseId ? 'rgba(204,26,26,0.06)' : '#F0EBE4', color: templateBaseId ? '#CC1A1A' : '#C4B9A8', fontSize: 12, fontWeight: 700, cursor: templateBaseId ? 'pointer' : 'not-allowed', flexShrink: 0, whiteSpace: 'nowrap' }}
                >
                  {carregandoBase ? 'Carregando...' : 'Carregar'}
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* Dados básicos */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {isProtocolos ? 'Informações do Protocolo' : 'Informações do Treino'}
          </p>
          {isProtocolos && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 6, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.2)', fontSize: 10, fontWeight: 800, color: '#CC1A1A', letterSpacing: '0.06em' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC1A1A' }} />
              PROTOCOLO
            </span>
          )}
        </div>

        {isProtocolos && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(204,26,26,0.04)', border: '1px solid rgba(204,26,26,0.15)', fontSize: 12, color: '#8A7F76' }}>
            Protocolos são templates atribuídos automaticamente quando o aluno conclui o onboarding, com base no objetivo, nível, sexo e idade. Critérios em branco aceitam qualquer valor.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {!isProtocolos ? (
            <Campo label="Aluno">
              <select value={form.id_usuario} onChange={setF('id_usuario')} style={selectStyle}>
                <option value="">Selecione o aluno</option>
                {alunos.map(a => <option key={a.id_usuario} value={a.id_usuario}>{a.nome}</option>)}
              </select>
            </Campo>
          ) : (
            <Campo label="Critério — Objetivo">
              <select value={form.criterio_objetivo} onChange={setF('criterio_objetivo')} style={selectStyle}>
                <option value="">Qualquer objetivo</option>
                <option>Ganhar massa muscular</option>
                <option>Emagrecer</option>
                <option>Melhorar condicionamento</option>
                <option>Saúde e qualidade de vida</option>
              </select>
            </Campo>
          )}

          <Campo label="Nome">
            <input style={inputStyle} placeholder={isProtocolos ? 'Ex: Hipertrofia — Fase 1' : 'Ex: Treino do João — Cutting'} value={form.nome} onChange={setF('nome')} />
          </Campo>

          {isProtocolos && (
            <Campo label="Critério — Nível">
              <select value={form.criterio_nivel} onChange={setF('criterio_nivel')} style={selectStyle}>
                <option value="">Qualquer nível</option>
                <option>Iniciante — menos de 6 meses</option>
                <option>Intermediário — 6 meses a 2 anos</option>
                <option>Avançado — mais de 2 anos</option>
              </select>
            </Campo>
          )}

          {isProtocolos && (
            <Campo label="Critério — Sexo">
              <select value={form.criterio_sexo} onChange={setF('criterio_sexo')} style={selectStyle}>
                <option value="">Qualquer sexo</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </Campo>
          )}

          {isProtocolos && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Campo label="Critério — Idade mínima">
                <input style={inputStyle} type="number" min="0" max="120" placeholder="Ex: 18" value={form.criterio_idade_min} onChange={setF('criterio_idade_min')} />
              </Campo>
              <Campo label="Critério — Idade máxima">
                <input style={inputStyle} type="number" min="0" max="120" placeholder="Ex: 40" value={form.criterio_idade_max} onChange={setF('criterio_idade_max')} />
              </Campo>
            </div>
          )}

          <Campo label="Objetivo / Descrição">
            <input style={inputStyle} placeholder="Ex: Ganho de massa muscular" value={form.objetivo} onChange={setF('objetivo')} />
          </Campo>

          {!isProtocolos && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Campo label="Início">
                <input style={inputStyle} type="date" value={form.data_inicio} onChange={setF('data_inicio')} />
              </Campo>
              <Campo label="Fim">
                <input style={inputStyle} type="date" value={form.data_fim} onChange={setF('data_fim')} />
              </Campo>
            </div>
          )}
        </div>

        {isProtocolos && (
          <div style={{ marginTop: 8, paddingTop: 18, borderTop: '1px dashed #E0D6CA', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Sparkles size={15} color="#CC1A1A" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Gerar com IA</span>
            {personais.length > 0 && (
              <select
                value={idPersonalIA}
                onChange={e => setIdPersonalIA(e.target.value)}
                style={{ height: 36, padding: '0 10px', border: `1px solid ${!idPersonalIA ? '#FCA5A5' : '#E0D6CA'}`, borderRadius: 10, fontSize: 12, color: '#1A1A1A', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}
              >
                <option value="">Selecione o personal</option>
                {personais.map(p => <option key={p.id_usuario} value={p.id_usuario}>{p.nome}</option>)}
              </select>
            )}
            <select
              value={numDias}
              onChange={e => setNumDias(e.target.value)}
              style={{ height: 36, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 12, color: '#1A1A1A', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}
            >
              {[2,3,4,5,6].map(n => <option key={n} value={n}>{n} dias de treino/semana</option>)}
            </select>
            <button
              onClick={handleGerarIA}
              disabled={gerandoIA || !podeGerar}
              style={{ display: 'flex', alignItems: 'center', gap: 7, height: 36, paddingInline: 18, borderRadius: 10, border: 'none', background: (gerandoIA || !podeGerar) ? '#C4B9A8' : '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: (gerandoIA || !podeGerar) ? 'not-allowed' : 'pointer', flexShrink: 0 }}
            >
              {gerandoIA
                ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFF', animation: 'spin 0.7s linear infinite' }} /> Gerando...</>
                : <><Sparkles size={13} /> Gerar protocolo</>}
            </button>
            {!podeGerar && !gerandoIA && (
              <span style={{ fontSize: 11, color: '#CC1A1A' }}>
                {'obrigatório: ' + faltandoIA.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Dias da semana */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <div style={{ display: 'flex', borderBottom: '1px solid #E0D6CA', background: '#F7F3EE', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
          {DIAS.map(d => {
            const diaInfo = dias.find(x => x.dia_semana === d.num)
            const ativo = diaAtivo === d.num
            const temExs = !diaInfo?.descanso && diaInfo?.exercicios?.length > 0
            return (
              <button key={d.num} onClick={() => setDiaAtivo(d.num)} style={{ flex: 1, padding: '12px 4px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', background: ativo ? '#FFFFFF' : 'transparent', color: ativo ? '#CC1A1A' : '#8A7F76', borderBottom: ativo ? '2px solid #CC1A1A' : '2px solid transparent', position: 'relative' }}>
                {d.label}
                {temExs && <span style={{ position: 'absolute', top: 6, right: '50%', transform: 'translateX(8px)', width: 6, height: 6, borderRadius: '50%', background: '#CC1A1A' }} />}
                {diaInfo?.descanso && <span style={{ display: 'block', fontSize: 9, color: '#C4B9A8', marginTop: 2 }}>DSC</span>}
              </button>
            )
          })}
        </div>

        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <input
                value={diaCorrente?.nome || ''}
                onChange={e => setNomeDia(e.target.value)}
                placeholder={diaCorrente?.descanso ? 'Descanso' : 'Ex: Peito e Tríceps'}
                disabled={diaCorrente?.descanso}
                style={{ width: '100%', height: 38, padding: '0 14px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: diaCorrente?.descanso ? '#F7F3EE' : '#FFFFFF' }}
              />
            </div>
            <button
              onClick={toggleDescanso}
              style={{ height: 38, paddingInline: 16, borderRadius: 10, border: '1px solid', borderColor: diaCorrente?.descanso ? '#CC1A1A' : '#E0D6CA', background: diaCorrente?.descanso ? 'rgba(204,26,26,0.08)' : '#FFFFFF', color: diaCorrente?.descanso ? '#CC1A1A' : '#8A7F76', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
            >
              {diaCorrente?.descanso ? 'Descanso ✓' : 'Marcar descanso'}
            </button>
          </div>

          {!diaCorrente?.descanso && (
            <>
              {diaCorrente?.exercicios?.length > 0 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '20px 1fr 64px 80px 80px 80px 32px', gap: 8, padding: '0 0 8px', borderBottom: '1px solid #E0D6CA' }}>
                    {['', 'Exercício', 'Séries', 'Reps', 'Carga', 'Desc(s)', ''].map((h, i) => (
                      <p key={i} style={{ fontSize: 10, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</p>
                    ))}
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={diaCorrente.exercicios.map(e => e._uid)} strategy={verticalListSortingStrategy}>
                      {diaCorrente.exercicios.map((ex, i) => (
                        <ExercicioRow
                          key={ex._uid}
                          id={ex._uid}
                          ex={ex}
                          onChange={(key, val) => atualizarExercicio(i, key, val)}
                          onRemove={() => removerExercicio(i)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Adicionar exercício</p>
                <ExercicioSelector onAdd={adicionarExercicio} />
              </div>
            </>
          )}

          {diaCorrente?.descanso && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#C4B9A8' }}>
              <p style={{ fontSize: 14 }}>Dia de descanso — sem exercícios</p>
            </div>
          )}
        </div>
      </div>

      {erro && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
          {erro}
        </div>
      )}

      {showLeaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>Alterações não salvas</p>
            <p style={{ fontSize: 14, color: '#8A7F76', marginBottom: 28 }}>Você fez alterações que ainda não foram salvas. Deseja sair sem salvar?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{ flex: 1, height: 42, borderRadius: 12, border: '1px solid #E0D6CA', background: '#FFFFFF', fontSize: 13, fontWeight: 700, color: '#6B6560', cursor: 'pointer' }}
              >
                Continuar editando
              </button>
              <button
                onClick={() => navigate(base)}
                style={{ flex: 1, height: 42, borderRadius: 12, border: 'none', background: '#CC1A1A', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Sair sem salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
