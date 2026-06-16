import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { BtnSalvar, BtnCancelar } from '../../components/ui/Botoes'
import * as svc from '../../services/questionario'

const inputStyle = {
  height: 42, padding: '0 14px', border: '1px solid #E0D6CA', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF',
  width: '100%', boxSizing: 'border-box',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  )
}

export default function QuestionarioForm() {
  const { id }    = useParams()
  const isEdicao  = !!id && id !== 'novo'
  const navigate  = useNavigate()

  const [form, setForm] = useState({
    codigo: '', pergunta: '', tipo: 'opcao', obrigatorio: true,
    exibir_detalhe_sim: false, descricao_detalhe_sim: '', ordem: 0, ativo: true,
  })
  const [opcoes, setOpcoes] = useState([{ valor: '' }])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState(null)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    if (!isEdicao) return
    svc.buscar(id).then(p => {
      if (!p) return
      setForm({
        codigo: p.codigo, pergunta: p.pergunta, tipo: p.tipo,
        obrigatorio: !!p.obrigatorio, exibir_detalhe_sim: !!p.exibir_detalhe_sim,
        descricao_detalhe_sim: p.descricao_detalhe_sim || '', ordem: p.ordem, ativo: !!p.ativo,
      })
      setOpcoes(p.opcoes?.length ? p.opcoes.map(o => ({ valor: o.valor })) : [{ valor: '' }])
    }).finally(() => setCarregando(false))
  }, [id])

  function setF(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }
  function setFBool(k) { return e => setForm(f => ({ ...f, [k]: e.target.checked })) }

  function addOpcao() { setOpcoes(p => [...p, { valor: '' }]) }
  function removeOpcao(i) { setOpcoes(p => p.filter((_, idx) => idx !== i)) }
  function setOpcaoValor(i, val) { setOpcoes(p => p.map((o, idx) => idx === i ? { ...o, valor: val } : o)) }
  function moverOpcao(i, dir) {
    setOpcoes(p => {
      const arr = [...p]
      const j = i + dir
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]]
      return arr
    })
  }

  async function salvar() {
    if (!form.pergunta.trim()) { setErro('Pergunta é obrigatória'); return }
    if (!isEdicao && !form.codigo.trim()) { setErro('Código é obrigatório'); return }
    const opcoesValidas = opcoes.filter(o => o.valor.trim())
    if (form.tipo === 'opcao' && opcoesValidas.length < 2) { setErro('Tipo "Opção" requer ao menos 2 opções'); return }
    setSalvando(true); setErro(null)
    try {
      const payload = { ...form, opcoes: opcoesValidas }
      if (isEdicao) await svc.atualizar(id, payload)
      else          await svc.criar(payload)
      navigate('/admin/questionario')
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            {isEdicao ? 'Editar Pergunta' : 'Nova Pergunta'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Configure o texto, tipo e opções de resposta.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <BtnCancelar onClick={() => navigate('/admin/questionario')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dados da Pergunta</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Código (identificador único)">
            <input
              style={{ ...inputStyle, background: isEdicao ? '#F7F3EE' : '#FFFFFF', color: isEdicao ? '#8A7F76' : '#1A1A1A' }}
              value={form.codigo}
              onChange={setF('codigo')}
              placeholder="Ex: objetivo"
              readOnly={isEdicao}
            />
          </Campo>

          <Campo label="Ordem de exibição">
            <input style={inputStyle} type="number" min="0" value={form.ordem} onChange={setF('ordem')} placeholder="0" />
          </Campo>

          <Campo label="Tipo de resposta">
            <select style={selectStyle} value={form.tipo} onChange={setF('tipo')}>
              <option value="opcao">Opção (múltipla escolha)</option>
              <option value="bool">Sim / Não</option>
              <option value="numero">Número</option>
              <option value="texto">Texto livre</option>
            </select>
          </Campo>

          <Campo label="Status">
            <select style={selectStyle} value={form.ativo ? '1' : '0'} onChange={e => setForm(f => ({ ...f, ativo: e.target.value === '1' }))}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </Campo>
        </div>

        <Campo label="Texto da pergunta">
          <input style={inputStyle} value={form.pergunta} onChange={setF('pergunta')} placeholder="Ex: Qual é seu principal objetivo?" />
        </Campo>

        <div style={{ display: 'flex', gap: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#6B6560' }}>
            <input type="checkbox" checked={form.obrigatorio} onChange={setFBool('obrigatorio')} style={{ width: 16, height: 16, accentColor: '#CC1A1A', cursor: 'pointer' }} />
            Resposta obrigatória
          </label>
          {form.tipo === 'bool' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#6B6560' }}>
              <input type="checkbox" checked={form.exibir_detalhe_sim} onChange={setFBool('exibir_detalhe_sim')} style={{ width: 16, height: 16, accentColor: '#CC1A1A', cursor: 'pointer' }} />
              Pedir detalhes ao responder "Sim"
            </label>
          )}
        </div>

        {form.tipo === 'bool' && form.exibir_detalhe_sim && (
          <Campo label="Texto do campo de detalhe">
            <input style={inputStyle} value={form.descricao_detalhe_sim} onChange={setF('descricao_detalhe_sim')} placeholder="Ex: Descreva sua lesão." />
          </Campo>
        )}
      </div>

      {form.tipo === 'opcao' && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Opções de Resposta</p>
            <button
              onClick={addOpcao}
              style={{ height: 32, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #CC1A1A', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(204,26,26,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
            >
              <Plus size={13} /> Adicionar opção
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opcoes.map((op, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button
                    onClick={() => moverOpcao(i, -1)}
                    disabled={i === 0}
                    style={{ width: 20, height: 18, border: '1px solid #E0D6CA', borderRadius: 4, background: '#FFF', cursor: i === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: i === 0 ? 0.3 : 1, padding: 0 }}
                  >
                    <span style={{ fontSize: 9, color: '#8A7F76' }}>▲</span>
                  </button>
                  <button
                    onClick={() => moverOpcao(i, 1)}
                    disabled={i === opcoes.length - 1}
                    style={{ width: 20, height: 18, border: '1px solid #E0D6CA', borderRadius: 4, background: '#FFF', cursor: i === opcoes.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: i === opcoes.length - 1 ? 0.3 : 1, padding: 0 }}
                  >
                    <span style={{ fontSize: 9, color: '#8A7F76' }}>▼</span>
                  </button>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#C4B9A8', minWidth: 20, textAlign: 'center' }}>{i + 1}</span>
                <input
                  value={op.valor}
                  onChange={e => setOpcaoValor(i, e.target.value)}
                  placeholder={`Opção ${i + 1}`}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => e.target.style.borderColor = '#CC1A1A'}
                  onBlur={e => e.target.style.borderColor = '#E0D6CA'}
                />
                <button
                  onClick={() => removeOpcao(i)}
                  disabled={opcoes.length <= 1}
                  style={{ width: 36, height: 42, border: '1px solid #F0EBE4', borderRadius: 10, background: '#FFF', cursor: opcoes.length <= 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: opcoes.length <= 1 ? 0.3 : 1, flexShrink: 0 }}
                  onMouseEnter={e => { if (opcoes.length > 1) e.currentTarget.style.borderColor = '#CC1A1A' }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#F0EBE4'}
                >
                  <Trash2 size={13} color="#CC1A1A" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {erro && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
          {erro}
        </div>
      )}
    </div>
  )
}
