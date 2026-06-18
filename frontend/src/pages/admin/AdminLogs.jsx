import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate as swrMutate } from 'swr'
import { Home, RefreshCw, CheckCircle2, XCircle, MessageCircle, FileText, ChevronDown } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import * as svc from '../../services/logs'

// ─── Auditoria config ─────────────────────────────────────────────────────────
const ACAO_CONFIG = {
  criar:    { label: 'Criou',     cor: '#15803d' },
  atualizar:{ label: 'Atualizou', cor: '#1d4ed8' },
  inativar: { label: 'Inativou',  cor: '#CC1A1A' },
  reativar: { label: 'Reativou',  cor: '#B45309' },
  cancelar: { label: 'Cancelou',  cor: '#7C3AED' },
}

const ENTIDADE_OPCOES = [
  { value: 'aluno',          label: 'Aluno' },
  { value: 'personal',       label: 'Personal' },
  { value: 'nutricionista',  label: 'Nutricionista' },
  { value: 'usuario',        label: 'Usuário' },
  { value: 'plano',          label: 'Plano' },
  { value: 'assinatura',     label: 'Assinatura' },
]

const WA_TIPO_LABEL = {
  boasvindas_aluno:    'Boas-vindas',
  assinatura_nova:     'Assinatura nova',
  assinatura_vencendo: 'Assinatura vencendo',
  aluno_inativo:       'Aluno inativo',
  teste:               'Teste',
}

const WA_TIPO_COR = {
  boasvindas_aluno:    '#15803d',
  assinatura_nova:     '#1d4ed8',
  assinatura_vencendo: '#B45309',
  aluno_inativo:       '#CC1A1A',
  teste:               '#6B6560',
}

function AcaoBadge({ acao, entidade }) {
  const cfg     = ACAO_CONFIG[acao] || { label: acao, cor: '#6B6560' }
  const entLabel = ENTIDADE_OPCOES.find(e => e.value === entidade)?.label || entidade || ''
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: cfg.cor, background: cfg.cor + '14', border: `1px solid ${cfg.cor}30`, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap', alignSelf: 'flex-start' }}>
        {cfg.label}
      </span>
      {entLabel && <span style={{ fontSize: 10, color: '#A09890', paddingLeft: 2 }}>{entLabel}</span>}
    </div>
  )
}

function WaTipoBadge({ tipo }) {
  const cor = WA_TIPO_COR[tipo] || '#6B6560'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: cor + '14', border: `1px solid ${cor}30`, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {WA_TIPO_LABEL[tipo] || tipo}
    </span>
  )
}

function StatusBadge({ status }) {
  const ok = status === 'enviado'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: ok ? '#15803d' : '#CC1A1A' }}>
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {ok ? 'Enviado' : 'Erro'}
    </span>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

function Vazio({ texto }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: '#8A7F76' }}>{texto}</p>
    </div>
  )
}

// ─── JSON diff viewer ────────────────────────────────────────────────────────
const thStyle = { padding: '5px 12px', fontSize: 10, fontWeight: 800, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'left', background: '#F0EBE4', whiteSpace: 'nowrap' }
const tdStyle = { padding: '6px 12px', fontSize: 12, verticalAlign: 'top', wordBreak: 'break-word', maxWidth: 240 }

