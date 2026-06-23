import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import { BtnSalvar, BtnCancelar } from '../../components/ui/Botoes'
import { listar as listarAssinaturas } from '../../services/assinaturas'
import { criar } from '../../services/pagamento'
import { useAuthContext } from '../../context/AuthContext'

const FORMAS = [
  { value: 'pix',           label: 'PIX' },
  { value: 'dinheiro',      label: 'Dinheiro' },
  { value: 'cartao',        label: 'Cartão' },
  { value: 'boleto',        label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
]

const inputStyle = {
  height: 42, padding: '0 14px',
  border: '1px solid #E0D6CA', borderRadius: 10,
  fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF',
  width: '100%', boxSizing: 'border-box',
}

function Campo({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</label>
      {children}
    </div>
  )
}

export default function PagamentoForm() {
  const navigate = useNavigate()
  const { token } = useAuthContext()

  const { data: assinaturas = [] } = useSWR(
    token ? 'assinaturas-lista' : null,
    () => listarAssinaturas({ status: 'ativa' })
  )

  const [form, setForm] = useState({
    id_assinatura: '',
    valor: '',
    data_vencimento: '',
    observacao: '',
    status: 'pendente',
    forma_pagamento: 'pix',
    data_pagamento: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState(null)

  function setF(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  useEffect(() => {
    if (!form.id_assinatura) return
    const ass = assinaturas.find(a => String(a.id_assinatura) === String(form.id_assinatura))
    if (ass) {
      setForm(f => ({
        ...f,
        valor: ass.preco ?? f.valor,
        data_vencimento: ass.data_fim?.slice(0, 10) ?? f.data_vencimento,
      }))
    }
  }, [form.id_assinatura])

  async function salvar() {
    if (!form.id_assinatura)    { setErro('Selecione a assinatura'); return }
    if (!form.valor)             { setErro('Informe o valor'); return }
    if (!form.data_vencimento)   { setErro('Informe a data de vencimento'); return }
    if (form.status === 'pago' && !form.forma_pagamento) { setErro('Informe a forma de pagamento'); return }

    const ass = assinaturas.find(a => String(a.id_assinatura) === String(form.id_assinatura))
    setSalvando(true); setErro(null)
    try {
      await criar({
        id_assinatura:  Number(form.id_assinatura),
        id_usuario:     ass.id_usuario,
        valor:          Number(form.valor),
        data_vencimento: form.data_vencimento,
        observacao:     form.observacao || null,
        status:         form.status,
        forma_pagamento: form.status === 'pago' ? form.forma_pagamento : null,
        data_pagamento:  form.status === 'pago' ? (form.data_pagamento || form.data_vencimento) : null,
      })
      navigate('/admin/pagamentos')
    } catch (e) {
      setErro(e.response?.data?.erro || e.message || 'Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  const assAtual = assinaturas.find(a => String(a.id_assinatura) === String(form.id_assinatura))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>
            Novo Pagamento
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Registre uma cobrança manual para um aluno.</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <BtnCancelar onClick={() => navigate('/admin/pagamentos')} />
          <BtnSalvar onClick={salvar} loading={salvando} />
        </div>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dados da cobrança</p>

        <Campo label="Assinatura do aluno">
          <select value={form.id_assinatura} onChange={setF('id_assinatura')} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Selecione a assinatura</option>
            {assinaturas.map(a => (
              <option key={a.id_assinatura} value={a.id_assinatura}>
                {a.aluno_nome} — {a.plano_nome}
              </option>
            ))}
          </select>
        </Campo>

        {assAtual && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: '#F7F3EE', border: '1px solid #E0D6CA', fontSize: 13, color: '#6B6560' }}>
            Plano: <strong>{assAtual.plano_nome}</strong> · Vigência: {assAtual.data_inicio?.slice(0,10)} até {assAtual.data_fim?.slice(0,10)}
          </div>
        )}

        <div className="pf-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Campo label="Valor (R$)">
            <input
              type="number" step="0.01" min="0"
              value={form.valor} onChange={setF('valor')}
              placeholder="Ex: 150.00"
              style={inputStyle}
            />
          </Campo>

          <Campo label="Data de vencimento">
            <input type="date" value={form.data_vencimento} onChange={setF('data_vencimento')} style={inputStyle} />
          </Campo>
        </div>

        <Campo label="Status">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { value: 'pendente', label: 'Pendente' },
              { value: 'pago',     label: 'Já pago'  },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setForm(f => ({ ...f, status: value }))}
                style={{
                  height: 40, paddingInline: 20, borderRadius: 10, cursor: 'pointer',
                  fontWeight: 700, fontSize: 13,
                  border: `2px solid ${form.status === value ? '#CC1A1A' : '#E0D6CA'}`,
                  background: form.status === value ? 'rgba(204,26,26,0.06)' : '#FFF',
                  color: form.status === value ? '#CC1A1A' : '#6B6560',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Campo>

        {form.status === 'pago' && (
          <div className="pf-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Campo label="Forma de pagamento">
              <select value={form.forma_pagamento} onChange={setF('forma_pagamento')} style={{ ...inputStyle, cursor: 'pointer' }}>
                {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </Campo>
            <Campo label="Data do pagamento">
              <input type="date" value={form.data_pagamento} onChange={setF('data_pagamento')} style={inputStyle} />
            </Campo>
          </div>
        )}

        <Campo label="Observação (opcional)">
          <input
            value={form.observacao} onChange={setF('observacao')}
            placeholder="Ex: Mensalidade janeiro 2025"
            style={inputStyle}
          />
        </Campo>
      </div>

      {erro && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13 }}>
          {erro}
        </div>
      )}

      <style>{`
        @media (max-width: 600px) {
          .pf-grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
