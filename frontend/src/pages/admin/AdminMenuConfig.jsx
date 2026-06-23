import { useState, useCallback } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  arrayMove, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, Loader2, Plus, Trash2, X, Pencil, GripVertical, Home, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { listar, atualizarPerfis, criar, editar, deletar, reordenar } from '../../services/menuAdmin'
import { getIcon } from '../../utils/menuIcons'

const ICONES_DISPONIVEIS = [
  'Home','Road','Flame','Sparkles','Bot','Dumbbell','Salad','TrendingUp',
  'LayoutDashboard','Users','Calendar','UserCheck','MoreHorizontal',
  'Activity','ClipboardList','FileQuestion','Settings','Settings2',
  'BookOpen','MessagesSquare','Trophy','Target','Medal',
  'CreditCard','Receipt','Plug','FileText','DollarSign',
]

const COR_PERFIL = {
  admin:         { bg: 'rgba(204,26,26,0.08)',  border: 'rgba(204,26,26,0.25)',  text: '#CC1A1A'  },
  aluno:         { bg: 'rgba(37,99,235,0.08)',  border: 'rgba(37,99,235,0.25)',  text: '#2563EB'  },
  personal:      { bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.25)',  text: '#16A34A'  },
  nutricionista: { bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', text: '#7C3AED'  },
}

const inputStyle = {
  height: 40, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10,
  fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', width: '100%', boxSizing: 'border-box',
}

const COL_PERFIL_W = 48
const COL_ACOES_W  = 70

function Checkbox({ checked, onChange, perfilNome }) {
  const c = COR_PERFIL[perfilNome] || { bg: '#F0EBE4', border: '#E0D6CA', text: '#6B6560' }
  return (
    <button onClick={onChange} style={{
      width: 28, height: 28, borderRadius: 8,
      border: `2px solid ${checked ? c.text : '#E0D6CA'}`,
      background: checked ? c.bg : '#FFFFFF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
    }}>
      {checked && <Check size={14} strokeWidth={2.5} color={c.text} />}
    </button>
  )
}

function ModalItem({ item, grupos, perfis, onClose, onSalvo }) {
  const editando = !!item
  const [form, setForm] = useState(item
    ? { id_menu: item.id_menu, nome: item.nome, caminho: item.caminho, icone: item.icone || 'Home' }
    : { id_menu: grupos[0]?.id_menu || '', nome: '', caminho: '', icone: 'Home' }
  )
  const [perfisSelec, setPerfisSelec] = useState(item?.perfis_vinculados || [])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }
  function togglePerfil(nome) { setPerfisSelec(p => p.includes(nome) ? p.filter(x => x !== nome) : [...p, nome]) }

  async function salvar() {
    if (!form.nome.trim()) return setErro('Informe o nome')
    if (!form.caminho.trim()) return setErro('Informe o caminho')
    if (!form.caminho.startsWith('/')) return setErro('O caminho deve começar com /')
    setErro(null); setSalvando(true)
    try {
      if (editando) await editar(item.id_menu_item, { ...form, id_menu: Number(form.id_menu), perfis: perfisSelec })
      else await criar({ ...form, id_menu: Number(form.id_menu), perfis: perfisSelec })
      onSalvo()
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao salvar')
    } finally { setSalvando(false) }
  }

  const IconSelecionada = getIcon(form.icone)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A' }}>{editando ? 'Editar item de menu' : 'Novo item de menu'}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}><X size={18} color="#8A7F76" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Grupo</label>
            <select value={form.id_menu} onChange={e => set('id_menu', e.target.value)} style={inputStyle}>
              {grupos.map(g => <option key={g.id_menu} value={g.id_menu}>{g.nome}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Nome</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Relatórios" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Caminho (URL)</label>
            <input value={form.caminho} onChange={e => set('caminho', e.target.value)} placeholder="Ex: /admin/relatorios" style={{ ...inputStyle, fontFamily: 'monospace' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ícone</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconSelecionada size={18} color="#8A7F76" />
              </div>
              <select value={form.icone} onChange={e => set('icone', e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                {ICONES_DISPONIVEIS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Visível para</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {perfis.map(p => {
                const c = COR_PERFIL[p.nome] || { bg: '#F0EBE4', border: '#E0D6CA', text: '#6B6560' }
                const sel = perfisSelec.includes(p.nome)
                return (
                  <button key={p.id_perfil} onClick={() => togglePerfil(p.nome)} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer',
                    background: sel ? c.bg : '#F7F3EE', border: `1px solid ${sel ? c.text : '#E0D6CA'}`,
                    color: sel ? c.text : '#8A7F76', transition: 'all 0.15s',
                  }}>
                    {p.nome}
                  </button>
                )
              })}
            </div>
          </div>

          {erro && <p style={{ fontSize: 13, color: '#CC1A1A', background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '8px 12px', borderRadius: 8 }}>{erro}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, height: 42, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B6560' }}>Cancelar</button>
            <button onClick={salvar} disabled={salvando} style={{ flex: 2, height: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #A81515, #CC1A1A)', color: '#FFFFFF', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: salvando ? 0.6 : 1 }}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortableItemRow({ item, perfis, grupos, onToggle, onDeletar, onEditar, salvandoSet }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id_menu_item })
  const Icon = getIcon(item.icone)
  const [confirmando, setConfirmando] = useState(false)
  const [editando, setEditando]       = useState(false)

  return (
    <>
      {editando && (
        <ModalItem
          item={item} grupos={grupos} perfis={perfis}
          onClose={() => setEditando(false)}
          onSalvo={() => { setEditando(false); onEditar() }}
        />
      )}
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          borderTop: '1px solid #F0EBE4',
          background: isDragging ? '#F7F3EE' : undefined,
          userSelect: 'none',
          position: 'relative',
          zIndex: isDragging ? 1 : undefined,
        }}
        onMouseEnter={e => { if (!isDragging) e.currentTarget.style.background = '#FAFAF9' }}
        onMouseLeave={e => { if (!isDragging) e.currentTarget.style.background = '' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 10 }}>
          {/* Drag handle */}
          <button
            {...attributes} {...listeners}
            style={{ background: 'none', border: 'none', cursor: 'grab', padding: '2px 0', color: '#C8BFB6', display: 'flex', alignItems: 'center', flexShrink: 0, touchAction: 'none' }}
          >
            <GripVertical size={16} strokeWidth={1.8} />
          </button>

          {/* Ícone */}
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={15} strokeWidth={1.8} color="#8A7F76" />
          </div>

          {/* Nome + caminho */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>{item.nome}</p>
            <p style={{ fontSize: 11, color: '#B0A89E', fontFamily: 'monospace' }}>{item.caminho}</p>
          </div>

          {/* Checkboxes de perfil + ações */}
          <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            {perfis.map(p => (
              <div key={p.id_perfil} style={{ width: COL_PERFIL_W, display: 'flex', justifyContent: 'center' }}>
                <Checkbox
                  perfilNome={p.nome}
                  checked={item.perfis_vinculados.includes(p.nome)}
                  onChange={() => onToggle(item.id_menu_item, p.nome, item.perfis_vinculados)}
                />
              </div>
            ))}

            <div style={{ width: COL_ACOES_W, display: 'flex', justifyContent: 'flex-end' }}>
              {salvandoSet.has(item.id_menu_item)
                ? <Loader2 size={14} color="#B0A89E" style={{ animation: 'spin 0.8s linear infinite' }} />
                : confirmando
                  ? (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => onDeletar(item.id_menu_item)} style={{ height: 28, paddingInline: 10, borderRadius: 6, border: 'none', background: '#CC1A1A', color: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Sim</button>
                      <button onClick={() => setConfirmando(false)} style={{ height: 28, paddingInline: 10, borderRadius: 6, border: '1px solid #E0D6CA', background: '#FFF', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#6B6560' }}>Não</button>
                    </div>
                  )
                  : (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setEditando(true)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E0D6CA', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(204,26,26,0.3)'; e.currentTarget.style.background = 'rgba(204,26,26,0.06)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFF' }}>
                        <Pencil size={13} color="#CC1A1A" />
                      </button>
                      <button onClick={() => setConfirmando(true)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E0D6CA', background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#FCA5A5'; e.currentTarget.style.background = '#FEF2F2' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.background = '#FFF' }}>
                        <Trash2 size={13} color="#CC1A1A" />
                      </button>
                    </div>
                  )
              }
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AdminMenuConfig() {
  const navigate = useNavigate()
  const { token } = useAuthContext()
  const [salvando, setSalvando] = useState(new Set())
  const [modalAberto, setModalAberto] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { data, isLoading, mutate } = useSWR(
    token ? 'menu-admin' : null,
    listar,
    { revalidateOnFocus: false }
  )

  const itens  = data?.itens  || []
  const perfis = data?.perfis || []
  const grupos = data?.grupos || []

  const grupos_itens = []
  itens.forEach(item => {
    const g = grupos_itens.find(g => g.id_menu === item.id_menu)
    if (g) g.itens.push(item)
    else grupos_itens.push({ id_menu: item.id_menu, grupo: item.grupo, itens: [item] })
  })

  const handleToggle = useCallback(async (id_menu_item, perfilNome, atual) => {
    const novos = atual.includes(perfilNome)
      ? atual.filter(p => p !== perfilNome)
      : [...atual, perfilNome]

    mutate(d => ({
      ...d,
      itens: d.itens.map(i => i.id_menu_item === id_menu_item ? { ...i, perfis_vinculados: novos } : i),
    }), false)

    setSalvando(s => new Set([...s, id_menu_item]))
    try {
      await atualizarPerfis(id_menu_item, novos)
      globalMutate('menu')
    } catch {
      mutate()
    } finally {
      setSalvando(s => { const n = new Set(s); n.delete(id_menu_item); return n })
    }
  }, [mutate])

  const handleDeletar = useCallback(async (id_menu_item) => {
    try { await deletar(id_menu_item); mutate(); globalMutate('menu') }
    catch { mutate() }
  }, [mutate])

  function handleDragEnd(event, grupoItens) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = grupoItens.findIndex(i => i.id_menu_item === active.id)
    const newIndex = grupoItens.findIndex(i => i.id_menu_item === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const idMenu = grupoItens[0].id_menu
    const reordenados = arrayMove(grupoItens, oldIndex, newIndex).map((item, idx) => ({ ...item, ordem: idx + 1 }))

    // Substitui os itens deste grupo na ordem nova, mantém os outros grupos
    mutate(d => {
      const outros = d.itens.filter(i => i.id_menu !== idMenu)
      return {
        ...d,
        itens: [...outros, ...reordenados].sort((a, b) =>
          a.grupo_ordem !== b.grupo_ordem ? a.grupo_ordem - b.grupo_ordem : a.ordem - b.ordem
        ),
      }
    }, false)

    reordenar(reordenados.map(item => ({ id_menu_item: item.id_menu_item, ordem: item.ordem })))
      .then(() => globalMutate('menu'))
      .catch(() => mutate())
  }

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {modalAberto && (
        <ModalItem
          item={null} grupos={grupos} perfis={perfis}
          onClose={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); mutate(); globalMutate('menu') }}
        />
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', marginBottom: 4 }}>Configuração de Menu</h1>
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Arraste para reordenar · Marque quais perfis têm acesso.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C4B9A8'; e.currentTarget.style.color = '#1A1A1A' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#6B6560' }}
          >
            <Home size={14} color="currentColor" />
            Home
          </button>
          <button
            onClick={() => setModalAberto(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 8, border: 'none', background: '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={14} /> Novo item
          </button>
        </div>
      </div>

      {/* Legenda perfis */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {perfis.map(p => {
          const c = COR_PERFIL[p.nome] || { bg: '#F0EBE4', border: '#E0D6CA', text: '#6B6560' }
          return (
            <span key={p.id_perfil} style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
              {p.nome}
            </span>
          )
        })}
      </div>

      {/* Grupos com drag-and-drop por grupo */}
      {grupos_itens.map(grupo => (
        <div key={grupo.id_menu} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: 480 }}>

            {/* Header do grupo */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 20px', background: '#F7F3EE', borderBottom: '1px solid #E0D6CA', gap: 10, borderRadius: '16px 16px 0 0' }}>
              <div style={{ width: 16, flexShrink: 0 }} />
              <div style={{ width: 32, flexShrink: 0 }} />
              <p style={{ flex: 1, fontSize: 11, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {grupo.grupo}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                {perfis.map(p => (
                  <div key={p.id_perfil} style={{ width: COL_PERFIL_W, textAlign: 'center' }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: COR_PERFIL[p.nome]?.text || '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {p.nome.slice(0, 5)}
                    </span>
                  </div>
                ))}
                <div style={{ width: COL_ACOES_W }} />
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={e => handleDragEnd(e, grupo.itens)}
            >
              <SortableContext items={grupo.itens.map(i => i.id_menu_item)} strategy={verticalListSortingStrategy}>
                {grupo.itens.map(item => (
                  <SortableItemRow
                    key={item.id_menu_item}
                    item={item}
                    perfis={perfis}
                    grupos={grupos}
                    onToggle={handleToggle}
                    onDeletar={handleDeletar}
                    onEditar={() => { mutate(); globalMutate(['menu', undefined]) }}
                    salvandoSet={salvando}
                  />
                ))}
              </SortableContext>
            </DndContext>

          </div>
        </div>
      ))}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
