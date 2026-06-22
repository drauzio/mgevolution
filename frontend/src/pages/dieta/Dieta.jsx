import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useNavigate } from 'react-router-dom'
import { Salad, Flame, ChevronDown, ClipboardList, Clock, Utensils, Home, RefreshCw } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { buscarMeuPlano, buscarMeuPlanoAndamento, buscarMinhaSolicitacao, solicitarDieta } from '../../services/dieta'

const OBJETIVOS = ['Emagrecer', 'Ganhar massa muscular', 'Manutenção do peso', 'Saúde e qualidade de vida', 'Definição muscular']
const RESTRICOES_COMUM = ['Lactose', 'Glúten', 'Amendoim', 'Frutos do mar', 'Ovo', 'Soja']

const STATUS_INFO = {
  pendente:     { label: 'Aguardando análise', color: '#CA8A04', bg: 'rgba(234,179,8,0.1)',  Icon: Clock },
  em_andamento: { label: 'Em elaboração',      color: '#2563EB', bg: 'rgba(37,99,235,0.1)', Icon: ClipboardList },
}

function fmtData(d) {
  if (!d) return ''
  const s = typeof d === 'string' ? d : d.toISOString()
  return new Date(s.includes('T') ? s : s + 'T12:00:00').toLocaleDateString('pt-BR')
}

function fmtHorario(h) {
  if (!h) return ''
  // aceita "07:00", "07:00:00", "7:00", "700" etc.
  const match = String(h).match(/^(\d{1,2})[:\s]?(\d{2})/)
  if (!match) return h
  return `${match[1].padStart(2, '0')}h${match[2]}`
}

function SolicitacaoPendente({ sol, onEditar }) {
  const info = STATUS_INFO[sol.status] || STATUS_INFO.pendente
  const { Icon } = info

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: info.bg, border: `1px solid ${info.color}30`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${info.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} color={info.color} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: info.color, marginBottom: 2 }}>{info.label}</p>
          <p style={{ fontSize: 12, color: '#8A7F76' }}>Solicitação enviada em {fmtData(sol.data_solicitacao)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sol.objetivo && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Objetivo</p>
            <p style={{ fontSize: 14, color: '#1A1A1A', fontWeight: 600 }}>{sol.objetivo}</p>
          </div>
        )}
        {sol.refeicoes_dia && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Refeições por dia</p>
            <p style={{ fontSize: 14, color: '#1A1A1A' }}>{sol.refeicoes_dia} refeições</p>
          </div>
        )}
        {sol.restricoes && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Restrições</p>
            <p style={{ fontSize: 14, color: '#1A1A1A' }}>{sol.restricoes}</p>
          </div>
        )}
        {sol.preferencias && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Preferências</p>
            <p style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.5 }}>{sol.preferencias}</p>
          </div>
        )}
        {sol.observacao && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#B0A89E', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Observações</p>
            <p style={{ fontSize: 14, color: '#1A1A1A', lineHeight: 1.5 }}>{sol.observacao}</p>
          </div>
        )}
      </div>

      {sol.status === 'pendente' && (
        <button
          onClick={onEditar}
          style={{ alignSelf: 'flex-start', height: 36, paddingInline: 16, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', fontSize: 13, fontWeight: 700, color: '#6B6560', cursor: 'pointer' }}
        >
          Editar solicitação
        </button>
      )}
    </div>
  )
}

