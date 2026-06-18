import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mutate } from 'swr'
import { useAuthContext } from '../../context/AuthContext'
import { BtnSalvar, BtnCancelar, BtnExcluir } from '../../components/ui/Botoes'
import * as assinaturasService from '../../services/assinaturas'
import * as planosService from '../../services/planos'
import * as alunosService from '../../services/alunos'

const STATUS_OPCOES = [
  { value: 'ativa',     label: 'Ativa' },
  { value: 'suspensa',  label: 'Suspensa' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'expirada',  label: 'Expirada' },
]

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </label>
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

function addDias(dataStr, dias) {
  const d = new Date(dataStr + 'T00:00:00')
  d.setDate(d.getDate() + dias - 1)
  return d.toISOString().slice(0, 10)
}

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

function moeda(v) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AssinaturaForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()
  const { token } = useAuthContext()

  const [form, setForm] = useState({
    id_usuario: '', id_plano: '', data_inicio: hoje(), data_fim: '',
    status: 'ativa', valor_pago: '', observacao: '',
  })
  const [erro, setErro]           = useState(null)
  const [salvando, setSalvando]   = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [carregando, setCarregando] = useState(isEdicao)
  const [showModal, setShowModal] = useState(false)

  const [planos, setPlanos] = useState([])
  const [alunos, setAlunos] = useState([])

  useEffect(() => {
    if (!token) return
    planosService.listar().then(setPlanos)
    alunosService.listar().then(setAlunos)
  }, [token])

  useEffect(() => {
    if (!isEdicao) return
    assinaturasService.buscarPorId(id)
      .then(a => {
        setForm({
          id_usuario:  String(a.id_usuario),
          id_plano:    String(a.id_plano),
          data_inicio: a.data_inicio?.slice(0, 10) || '',
          data_fim:    a.data_fim?.slice(0, 10)    || '',
          status:      a.status,
          valor_pago:  a.valor_pago != null ? String(a.valor_pago) : '',
          observacao:  a.observacao || '',
        })
      })
      .finally(() => setCarregando(false))
  }, [id])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  function onPlanoChange(e) {
    const idPlano = e.target.value
    const plano   = planos.find(p => String(p.id_plano) === idPlano)
    setForm(f => ({
      ...f,
      id_plano:   idPlano,
      data_fim:   plano && f.data_inicio ? addDias(f.data_inicio, plano.duracao_dias) : f.data_fim,
      valor_pago: plano ? String(plano.preco) : f.valor_pago,
    }))
  }

  function onDataInicioChange(e) {
    const d     = e.target.value
    const plano = planos.find(p => String(p.id_plano) === form.id_plano)
    setForm(f => ({
      ...f,
      data_inicio: d,
      data_fim: plano && d ? addDias(d, plano.duracao_dias) : f.data_fim,
    }))
  }

  async function salvar() {
    if (!form.id_usuario)  { setErro('Selecione o aluno'); return }
    if (!form.id_plano)    { setErro('Selecione o plano'); return }
    if (!form.data_inicio) { setErro('Data de início é obrigatória'); return }
    if (!form.data_fim)    { setErro('Data de fim é obrigatória'); return }
    if (form.data_fim < form.data_inicio) { setErro('Data de fim deve ser posterior ao início'); return }
    setSalvando(true); setErro(null)
    try {
      const payload = {
        ...form,
        id_usuario: Number(form.id_usuario),
        id_plano:   Number(form.id_plano),
        valor_pago: form.valor_pago !== '' ? Number(form.valor_pago) : null,
      }
      if (isEdicao) { await assinaturasService.atualizar(id, payload) }
      else          { await assinaturasService.criar(payload) }
      mutate(k => Array.isArray(k) && k[0] === 'admin-assinaturas')
      navigate('/admin/assinaturas')
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarCancelamento() {
    setCancelando(true)
    try {
      await assinaturasService.cancelar(id)
      mutate(k => Array.isArray(k) && k[0] === 'admin-assinaturas')
      navigate('/admin/assinaturas')
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao cancelar')
      setCancelando(false)
      setShowModal(false)
    }
  }

  const planoSelecionado = planos.find(p => String(p.id_plano) === form.id_plano)

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
            {isEdicao ? 'Editar Assinatura' : 'Nova Assinatura'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {isEdicao ? 'Atualize os dados da assinatura.' : 'Vincule um aluno a um plano.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isEdicao && form.status !== 'cancelada' && (
            <BtnExcluir onClick={() => setShowModal(true)} loading={cancelando} label="Cancelar assinatura" />
          )}
          <BtnCancelar onClick={() => navigate('/admin/assinaturas')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Aluno">
            {isEdicao ? (
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F7F3EE', color: '#1A1A1A', cursor: 'not-allowed' }}>
                {alunos.find(a => String(a.id_usuario) === form.id_usuario)?.nome || '—'}
              </div>
            ) : (
              <select value={form.id_usuario} onChange={set('id_usuario')} style={selectStyle}>
                <option value="">Selecione o aluno</option>
                {alunos.map(a => <option key={a.id_usuario} value={a.id_usuario}>{a.nome}</option>)}
              </select>
            )}
          </Campo>

          <Campo label="Plano">
            {isEdicao ? (
              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', background: '#F7F3EE', color: '#1A1A1A', cursor: 'not-allowed' }}>
                {planoSelecionado?.nome || '—'}
              </div>
            ) : (
              <select value={form.id_plano} onChange={onPlanoChange} style={selectStyle}>
                <option value="">Selecione o plano</option>
                {planos.filter(p => p.ativo).map(p => (
                  <option key={p.id_plano} value={p.id_plano}>{p.nome} — {moeda(p.preco)}</option>
                ))}
              </select>
            )}
          </Campo>
        </div>

        {planoSelecionado && !isEdicao && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(204,26,26,0.04)', border: '1px solid rgba(204,26,26,0.15)', fontSize: 12, color: '#8A7F76', display: 'flex', gap: 16 }}>
            <span style={{ fontWeight: 700, color: '#CC1A1A' }}>{planoSelecionado.nome}</span>
            <span>{moeda(planoSelecionado.preco)}</span>
            <span>{planoSelecionado.duracao_dias} dias</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Data de início">
            <input
              type="date"
              style={inputStyle}
              value={form.data_inicio}
              onChange={isEdicao ? set('data_inicio') : onDataInicioChange}
            />
          </Campo>

          <Campo label="Data de fim">
            <input type="date" style={inputStyle} value={form.data_fim} onChange={set('data_fim')} />
          </Campo>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Status">
            <select value={form.status} onChange={set('status')} style={selectStyle}>
              {STATUS_OPCOES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Campo>

          <Campo label="Valor pago">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#8A7F76', fontWeight: 700, pointerEvents: 'none' }}>R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                style={{ ...inputStyle, paddingLeft: 40 }}
                placeholder="0,00"
                value={form.valor_pago}
                onChange={set('valor_pago')}
              />
            </div>
          </Campo>
        </div>

        <Campo label="Observação">
          <textarea
            style={{ ...inputStyle, height: 72, padding: '10px 14px', resize: 'vertical' }}
            placeholder="Desconto aplicado, forma de pagamento, etc..."
            value={form.observacao}
            onChange={set('observacao')}
          />
        </Campo>

        {erro && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
            {erro}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>Cancelar assinatura?</p>
            <p style={{ fontSize: 14, color: '#8A7F76', marginBottom: 28 }}>
              A assinatura será marcada como <strong>cancelada</strong>. O status pode ser revertido editando a assinatura.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, height: 42, borderRadius: 12, border: '1px solid #E0D6CA', background: '#FFFFFF', fontSize: 13, fontWeight: 700, color: '#6B6560', cursor: 'pointer' }}
              >
                Voltar
              </button>
              <button
                onClick={confirmarCancelamento}
                disabled={cancelando}
                style={{ flex: 1, height: 42, borderRadius: 12, border: 'none', background: '#CC1A1A', fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', opacity: cancelando ? 0.7 : 1 }}
              >
                {cancelando ? 'Cancelando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