function DiffTable({ title, rows, colunas = 1 }) {
  return (
    <div style={{ marginTop: 10, border: '1px solid #E0D6CA', borderRadius: 10, overflow: 'hidden' }}>
      {title && (
        <div style={{ padding: '6px 12px', background: '#F0EBE4', borderBottom: '1px solid #E0D6CA' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#6B6560', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #E0D6CA' }}>
            <th style={{ ...thStyle, width: 120 }}>Campo</th>
            {colunas === 2 ? (
              <>
                <th style={thStyle}>Antes</th>
                <th style={thStyle}>Depois</th>
              </>
            ) : (
              <th style={thStyle}>Valor</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.campo} style={{ borderTop: i > 0 ? '1px solid #F0EBE4' : 'none', background: i % 2 === 0 ? '#FFFFFF' : '#FAFAF9' }}>
              <td style={{ ...tdStyle, color: '#6B6560', fontWeight: 600 }}>{row.campo}</td>
              {colunas === 2 ? (
                <>
                  <td style={{ ...tdStyle, color: '#CC1A1A' }}>{row.antes ?? '—'}</td>
                  <td style={{ ...tdStyle, color: '#15803d', fontWeight: 600 }}>{row.depois ?? '—'}</td>
                </>
              ) : (
                <td style={{ ...tdStyle, color: '#1A1A1A' }}>{row.valor ?? '—'}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function JsonDiff({ antes, depois }) {
  const parse = (v) => { try { return v ? JSON.parse(v) : null } catch { return null } }
  const a = parse(antes)
  const d = parse(depois)
  if (!a && !d) return null

  if (a && d) {
    const allKeys = [...new Set([...Object.keys(a), ...Object.keys(d)])]
    const changedKeys = allKeys.filter(k => JSON.stringify(a[k]) !== JSON.stringify(d[k]))
    if (changedKeys.length === 0) return null
    const rows = changedKeys.map(k => ({ campo: k, antes: a[k] != null ? String(a[k]) : null, depois: d[k] != null ? String(d[k]) : null }))
    return <DiffTable title="Alterações" rows={rows} colunas={2} />
  }

  if (d) {
    const rows = Object.entries(d).filter(([, v]) => v != null).map(([k, v]) => ({ campo: k, valor: String(v) }))
    return <DiffTable title="Dados cadastrados" rows={rows} colunas={1} />
  }

  const rows = Object.entries(a).filter(([, v]) => v != null).map(([k, v]) => ({ campo: k, valor: String(v) }))
  return <DiffTable title="Estado anterior" rows={rows} colunas={1} />
}

function LinhaAuditoria({ log }) {
  const [aberto, setAberto] = useState(false)
  const temJson = log.dados_antes || log.dados_depois

  return (
    <div style={{ borderTop: '1px solid #F7F3EE' }}>
      <div
        style={{ display: 'grid', gridTemplateColumns: '160px 1fr 130px', alignItems: 'flex-start', gap: 16, padding: '14px 24px', cursor: temJson ? 'pointer' : 'default' }}
        onClick={() => temJson && setAberto(v => !v)}
      >
        <AcaoBadge acao={log.acao} entidade={log.entidade} />
        <div>
          {log.descricao && <p style={{ fontSize: 13, color: '#1A1A1A', marginBottom: 2, lineHeight: 1.4 }}>{log.descricao}</p>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76' }}>{log.nome_usuario || `Usuário #${log.id_usuario}`}</span>
            {log.ip && <span style={{ fontSize: 10, color: '#C4B9A8' }}>{log.ip}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
          <p style={{ fontSize: 11, color: '#A09890' }}>{log.data_acao}</p>
          {temJson && <ChevronDown size={13} color="#C4B9A8" style={{ transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />}
        </div>
      </div>
      {aberto && temJson && (
        <div style={{ padding: '0 24px 16px' }}>
          <JsonDiff antes={log.dados_antes} depois={log.dados_depois} />
        </div>
      )}
    </div>
  )
}

// ─── Aba Auditoria ────────────────────────────────────────────────────────────
function TabAuditoria() {
  const { token } = useAuthContext()
  const [form,    setForm]    = useState({ acao: '', entidade: '' })
  const [filtros, setFiltros] = useState(null)
  const [pagina,  setPagina]  = useState(1)

  const chave = (token && filtros) ? ['logs-auditoria', filtros.acao, filtros.entidade, pagina] : null
  const { data: logs = [], isLoading } = useSWR(chave, () =>
    svc.listarAuditoria({ acao: filtros.acao || undefined, entidade: filtros.entidade || undefined, pagina }),
    { revalidateOnFocus: false }
  )

  function buscar() { setFiltros({ ...form }); setPagina(1) }
  function limpar()  { setForm({ acao: '', entidade: '' }); setFiltros(null); setPagina(1) }

  const selectStyle = { height: 34, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }
  const btnStyle    = { height: 34, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderBottom: '1px solid #F0EBE4', flexWrap: 'wrap' }}>
        <select value={form.entidade} onChange={e => setForm(f => ({ ...f, entidade: e.target.value }))} style={selectStyle}>
          <option value="">Todas as entidades</option>
          {ENTIDADE_OPCOES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
        <select value={form.acao} onChange={e => setForm(f => ({ ...f, acao: e.target.value }))} style={selectStyle}>
          <option value="">Todas as ações</option>
          {Object.entries(ACAO_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={buscar} style={{ ...btnStyle, background: '#CC1A1A', border: 'none', color: '#FFFFFF' }}>Buscar</button>
        {filtros && <button onClick={limpar} style={btnStyle}>Limpar</button>}
      </div>

      {!filtros ? (
        <Vazio texto="Use os filtros acima e clique em Buscar" />
      ) : isLoading ? <Spinner /> : logs.length === 0 ? <Vazio texto="Nenhum registro encontrado" /> : (
        <div>
          {logs.map(log => <LinhaAuditoria key={log.id_log} log={log} />)}
        </div>
      )}

      {filtros && (logs.length === 50 || pagina > 1) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 24px', borderTop: '1px solid #F0EBE4' }}>
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={{ height: 32, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: pagina === 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: pagina === 1 ? '#C4B9A8' : '#6B6560' }}>Anterior</button>
          <span style={{ height: 32, paddingInline: 14, display: 'flex', alignItems: 'center', fontSize: 12, color: '#8A7F76' }}>Página {pagina}</span>
          <button disabled={logs.length < 50} onClick={() => setPagina(p => p + 1)} style={{ height: 32, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: logs.length < 50 ? 'not-allowed' : 'pointer', fontSize: 12, color: logs.length < 50 ? '#C4B9A8' : '#6B6560' }}>Próxima</button>
        </div>
      )}
    </div>
  )
}

// ─── Aba WhatsApp ─────────────────────────────────────────────────────────────
function TabWhatsApp() {
  const { token } = useAuthContext()
  const [form,    setForm]    = useState({ tipo: '', status: '' })
  const [filtros, setFiltros] = useState(null)
  const [pagina,  setPagina]  = useState(1)

  const chave = (token && filtros) ? ['logs-whatsapp', filtros.tipo, filtros.status, pagina] : null
  const { data: logs = [], isLoading } = useSWR(chave, () =>
    svc.listarWhatsapp({ tipo: filtros.tipo || undefined, status: filtros.status || undefined, pagina }),
    { revalidateOnFocus: false }
  )

  function buscar() { setFiltros({ ...form }); setPagina(1) }
  function limpar()  { setForm({ tipo: '', status: '' }); setFiltros(null); setPagina(1) }

  const selectStyle = { height: 34, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }
  const btnStyle    = { height: 34, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderBottom: '1px solid #F0EBE4', flexWrap: 'wrap' }}>
        <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={selectStyle}>
          <option value="">Todos os tipos</option>
          {Object.entries(WA_TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={selectStyle}>
          <option value="">Todos os status</option>
          <option value="enviado">Enviados</option>
          <option value="erro">Com erro</option>
        </select>
        <button onClick={buscar} style={{ ...btnStyle, background: '#CC1A1A', border: 'none', color: '#FFFFFF' }}>Buscar</button>
        {filtros && <button onClick={limpar} style={btnStyle}>Limpar</button>}
      </div>

      {!filtros ? (
        <Vazio texto="Use os filtros acima e clique em Buscar" />
      ) : isLoading ? <Spinner /> : logs.length === 0 ? <Vazio texto="Nenhuma mensagem encontrada" /> : (
        <div>
          {logs.map((log, i) => (
            <div key={log.id_log} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 80px 130px', alignItems: 'flex-start', gap: 14, padding: '14px 24px', borderTop: i > 0 ? '1px solid #F7F3EE' : 'none' }}>
              <WaTipoBadge tipo={log.tipo} />
              <div>
                {log.nome_usuario && <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{log.nome_usuario}</p>}
                <p style={{ fontSize: 11, color: '#8A7F76' }}>{log.telefone || '—'}</p>
                {log.motivo_erro && <p style={{ fontSize: 11, color: '#CC1A1A', marginTop: 2 }}>{log.motivo_erro}</p>}
              </div>
              <StatusBadge status={log.status} />
              <p style={{ fontSize: 11, color: '#A09890', textAlign: 'right' }}>{log.data_envio}</p>
            </div>
          ))}
        </div>
      )}

      {filtros && (logs.length === 50 || pagina > 1) && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '16px 24px', borderTop: '1px solid #F0EBE4' }}>
          <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={{ height: 32, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: pagina === 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: pagina === 1 ? '#C4B9A8' : '#6B6560' }}>Anterior</button>
          <span style={{ height: 32, paddingInline: 14, display: 'flex', alignItems: 'center', fontSize: 12, color: '#8A7F76' }}>Página {pagina}</span>
          <button disabled={logs.length < 50} onClick={() => setPagina(p => p + 1)} style={{ height: 32, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: logs.length < 50 ? 'not-allowed' : 'pointer', fontSize: 12, color: logs.length < 50 ? '#C4B9A8' : '#6B6560' }}>Próxima</button>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
const TABS = [
  { key: 'auditoria', label: 'Auditoria',  icon: FileText    },
  { key: 'whatsapp',  label: 'WhatsApp',   icon: MessageCircle },
]

export default function AdminLogs() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('auditoria')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Logs</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>Auditoria de ações e mensagens WhatsApp</p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560', flexShrink: 0 }}
        >
          <Home size={14} /> Home
        </button>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F0EBE4' }}>
          {TABS.map(t => {
            const ativo = tab === t.key
            const Icon  = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{ flex: 1, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', borderBottom: ativo ? '2px solid #CC1A1A' : '2px solid transparent', background: ativo ? 'rgba(204,26,26,0.03)' : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: ativo ? 800 : 600, color: ativo ? '#CC1A1A' : '#8A7F76', transition: 'all 0.15s' }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            )
          })}
        </div>

        {tab === 'auditoria' && <TabAuditoria />}
        {tab === 'whatsapp'  && <TabWhatsApp  />}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