function FormSolicitacao({ solAtual, onSalvo, onCancelar }) {
  const [form, setForm] = useState({
    objetivo:      solAtual?.objetivo      || '',
    restricoes:    solAtual?.restricoes    || '',
    preferencias:  solAtual?.preferencias  || '',
    refeicoes_dia: solAtual?.refeicoes_dia || '',
    observacao:    solAtual?.observacao    || '',
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState(null)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleRestricao(item) {
    const atual = form.restricoes ? form.restricoes.split(', ').filter(Boolean) : []
    const novo  = atual.includes(item) ? atual.filter(r => r !== item) : [...atual, item]
    set('restricoes', novo.join(', '))
  }

  const restricoesSelecionadas = form.restricoes ? form.restricoes.split(', ').filter(Boolean) : []

  async function enviar(e) {
    e.preventDefault()
    if (!form.objetivo) { setErro('Informe seu objetivo'); return }
    setSalvando(true); setErro(null)
    try {
      await solicitarDieta(form)
      await mutate('minha-solicitacao-dieta')
      onSalvo()
    } catch {
      setErro('Erro ao enviar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const inputStyle = { height: 40, paddingInline: 14, border: '1px solid #E0D6CA', borderRadius: 10, fontSize: 14, color: '#1A1A1A', background: '#FFFFFF', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ background: 'rgba(204,26,26,0.04)', border: '1px solid rgba(204,26,26,0.12)', borderRadius: 12, padding: '12px 16px' }}>
        <p style={{ fontSize: 13, color: '#6B6560', lineHeight: 1.6 }}>
          Preencha as informações abaixo para solicitar seu plano alimentar. Nossa equipe irá montar a dieta personalizada com base no que você informar.
        </p>
      </div>

      {/* Objetivo */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Objetivo principal *</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {OBJETIVOS.map(obj => (
            <label
              key={obj}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1px solid ${form.objetivo === obj ? '#CC1A1A' : '#E0D6CA'}`, background: form.objetivo === obj ? 'rgba(204,26,26,0.05)' : '#FFFFFF', cursor: 'pointer' }}
            >
              <input
                type="radio"
                name="objetivo"
                value={obj}
                checked={form.objetivo === obj}
                onChange={() => set('objetivo', obj)}
                style={{ accentColor: '#CC1A1A', width: 16, height: 16, flexShrink: 0 }}
              />
              <span style={{ fontSize: 14, color: form.objetivo === obj ? '#CC1A1A' : '#1A1A1A', fontWeight: form.objetivo === obj ? 600 : 400 }}>{obj}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Refeições */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Refeições por dia</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[3, 4, 5, 6].map(n => (
            <button
              type="button"
              key={n}
              onClick={() => set('refeicoes_dia', n)}
              style={{ height: 40, minWidth: 60, paddingInline: 14, borderRadius: 10, border: `1px solid ${form.refeicoes_dia === n ? '#CC1A1A' : '#E0D6CA'}`, background: form.refeicoes_dia === n ? 'rgba(204,26,26,0.08)' : '#FFFFFF', color: form.refeicoes_dia === n ? '#CC1A1A' : '#6B6560', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {n}x
            </button>
          ))}
        </div>
      </div>

      {/* Restrições */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Restrições alimentares</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {RESTRICOES_COMUM.map(item => {
            const ativo = restricoesSelecionadas.includes(item)
            return (
              <button
                type="button"
                key={item}
                onClick={() => toggleRestricao(item)}
                style={{ height: 30, paddingInline: 12, borderRadius: 99, border: `1px solid ${ativo ? '#CC1A1A' : '#E0D6CA'}`, background: ativo ? 'rgba(204,26,26,0.08)' : '#FFFFFF', color: ativo ? '#CC1A1A' : '#8A7F76', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                {item}
              </button>
            )
          })}
        </div>
        <input
          value={form.restricoes}
          onChange={e => set('restricoes', e.target.value)}
          placeholder="Outras (ex: diabetes, hipertensão...)"
          style={inputStyle}
        />
      </div>

      {/* Preferências */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Preferências alimentares</p>
        <textarea
          value={form.preferencias}
          onChange={e => set('preferencias', e.target.value)}
          placeholder="O que gosta? O que não gosta? Coma em casa ou trabalho?"
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* Observações */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Observações adicionais</p>
        <textarea
          value={form.observacao}
          onChange={e => set('observacao', e.target.value)}
          placeholder="Horário de treino, rotina, qualquer detalhe importante..."
          rows={3}
          style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {erro && <p style={{ fontSize: 13, color: '#CC1A1A' }}>{erro}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid #E0D6CA', background: '#FFFFFF', fontSize: 14, fontWeight: 700, color: '#6B6560', cursor: 'pointer' }}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={salvando}
          style={{ flex: 2, height: 44, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1, boxShadow: '0 2px 10px rgba(180,26,26,0.25)' }}
        >
          {salvando ? 'Enviando...' : solAtual ? 'Atualizar solicitação' : 'Solicitar minha dieta'}
        </button>
      </div>
    </form>
  )
}

const BTN_HOME = (navigate) => (
  <button
    onClick={() => navigate('/dashboard')}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 14, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B6560', flexShrink: 0 }}
  >
    <Home size={14} />
    Home
  </button>
)

export default function Dieta() {
  const { token } = useAuthContext()
  const navigate  = useNavigate()
  const [abertas, setAbertas]   = useState({})
  const [editando, setEditando] = useState(false)

  const { data: plano, isLoading: loadingPlano } = useSWR(
    token ? 'minha-dieta' : null,
    buscarMeuPlano
  )

  const { data: planoAndamento, isLoading: loadingAndamento } = useSWR(
    token && !plano ? 'meu-plano-andamento' : null,
    buscarMeuPlanoAndamento
  )

  const { data: solicitacao, isLoading: loadingSol } = useSWR(
    token ? 'minha-solicitacao-dieta' : null,
    buscarMinhaSolicitacao
  )
  const [modalMudanca, setModalMudanca] = useState(false)

  function toggleRefeicao(id) {
    setAbertas(a => ({ ...a, [id]: !a[id] }))
  }

  if (loadingPlano || loadingAndamento || loadingSol) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  // ── Sem plano: plano em elaboração (rascunho/revisao) ───────
  if (!plano && planoAndamento) {
    const emRevisao = planoAndamento.status_plano === 'revisao'
    return (
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Dieta</h1>
            <p style={{ fontSize: 14, color: '#8A7F76' }}>Plano alimentar do método MG</p>
          </div>
          {BTN_HOME(navigate)}
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: emRevisao ? 'rgba(37,99,235,0.08)' : 'rgba(234,179,8,0.1)', border: `1px solid ${emRevisao ? 'rgba(37,99,235,0.2)' : 'rgba(234,179,8,0.25)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ClipboardList size={22} color={emRevisao ? '#2563EB' : '#CA8A04'} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', marginBottom: 4 }}>
                {emRevisao ? 'Plano em revisão final' : 'Plano sendo elaborado'}
              </p>
              <p style={{ fontSize: 13, color: '#8A7F76', lineHeight: 1.6 }}>
                {emRevisao
                  ? 'Nossa equipe está revisando seu plano alimentar. Em breve ele estará disponível aqui para você.'
                  : 'Nossa equipe já está montando seu plano alimentar personalizado. Não é necessário fazer uma nova solicitação.'}
              </p>
            </div>
          </div>

          <div style={{ background: emRevisao ? 'rgba(37,99,235,0.04)' : 'rgba(234,179,8,0.06)', border: `1px solid ${emRevisao ? 'rgba(37,99,235,0.12)' : 'rgba(234,179,8,0.2)'}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: emRevisao ? '#2563EB' : '#CA8A04', boxShadow: `0 0 0 3px ${emRevisao ? 'rgba(37,99,235,0.2)' : 'rgba(202,138,4,0.2)'}` }} />
            <p style={{ fontSize: 13, color: emRevisao ? '#1D4ED8' : '#92400E', fontWeight: 600 }}>
              Status: {emRevisao ? 'Em revisão — quase pronto!' : 'Em elaboração'}
            </p>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Sem plano: fluxo de solicitação ─────────────────────────
  if (!plano) {
    const mostrarForm = !solicitacao || editando

    return (
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>Dieta</h1>
            <p style={{ fontSize: 14, color: '#8A7F76' }}>Plano alimentar do método MG</p>
          </div>
          {BTN_HOME(navigate)}
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: 24, boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          {mostrarForm ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A', marginBottom: 2 }}>
                    {solicitacao ? 'Editar solicitação' : 'Solicitar dieta'}
                  </p>
                  <p style={{ fontSize: 13, color: '#8A7F76' }}>Preencha para nossa equipe criar seu plano</p>
                </div>
              </div>
              <FormSolicitacao
                solAtual={solicitacao}
                onSalvo={() => setEditando(false)}
                onCancelar={solicitacao ? () => setEditando(false) : null}
              />
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Salad size={18} color="#CC1A1A" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1A', marginBottom: 2 }}>Plano ainda sendo preparado</p>
                  <p style={{ fontSize: 13, color: '#8A7F76' }}>Acompanhe o status da sua solicitação</p>
                </div>
              </div>
              <SolicitacaoPendente sol={solicitacao} onEditar={() => setEditando(true)} />
            </>
          )}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── Com plano: exibição normal ───────────────────────────────
  const totalCal  = (plano.refeicoes || []).flatMap(r => r.itens || []).reduce((a, it) => a + (it.calorias || 0), 0)
  const totalProt = (plano.refeicoes || []).flatMap(r => r.itens || []).reduce((a, it) => a + (it.proteina || 0), 0)
  const metaCal   = plano.calorias_meta  || totalCal  || 1
  const metaProt  = plano.proteina_meta  || totalProt || 1
  const pctCal    = Math.min(100, Math.round((totalCal  / metaCal)  * 100))
  const pctProt   = Math.min(100, Math.round((totalProt / metaProt) * 100))

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>Dieta</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 14, color: '#8A7F76' }}>{plano.nome}</p>
            {plano.refeicoes?.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, paddingInline: 8, borderRadius: 6, background: '#F0EBE4', fontSize: 11, fontWeight: 700, color: '#8A7F76' }}>
                <Utensils size={10} color="#8A7F76" />
                {plano.refeicoes.length} refeições/dia
              </span>
            )}
          </div>
          {plano.objetivo && <p style={{ fontSize: 12, color: '#C4B9A8', marginTop: 4 }}>{plano.objetivo}</p>}
        </div>
        {BTN_HOME(navigate)}
      </div>

      {/* Solicitação de mudança */}
      {solicitacao && solicitacao.status !== 'concluida' ? (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <RefreshCw size={15} color="#CA8A04" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#CA8A04', marginBottom: 1 }}>Mudança solicitada</p>
              <p style={{ fontSize: 12, color: '#8A7F76' }}>
                {solicitacao.status === 'pendente' ? 'Aguardando análise do nutricionista' : 'Em preparação'}
              </p>
            </div>
          </div>
          <button onClick={() => setModalMudanca(true)} style={{ fontSize: 12, fontWeight: 700, color: '#CA8A04', background: 'none', border: '1px solid #FDE68A', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>
            Editar
          </button>
        </div>
      ) : (
        <button
          onClick={() => setModalMudanca(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: '#FFFFFF', border: '1.5px dashed #E0D6CA', borderRadius: 14, cursor: 'pointer', width: '100%', transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#CC1A1A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#E0D6CA'}
        >
          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <RefreshCw size={15} color="#CC1A1A" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A' }}>Solicitar mudança de dieta</p>
            <p style={{ fontSize: 12, color: '#8A7F76' }}>Não está satisfeito? Peça uma alteração ao nutricionista</p>
          </div>
        </button>
      )}

      {modalMudanca && (
        <FormSolicitacao
          solAtual={solicitacao?.status !== 'concluida' ? solicitacao : null}
          onCancelar={() => setModalMudanca(false)}
          onSalvo={() => { setModalMudanca(false); mutate('minha-solicitacao-dieta') }}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={15} color="#CC1A1A" />
            </div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Calorias</p>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 12 }}>
            {totalCal}
            <span style={{ fontSize: 13, color: '#B0A89E', fontWeight: 400 }}>/{plano.calorias_meta || totalCal} kcal</span>
          </p>
          <div style={{ height: 6, background: '#F0EBE4', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctCal}%`, background: 'linear-gradient(90deg, #A81515, #CC1A1A)', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 8 }}>{pctCal}% do objetivo</p>
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '20px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Salad size={15} color="#16A34A" />
            </div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Proteína</p>
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 12 }}>
            {totalProt}g
            <span style={{ fontSize: 13, color: '#B0A89E', fontWeight: 400 }}>/{plano.proteina_meta || totalProt}g</span>
          </p>
          <div style={{ height: 6, background: '#F0EBE4', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctProt}%`, background: 'linear-gradient(90deg, #15803D, #16A34A)', borderRadius: 99 }} />
          </div>
          <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 8 }}>{pctProt}% da meta diária</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(plano.refeicoes || []).map((r, i) => {
          const calRef  = (r.itens || []).reduce((a, it) => a + (it.calorias || 0), 0)
          const protRef = (r.itens || []).reduce((a, it) => a + (it.proteina || 0), 0)
          const aberta  = !!abertas[r.id_dieta_refeicao]
          const temItens = r.itens?.length > 0

          return (
            <div key={r.id_dieta_refeicao} style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              {/* Cabeçalho da refeição */}
              <div
                onClick={() => temItens && toggleRefeicao(r.id_dieta_refeicao)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: temItens ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (temItens) e.currentTarget.style.background = '#FDFAF7' }}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Número da refeição */}
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: '#CC1A1A' }}>{i + 1}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', marginBottom: 4 }}>{r.nome}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Horário como chip */}
                    {r.horario && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, paddingInline: 8, borderRadius: 6, background: '#F0EBE4', fontSize: 11, fontWeight: 700, color: '#8A7F76' }}>
                        <Clock size={10} color="#8A7F76" />
                        {fmtHorario(r.horario)}
                      </span>
                    )}
                    {calRef > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}>{calRef} kcal</span>
                    )}
                    {protRef > 0 && (
                      <span style={{ fontSize: 12, color: '#8A7F76' }}>{protRef}g prot</span>
                    )}
                    {temItens && (
                      <span style={{ fontSize: 11, color: '#C4B9A8' }}>{r.itens.length} {r.itens.length === 1 ? 'item' : 'itens'}</span>
                    )}
                  </div>
                </div>

                {temItens && (
                  <div style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid #E0D6CA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'transform 0.2s', transform: aberta ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown size={13} color="#B0A89E" />
                  </div>
                )}
              </div>

              {/* Itens expandidos */}
              {aberta && temItens && (
                <div style={{ borderTop: '1px solid #F0EBE4', padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8, background: '#FDFAF7' }}>
                  {r.itens.map(it => (
                    <div key={it.id_dieta_refeicao_item} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Item principal */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#FFFFFF', borderRadius: 10, border: '1px solid #F0EBE4' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: '#CC1A1A' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1A' }}>{it.descricao}</p>
                          {it.quantidade && (
                            <p style={{ fontSize: 11, color: '#8A7F76', marginTop: 2 }}>{it.quantidade} {it.unidade}</p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                          {it.calorias > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#CC1A1A' }}>{it.calorias} kcal</span>}
                          {it.proteina > 0 && <span style={{ fontSize: 11, color: '#8A7F76' }}>{it.proteina}g prot</span>}
                        </div>
                      </div>

                      {/* Substituições */}
                      {it.substituicoes?.map((sub, si) => (
                        <div key={sub.id_substituicao ?? si} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', background: '#FFFFFF', borderRadius: 10, border: '1px dashed #E0D6CA', marginLeft: 18 }}>
                          <span style={{ fontSize: 9, fontWeight: 900, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>ou</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, color: '#6B6560' }}>{sub.descricao}</p>
                            {sub.quantidade && (
                              <p style={{ fontSize: 11, color: '#B0A89E', marginTop: 2 }}>{sub.quantidade} {sub.unidade}</p>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                            {sub.calorias > 0 && <span style={{ fontSize: 11, color: '#B0A89E' }}>{sub.calorias} kcal</span>}
                            {sub.proteina > 0 && <span style={{ fontSize: 11, color: '#B0A89E' }}>{sub.proteina}g prot</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {plano.observacoes && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Observações</p>
          <p style={{ fontSize: 13, color: '#6B6560', lineHeight: 1.6 }}>{plano.observacoes}</p>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
