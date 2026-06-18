import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate } from 'swr'
import { Home, MessageCircle, CheckCircle2, XCircle, Send, Play, RefreshCw, ChevronDown } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import * as svc from '../../services/integracoes'

const TIPO_LABEL = {
  boasvindas_aluno:    'Boas-vindas',
  assinatura_nova:     'Assinatura nova',
  assinatura_vencendo: 'Assinatura vencendo',
  aluno_inativo:       'Aluno inativo',
  teste:               'Teste',
}

const TIPO_COR = {
  boasvindas_aluno:    '#15803d',
  assinatura_nova:     '#1d4ed8',
  assinatura_vencendo: '#B45309',
  aluno_inativo:       '#CC1A1A',
  teste:               '#6B6560',
}

function Badge({ tipo }) {
  const cor = TIPO_COR[tipo] || '#6B6560'
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cor, background: cor + '14', border: `1px solid ${cor}30`, borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
      {TIPO_LABEL[tipo] || tipo}
    </span>
  )
}

function StatusBadge({ status }) {
  const ok = status === 'enviado'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: ok ? '#15803d' : '#CC1A1A' }}>
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {ok ? 'Enviado' : 'Erro'}
    </span>
  )
}

export default function AdminIntegracoes() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()

  const { data: statusData, isLoading: loadingStatus } = useSWR(
    token ? 'integracoes-status' : null,
    svc.buscarStatus
  )

  const [filtroTipo,   setFiltroTipo]   = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const { data: logs = [], isLoading: loadingLogs } = useSWR(
    token ? ['integracoes-logs', filtroTipo, filtroStatus] : null,
    () => svc.listarLogs({ tipo: filtroTipo || undefined, status: filtroStatus || undefined })
  )

  const [testePhone, setTestePhone]   = useState('')
  const [testeNome,  setTesteNome]    = useState('')
  const [enviandoTeste, setEnviandoTeste] = useState(false)
  const [resultadoTeste, setResultadoTeste] = useState(null)

  const [executandoCron, setExecutandoCron] = useState(null)
  const [resultadoCron,  setResultadoCron]  = useState(null)

  const configurado = statusData?.configurado

  async function handleTeste() {
    if (!testePhone) return
    setEnviandoTeste(true)
    setResultadoTeste(null)
    try {
      const r = await svc.enviarTeste({ telefone: testePhone, nomeAluno: testeNome || 'Aluno Teste' })
      setResultadoTeste(r)
      mutate(['integracoes-logs', filtroTipo, filtroStatus])
    } catch (e) {
      setResultadoTeste({ ok: false, motivo: e.response?.data?.erro || e.message })
    } finally {
      setEnviandoTeste(false)
    }
  }

  async function handleCron(tipo) {
    setExecutandoCron(tipo)
    setResultadoCron(null)
    try {
      const r = await svc.executarCron(tipo)
      setResultadoCron({ tipo, mensagem: r.mensagem })
      mutate(['integracoes-logs', filtroTipo, filtroStatus])
    } catch (e) {
      setResultadoCron({ tipo, mensagem: e.response?.data?.erro || e.message, erro: true })
    } finally {
      setExecutandoCron(null)
    }
  }

  const inputStyle = { height: 40, padding: '0 12px', border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 6 }}>Integrações</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>WhatsApp Business API (Meta)</p>
        </div>
        <button
          onClick={() => navigate('/admin')}
          style={{ height: 36, paddingInline: 14, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560', flexShrink: 0 }}
        >
          <Home size={14} /> Home
        </button>
      </div>

      {/* Status da conexão */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={18} color="#25D366" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>WhatsApp Business</p>
        </div>

        {loadingStatus ? (
          <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: configurado ? 'rgba(21,128,61,0.05)' : 'rgba(204,26,26,0.05)', border: `1px solid ${configurado ? 'rgba(21,128,61,0.2)' : 'rgba(204,26,26,0.2)'}` }}>
              {configurado
                ? <CheckCircle2 size={18} color="#15803d" />
                : <XCircle size={18} color="#CC1A1A" />
              }
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: configurado ? '#15803d' : '#CC1A1A' }}>
                  {configurado ? 'Conectado' : 'Não configurado'}
                </p>
                <p style={{ fontSize: 12, color: '#8A7F76' }}>
                  {configurado
                    ? `Phone Number ID: ${statusData.phone_number_id}`
                    : 'Defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no arquivo .env do backend'
                  }
                </p>
              </div>
            </div>

            {configurado && statusData && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: '12px 16px', background: '#FAFAF9', borderRadius: 10, border: '1px solid #F0EBE4' }}>
                  <p style={{ fontSize: 11, color: '#8A7F76', marginBottom: 3 }}>Alerta inatividade</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{statusData.dias_inativo} dias sem treinar</p>
                </div>
                <div style={{ padding: '12px 16px', background: '#FAFAF9', borderRadius: 10, border: '1px solid #F0EBE4' }}>
                  <p style={{ fontSize: 11, color: '#8A7F76', marginBottom: 3 }}>Nome da academia</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{statusData.nome_academia}</p>
                </div>
              </div>
            )}

            {!configurado && (
              <div style={{ padding: '14px 16px', background: '#FAFAF9', borderRadius: 12, border: '1px solid #F0EBE4' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Como configurar:</p>
                <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    'Acesse developers.facebook.com e crie um app com WhatsApp',
                    'Adicione um número de telefone ao WhatsApp Business',
                    'Copie o Access Token permanente e o Phone Number ID',
                    'Adicione ao arquivo backend/.env',
                    'Crie os templates no Meta Business Manager',
                    'Reinicie o servidor',
                  ].map((s, i) => (
                    <li key={i} style={{ fontSize: 12, color: '#6B6560', lineHeight: 1.5 }}>{s}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notificações automáticas */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', padding: '20px 28px', borderBottom: '1px solid #F0EBE4' }}>Notificações automáticas</p>
        {[
          { tipo: 'boasvindas_aluno',    label: 'Boas-vindas',           desc: 'Enviado quando um aluno é cadastrado',                          quando: 'Imediato' },
          { tipo: 'assinatura_nova',     label: 'Assinatura nova',       desc: 'Enviado quando uma assinatura é criada',                        quando: 'Imediato' },
          { tipo: 'assinatura_vencendo', label: 'Assinatura vencendo',   desc: 'Avisa o aluno quando a assinatura vence em 7 dias',              quando: 'Cron · 9h' },
          { tipo: 'aluno_inativo',       label: 'Aluno inativo',         desc: `Avisa quando o aluno não treina há ${statusData?.dias_inativo || 7} dias`, quando: 'Cron · 10h' },
        ].map((item, i, arr) => (
          <div key={item.tipo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 28px', borderBottom: i < arr.length - 1 ? '1px solid #F7F3EE' : 'none' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: (TIPO_COR[item.tipo] || '#6B6560') + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageCircle size={16} color={TIPO_COR[item.tipo] || '#6B6560'} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>{item.label}</p>
                <p style={{ fontSize: 12, color: '#8A7F76' }}>{item.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#A09890', background: '#F7F3EE', borderRadius: 6, padding: '3px 8px' }}>{item.quando}</span>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: configurado ? '#25D366' : '#E0D6CA' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Enviar mensagem de teste */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', marginBottom: 16 }}>Enviar mensagem de teste</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={testePhone}
              onChange={e => setTestePhone(e.target.value)}
              placeholder="Telefone (ex: 11999999999)"
              style={inputStyle}
            />
            <input
              value={testeNome}
              onChange={e => setTesteNome(e.target.value)}
              placeholder="Nome do aluno (opcional)"
              style={inputStyle}
            />
            <button
              onClick={handleTeste}
              disabled={!configurado || enviandoTeste || !testePhone}
              style={{ height: 40, borderRadius: 10, border: 'none', background: (!configurado || !testePhone) ? '#F0EBE4' : 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: (!configurado || !testePhone) ? '#C4B9A8' : '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: (!configurado || !testePhone) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {enviandoTeste ? <><RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</> : <><Send size={13} /> Enviar teste</>}
            </button>
            {resultadoTeste && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: resultadoTeste.ok ? 'rgba(21,128,61,0.05)' : '#FEF2F2', border: `1px solid ${resultadoTeste.ok ? 'rgba(21,128,61,0.2)' : '#FCA5A5'}`, fontSize: 12, color: resultadoTeste.ok ? '#15803d' : '#CC1A1A', fontWeight: 600 }}>
                {resultadoTeste.ok ? `✓ Enviado — ID: ${resultadoTeste.messageId}` : `✗ ${resultadoTeste.motivo}`}
              </div>
            )}
          </div>
        </div>

        {/* Executar crons manualmente */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', marginBottom: 16 }}>Executar crons manualmente</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { tipo: 'assinatura-vencendo', label: 'Assinaturas vencendo em 7 dias' },
              { tipo: 'aluno-inativo',       label: `Alunos sem treinar há ${statusData?.dias_inativo || 7} dias` },
            ].map(item => (
              <button
                key={item.tipo}
                onClick={() => handleCron(item.tipo)}
                disabled={!configurado || !!executandoCron}
                style={{ height: 40, borderRadius: 10, border: '1px solid #E0D6CA', background: !configurado ? '#F7F3EE' : '#FAFAF9', color: !configurado ? '#C4B9A8' : '#1A1A1A', fontSize: 13, fontWeight: 600, cursor: !configurado ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px' }}
              >
                {executandoCron === item.tipo
                  ? <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                  : <Play size={13} color="#CC1A1A" />
                }
                {item.label}
              </button>
            ))}
            {resultadoCron && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: resultadoCron.erro ? '#FEF2F2' : 'rgba(21,128,61,0.05)', border: `1px solid ${resultadoCron.erro ? '#FCA5A5' : 'rgba(21,128,61,0.2)'}`, fontSize: 12, color: resultadoCron.erro ? '#CC1A1A' : '#15803d', fontWeight: 600 }}>
                {resultadoCron.mensagem}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Templates */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A', padding: '20px 28px', borderBottom: '1px solid #F0EBE4' }}>Templates necessários na Meta</p>
        <div style={{ padding: '0 28px 20px' }}>
          <p style={{ fontSize: 12, color: '#8A7F76', marginTop: 16, marginBottom: 16 }}>
            Crie os seguintes templates no <strong>Meta Business Manager → WhatsApp → Templates de mensagem</strong> antes de usar:
          </p>
          {[
            { name: 'boasvindas_aluno',    params: '{{1}} nome do aluno',                                                          desc: 'Boas-vindas ao cadastrar aluno' },
            { name: 'assinatura_nova',     params: '{{1}} nome aluno · {{2}} nome do plano · {{3}} data de vencimento',            desc: 'Confirmação de nova assinatura' },
            { name: 'assinatura_vencendo', params: '{{1}} nome aluno · {{2}} plano · {{3}} dias · {{4}} data fim · {{5}} telefone', desc: 'Aviso de assinatura vencendo' },
            { name: 'aluno_inativo',       params: '{{1}} nome aluno · {{2}} dias sem treinar · {{3}} nome academia',              desc: 'Engajamento aluno inativo' },
          ].map((t, i, arr) => (
            <div key={t.name} style={{ padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #F7F3EE' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <code style={{ fontSize: 12, fontWeight: 800, color: '#CC1A1A', background: 'rgba(204,26,26,0.07)', borderRadius: 6, padding: '2px 8px' }}>{t.name}</code>
                <span style={{ fontSize: 11, color: '#8A7F76' }}>{t.desc}</span>
              </div>
              <p style={{ fontSize: 11, color: '#A09890' }}>Parâmetros: {t.params}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Log de mensagens */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>Log de mensagens</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={{ height: 34, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
              <option value="">Todos os tipos</option>
              {Object.entries(TIPO_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={{ height: 34, padding: '0 10px', border: '1px solid #E0D6CA', borderRadius: 8, fontSize: 12, color: '#6B6560', background: '#FFFFFF', cursor: 'pointer', outline: 'none' }}>
              <option value="">Todos os status</option>
              <option value="enviado">Enviados</option>
              <option value="erro">Com erro</option>
            </select>
            <button onClick={() => mutate(['integracoes-logs', filtroTipo, filtroStatus])} style={{ width: 34, height: 34, border: '1px solid #E0D6CA', borderRadius: 8, background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={13} color="#8A7F76" />
            </button>
          </div>
        </div>

        {loadingLogs ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <MessageCircle size={28} color="#C4B9A8" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#8A7F76' }}>Nenhuma mensagem enviada ainda</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <div key={log.id_log} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 80px 100px', alignItems: 'center', gap: 12, padding: '12px 24px', borderTop: i > 0 ? '1px solid #F7F3EE' : 'none' }}>
                <Badge tipo={log.tipo} />
                <div>
                  {log.nome_usuario && <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A', marginBottom: 1 }}>{log.nome_usuario}</p>}
                  <p style={{ fontSize: 11, color: '#8A7F76' }}>{log.telefone || '—'}</p>
                  {log.motivo_erro && <p style={{ fontSize: 11, color: '#CC1A1A' }}>{log.motivo_erro}</p>}
                </div>
                <StatusBadge status={log.status} />
                <p style={{ fontSize: 11, color: '#A09890' }}>{log.data_envio}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
