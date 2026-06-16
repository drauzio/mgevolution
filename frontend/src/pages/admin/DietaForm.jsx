import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useSWR from 'swr'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { BtnSalvar, BtnCancelar } from '../../components/ui/Botoes'
import * as alunosService from '../../services/alunos'
import * as dietaService from '../../services/dieta'

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

const UNIDADES = ['g', 'ml', 'unid', 'colher', 'xícara', 'fatia', 'porção']

function ItemRow({ item, onChange, onRemove }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 70px 70px 32px', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F7F3EE' }}>
      <input
        value={item.descricao}
        onChange={e => onChange('descricao', e.target.value)}
        placeholder="Alimento / descrição"
        style={{ height: 34, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 13, color: '#1A1A1A', outline: 'none', background: '#FFFFFF' }}
      />
      <input
        value={item.quantidade}
        onChange={e => onChange('quantidade', e.target.value)}
        placeholder="Qtd"
        type="number"
        style={{ height: 34, padding: '0 8px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <select
        value={item.unidade}
        onChange={e => onChange('unidade', e.target.value)}
        style={{ height: 34, padding: '0 6px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', cursor: 'pointer' }}
      >
        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <input
        value={item.calorias}
        onChange={e => onChange('calorias', e.target.value)}
        placeholder="kcal"
        type="number"
        style={{ height: 34, padding: '0 8px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <input
        value={item.proteina}
        onChange={e => onChange('proteina', e.target.value)}
        placeholder="prot g"
        type="number"
        style={{ height: 34, padding: '0 8px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#1A1A1A', outline: 'none', textAlign: 'center', background: '#FFFFFF' }}
      />
      <button
        onClick={onRemove}
        style={{ width: 32, height: 32, border: '1px solid #F0EBE4', borderRadius: 8, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
      >
        <Trash2 size={13} color="#CC1A1A" />
      </button>
    </div>
  )
}

function novaRefeicao(ordem) {
  return { _uid: Date.now() + Math.random(), nome: '', horario: '', ordem, itens: [] }
}

function novoItem() {
  return { _uid: Date.now() + Math.random(), descricao: '', quantidade: '', unidade: 'g', calorias: '', proteina: '' }
}

export default function DietaForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()
  const { token } = useAuthContext()

  const { data: alunos = [] } = useSWR(token ? 'alunos-lista' : null, () => alunosService.listar())

  const [form, setForm] = useState({ id_usuario: '', nome: '', objetivo: '', calorias_meta: '', proteina_meta: '', data_inicio: '', data_fim: '', observacoes: '' })
  const [refeicoes, setRefeicoes] = useState([novaRefeicao(1)])
  const [abertas, setAbertas] = useState({ 0: true })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    if (!isEdicao) return
    dietaService.buscarPorId(id)
      .then(data => {
        setForm({
          id_usuario: data.id_usuario || '',
          nome: data.nome || '',
          objetivo: data.objetivo || '',
          calorias_meta: data.calorias_meta ?? '',
          proteina_meta: data.proteina_meta ?? '',
          data_inicio: data.data_inicio?.slice(0, 10) || '',
          data_fim: data.data_fim?.slice(0, 10) || '',
          observacoes: data.observacoes || '',
        })
        setRefeicoes((data.refeicoes || []).map((r, i) => ({
          _uid: r.id_refeicao,
          nome: r.nome,
          horario: r.horario || '',
          ordem: r.ordem,
          itens: (r.itens || []).map(it => ({
            _uid: it.id_item,
            descricao: it.descricao,
            quantidade: it.quantidade ?? '',
            unidade: it.unidade || 'g',
            calorias: it.calorias ?? '',
            proteina: it.proteina ?? '',
          })),
        })))
        setAbertas({ 0: true })
      })
      .finally(() => setCarregando(false))
  }, [id])

  function setF(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  function toggleRefeicao(i) { setAbertas(a => ({ ...a, [i]: !a[i] })) }

  function adicionarRefeicao() {
    const nova = novaRefeicao(refeicoes.length + 1)
    setRefeicoes(r => [...r, nova])
    setAbertas(a => ({ ...a, [refeicoes.length]: true }))
  }

  function removerRefeicao(i) {
    setRefeicoes(r => r.filter((_, idx) => idx !== i))
    setAbertas(a => { const n = { ...a }; delete n[i]; return n })
  }

  function setRefeicaoField(i, key, val) {
    setRefeicoes(r => r.map((ref, idx) => idx === i ? { ...ref, [key]: val } : ref))
  }

  function adicionarItem(i) {
    setRefeicoes(r => r.map((ref, idx) => idx === i ? { ...ref, itens: [...ref.itens, novoItem()] } : ref))
  }

  function atualizarItem(refIdx, itemIdx, key, val) {
    setRefeicoes(r => r.map((ref, i) => {
      if (i !== refIdx) return ref
      const itens = [...ref.itens]
      itens[itemIdx] = { ...itens[itemIdx], [key]: val }
      return { ...ref, itens }
    }))
  }

  function removerItem(refIdx, itemIdx) {
    setRefeicoes(r => r.map((ref, i) => i !== refIdx ? ref : { ...ref, itens: ref.itens.filter((_, j) => j !== itemIdx) }))
  }

  async function salvar() {
    if (!form.nome)       { setErro('Nome do plano é obrigatório'); return }
    if (!form.id_usuario) { setErro('Selecione o aluno'); return }
    setSalvando(true); setErro(null)
    try {
      const payload = { ...form, refeicoes }
      if (isEdicao) {
        await dietaService.atualizar(id, payload)
      } else {
        await dietaService.criar(payload)
      }
      navigate('/admin/dieta')
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

  const totalCal  = refeicoes.flatMap(r => r.itens).reduce((a, it) => a + (Number(it.calorias) || 0), 0)
  const totalProt = refeicoes.flatMap(r => r.itens).reduce((a, it) => a + (Number(it.proteina) || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isEdicao ? 'Editar Plano de Dieta' : 'Novo Plano de Dieta'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Monte as refeições e macros do aluno.</p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <BtnCancelar onClick={() => navigate('/admin/dieta')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      {/* Dados básicos */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Informações do Plano</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Aluno">
            <select value={form.id_usuario} onChange={setF('id_usuario')} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Selecione o aluno</option>
              {alunos.map(a => <option key={a.id_usuario} value={a.id_usuario}>{a.nome}</option>)}
            </select>
          </Campo>

          <Campo label="Nome do plano">
            <input style={inputStyle} placeholder="Ex: Dieta de Cutting" value={form.nome} onChange={setF('nome')} />
          </Campo>

          <Campo label="Objetivo">
            <input style={inputStyle} placeholder="Ex: Perda de gordura" value={form.objetivo} onChange={setF('objetivo')} />
          </Campo>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Campo label="Meta kcal/dia">
              <input style={inputStyle} type="number" placeholder="Ex: 2000" value={form.calorias_meta} onChange={setF('calorias_meta')} />
            </Campo>
            <Campo label="Meta proteína (g)">
              <input style={inputStyle} type="number" placeholder="Ex: 150" value={form.proteina_meta} onChange={setF('proteina_meta')} />
            </Campo>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Campo label="Início">
              <input style={inputStyle} type="date" value={form.data_inicio} onChange={setF('data_inicio')} />
            </Campo>
            <Campo label="Fim">
              <input style={inputStyle} type="date" value={form.data_fim} onChange={setF('data_fim')} />
            </Campo>
          </div>

          <Campo label="Observações">
            <input style={inputStyle} placeholder="Orientações gerais..." value={form.observacoes} onChange={setF('observacoes')} />
          </Campo>
        </div>

        {/* Totais calculados */}
        {(totalCal > 0 || totalProt > 0) && (
          <div style={{ display: 'flex', gap: 16, paddingTop: 4 }}>
            <div style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(204,26,26,0.06)', border: '1px solid rgba(204,26,26,0.15)' }}>
              <p style={{ fontSize: 11, color: '#CC1A1A', fontWeight: 700 }}>TOTAL CALCULADO</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', marginTop: 2 }}>{totalCal} kcal · {totalProt}g prot</p>
            </div>
            {form.calorias_meta && (
              <div style={{ padding: '8px 16px', borderRadius: 10, background: '#F7F3EE', border: '1px solid #E0D6CA' }}>
                <p style={{ fontSize: 11, color: '#8A7F76', fontWeight: 700 }}>DIFERENÇA DA META</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: totalCal > Number(form.calorias_meta) ? '#CC1A1A' : '#15803D', marginTop: 2 }}>
                  {totalCal > Number(form.calorias_meta) ? '+' : ''}{totalCal - Number(form.calorias_meta)} kcal
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Refeições */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Refeições ({refeicoes.length})
          </p>
          <button
            onClick={adicionarRefeicao}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, paddingInline: 14, borderRadius: 8, border: '1px dashed #CC1A1A', background: 'rgba(204,26,26,0.04)', color: '#CC1A1A', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={13} /> Adicionar refeição
          </button>
        </div>

        {refeicoes.map((ref, i) => {
          const aberta = !!abertas[i]
          const calRef = ref.itens.reduce((a, it) => a + (Number(it.calorias) || 0), 0)
          const protRef = ref.itens.reduce((a, it) => a + (Number(it.proteina) || 0), 0)

          return (
            <div key={ref._uid} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              {/* Header da refeição */}
              <div
                onClick={() => toggleRefeicao(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', background: aberta ? '#FDFAF7' : '#FFFFFF' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: 8, background: '#CC1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 900, color: '#FFFFFF' }}>{i + 1}</p>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{ref.nome || `Refeição ${i + 1}`}</p>
                  {ref.horario && <p style={{ fontSize: 11, color: '#8A7F76' }}>{ref.horario}</p>}
                </div>
                {calRef > 0 && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#CC1A1A', flexShrink: 0 }}>{calRef} kcal</p>
                )}
                {protRef > 0 && (
                  <p style={{ fontSize: 12, color: '#8A7F76', flexShrink: 0 }}>{protRef}g prot</p>
                )}
                <button
                  onClick={e => { e.stopPropagation(); removerRefeicao(i) }}
                  style={{ width: 28, height: 28, border: '1px solid #F0EBE4', borderRadius: 6, background: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
                >
                  <Trash2 size={12} color="#CC1A1A" />
                </button>
                {aberta ? <ChevronUp size={16} color="#8A7F76" /> : <ChevronDown size={16} color="#8A7F76" />}
              </div>

              {aberta && (
                <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Nome e horário */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, paddingTop: 4 }}>
                    <input
                      value={ref.nome}
                      onChange={e => setRefeicaoField(i, 'nome', e.target.value)}
                      placeholder="Nome da refeição (ex: Café da manhã)"
                      style={{ height: 38, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF' }}
                    />
                    <input
                      value={ref.horario}
                      onChange={e => setRefeicaoField(i, 'horario', e.target.value)}
                      placeholder="Horário (07:00)"
                      style={{ height: 38, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', textAlign: 'center' }}
                    />
                  </div>

                  {/* Cabeçalho itens */}
                  {ref.itens.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 70px 70px 32px', gap: 8 }}>
                      {['Alimento', 'Qtd', 'Unid', 'kcal', 'Prot g', ''].map((h, j) => (
                        <p key={j} style={{ fontSize: 10, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</p>
                      ))}
                    </div>
                  )}

                  {/* Itens */}
                  {ref.itens.map((it, j) => (
                    <ItemRow
                      key={it._uid}
                      item={it}
                      onChange={(key, val) => atualizarItem(i, j, key, val)}
                      onRemove={() => removerItem(i, j)}
                    />
                  ))}

                  <button
                    onClick={() => adicionarItem(i)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, height: 32, paddingInline: 12, borderRadius: 8, border: '1px dashed #E0D6CA', background: 'transparent', color: '#8A7F76', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: 'fit-content' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#CC1A1A'; e.currentTarget.style.color = '#CC1A1A' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D6CA'; e.currentTarget.style.color = '#8A7F76' }}
                  >
                    <Plus size={12} /> Adicionar alimento
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {erro && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
          {erro}
        </div>
      )}
    </div>
  )
}
