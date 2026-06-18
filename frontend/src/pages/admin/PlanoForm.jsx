import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mutate } from 'swr'
import { BtnSalvar, BtnCancelar, BtnExcluir } from '../../components/ui/Botoes'
import * as planosService from '../../services/planos'

const DURACOES = [
  { dias: 30,  label: 'Mensal — 30 dias' },
  { dias: 60,  label: 'Bimestral — 60 dias' },
  { dias: 90,  label: 'Trimestral — 90 dias' },
  { dias: 180, label: 'Semestral — 180 dias' },
  { dias: 365, label: 'Anual — 365 dias' },
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

export default function PlanoForm() {
  const { id } = useParams()
  const isEdicao = !!id
  const navigate = useNavigate()

  const [form, setForm]         = useState({ nome: '', descricao: '', preco: '', duracao_dias: 30 })
  const [erro, setErro]         = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [toggleando, setToggleando] = useState(false)
  const [ativo, setAtivo]       = useState(true)
  const [carregando, setCarregando] = useState(isEdicao)

  useEffect(() => {
    if (!isEdicao) return
    planosService.buscarPorId(id)
      .then(p => {
        setForm({ nome: p.nome, descricao: p.descricao || '', preco: String(p.preco), duracao_dias: p.duracao_dias })
        setAtivo(!!p.ativo)
      })
      .finally(() => setCarregando(false))
  }, [id])

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function salvar() {
    if (!form.nome.trim())                              { setErro('Nome é obrigatório'); return }
    if (form.preco === '' || isNaN(Number(form.preco))) { setErro('Preço inválido'); return }
    setSalvando(true); setErro(null)
    try {
      const payload = { ...form, preco: Number(form.preco), duracao_dias: Number(form.duracao_dias) }
      if (isEdicao) { await planosService.atualizar(id, payload) }
      else          { await planosService.criar(payload) }
      mutate('admin-planos')
      navigate('/admin/planos')
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo() {
    setToggleando(true)
    try {
      await planosService.toggleAtivo(id)
      mutate('admin-planos')
      navigate('/admin/planos')
    } catch { setErro('Erro ao alterar status') }
    finally  { setToggleando(false) }
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
            {isEdicao ? 'Editar Plano' : 'Novo Plano'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {isEdicao ? 'Atualize os dados do plano.' : 'Configure o plano que será oferecido aos alunos.'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isEdicao && (
            <BtnExcluir onClick={toggleAtivo} loading={toggleando} label={ativo ? 'Inativar' : 'Reativar'} />
          )}
          <BtnCancelar onClick={() => navigate('/admin/planos')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>

        <Campo label="Nome do plano">
          <input style={inputStyle} placeholder="Ex: Plano Premium" value={form.nome} onChange={set('nome')} />
        </Campo>

        <Campo label="Descrição">
          <textarea
            style={{ ...inputStyle, height: 80, padding: '10px 14px', resize: 'vertical' }}
            placeholder="Descreva o que está incluso neste plano..."
            value={form.descricao}
            onChange={set('descricao')}
          />
        </Campo>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Preço">
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#8A7F76', fontWeight: 700, pointerEvents: 'none' }}>R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                style={{ ...inputStyle, paddingLeft: 40 }}
                placeholder="0,00"
                value={form.preco}
                onChange={set('preco')}
              />
            </div>
          </Campo>

          <Campo label="Duração">
            <select value={form.duracao_dias} onChange={set('duracao_dias')} style={{ ...inputStyle, cursor: 'pointer' }}>
              {DURACOES.map(d => <option key={d.dias} value={d.dias}>{d.label}</option>)}
            </select>
          </Campo>
        </div>

        {erro && (
          <div style={{ padding: '10px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
            {erro}
          </div>
        )}
      </div>

    </div>
  )
}
