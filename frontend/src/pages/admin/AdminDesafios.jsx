import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Users, CheckCircle2 } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import * as svc from '../../services/social'

const TIPO_META_LABEL = { treinos: 'Treinos concluídos', peso_perdido: 'Kg perdidos', medidas: 'Medidas registradas' }

export default function AdminDesafios() {
  const { token } = useAuthContext()
  const { data: desafios = [], mutate } = useSWR(token ? 'admin-desafios' : null, svc.adminListarDesafios, { revalidateOnFocus: false })
  const [criando, setCriando] = useState(false)

  return (
    <div style={{ padding: '32px 24px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A' }}>Desafios</h1>
          <p style={{ fontSize: 12, color: '#8A7F76' }}>{desafios.length} desafio{desafios.length !== 1 ? 's' : ''} cadastrado{desafios.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setCriando(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, background: '#CC1A1A', border: 'none', borderRadius: 8, color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Novo desafio
        </button>
      </div>

      {criando && <FormDesafio onSalvo={() => { setCriando(false); mutate() }} onCancelar={() => setCriando(false)} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {desafios.map(d => (
          <div key={d.id_desafio} style={{ background: '#FFFFFF', border: '1px solid #F0EBE4', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{d.icone || '🏆'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A' }}>{d.titulo}</p>
                  {!d.ativo && <span style={{ fontSize: 10, fontWeight: 700, color: '#CC1A1A', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 4, padding: '1px 6px' }}>Inativo</span>}
                </div>
                <p style={{ fontSize: 11, color: '#8A7F76', marginBottom: 6 }}>
                  {TIPO_META_LABEL[d.tipo_meta] || d.tipo_meta} · Meta: {d.valor_meta} · {d.data_inicio} até {d.data_fim}
                </p>
                <div style={{ display: 'flex', gap: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6B6560' }}>
                    <Users size={11} /> {d.total_participantes} participantes
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#15803d' }}>
                    <CheckCircle2 size={11} /> {d.total_concluidos} concluídos
                  </span>
                </div>
              </div>
              <button
                onClick={async () => { await svc.adminToggleDesafio(d.id_desafio); mutate() }}
                style={{ height: 30, paddingInline: 12, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 11, color: '#6B6560', flexShrink: 0 }}
              >
                {d.ativo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
        {desafios.length === 0 && <p style={{ fontSize: 13, color: '#8A7F76', textAlign: 'center', padding: '40px 0' }}>Nenhum desafio criado ainda.</p>}
      </div>
    </div>
  )
}

function FormDesafio({ onSalvo, onCancelar }) {
  const [form, setForm] = useState({ titulo: '', descricao: '', icone: '🏆', tipo_meta: 'treinos', valor_meta: '', data_inicio: '', data_fim: '' })
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const inputStyle = { width: '100%', height: 40, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 13, color: '#1A1A1A', outline: 'none', boxSizing: 'border-box' }

  async function salvar() {
    if (!form.titulo || !form.valor_meta || !form.data_inicio || !form.data_fim) { setErro('Preencha todos os campos obrigatórios'); return }
    setLoading(true); setErro('')
    try {
      await svc.adminCriarDesafio({ ...form, valor_meta: Number(form.valor_meta) })
      onSalvo()
    } catch { setErro('Erro ao criar desafio') } finally { setLoading(false) }
  }

  return (
    <div style={{ background: '#F9F6F2', border: '1px solid #E0D6CA', borderRadius: 14, padding: '20px', marginBottom: 20 }}>
      <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', marginBottom: 16 }}>Novo desafio</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={form.icone} onChange={e => set('icone', e.target.value)} placeholder="🏆" style={{ ...inputStyle, width: 60, textAlign: 'center', fontSize: 20, flexShrink: 0 }} />
          <input value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Título do desafio *" style={inputStyle} />
        </div>
        <input value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Descrição (opcional)" style={inputStyle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select value={form.tipo_meta} onChange={e => set('tipo_meta', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="treinos">Treinos concluídos</option>
            <option value="peso_perdido">Kg perdidos</option>
            <option value="medidas">Medidas registradas</option>
          </select>
          <input type="number" value={form.valor_meta} onChange={e => set('valor_meta', e.target.value)} placeholder="Meta (ex: 15) *" style={inputStyle} min={1} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input type="date" value={form.data_inicio} onChange={e => set('data_inicio', e.target.value)} style={inputStyle} />
          <input type="date" value={form.data_fim}    onChange={e => set('data_fim',    e.target.value)} style={inputStyle} />
        </div>
        {erro && <p style={{ fontSize: 12, color: '#CC1A1A' }}>{erro}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={salvar} disabled={loading} style={{ height: 36, paddingInline: 16, background: '#CC1A1A', border: 'none', borderRadius: 8, color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={onCancelar} style={{ height: 36, paddingInline: 16, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 13, color: '#6B6560' }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}
