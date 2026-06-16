import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useAvaliacaoStatus } from '../../hooks/useAvaliacao'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { APP } from '../../config/app'
import * as avaliacaoService from '../../services/avaliacao'

function OpcaoCard({ label, selecionado, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px 20px',
        borderRadius: 12,
        border: `2px solid ${selecionado ? '#CC1A1A' : '#E0D6CA'}`,
        background: selecionado ? 'rgba(204,26,26,0.06)' : '#FFFFFF',
        color: selecionado ? '#CC1A1A' : '#1A1A1A',
        fontWeight: selecionado ? 700 : 500,
        fontSize: 14,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {label}
      {selecionado && <Check size={16} strokeWidth={2.5} style={{ color: '#CC1A1A', flexShrink: 0 }} />}
    </button>
  )
}

export default function Onboarding() {
  const { usuario } = useAuthContext()
  const { revalidar } = useAvaliacaoStatus()
  const navigate = useNavigate()

  const [perguntas, setPerguntas] = useState([])
  const [step, setStep] = useState(0)
  const [respostas, setRespostas] = useState({})
  const [detalheStr, setDetalheStr] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    avaliacaoService.buscarPerguntas().then(setPerguntas)
  }, [])

  // Filtra lesao_detalhe — é tratada dentro do step de lesao
  const steps = perguntas.filter(p => p.codigo !== 'lesao_detalhe')
  const total = steps.length
  const pergunta = steps[step]

  function resposta(p) { return respostas[p?.id] }

  function setResp(id, valor) {
    setRespostas(prev => ({ ...prev, [id]: valor }))
  }

  function podeAvancar() {
    if (!pergunta) return false
    if (!pergunta.obrigatorio) return true
    const r = resposta(pergunta)
    if (pergunta.tipo === 'opcao') return r?.id_opcao != null
    if (pergunta.tipo === 'bool') return r?.bit != null
    if (pergunta.tipo === 'numero') return r?.numero != null && r.numero > 0
    return true
  }

  function avancar() {
    if (step < total - 1) setStep(s => s + 1)
    else submeter()
  }

  function voltar() { setStep(s => s - 1) }

  async function submeter() {
    setEnviando(true)
    setErro(null)
    try {
      const payload = Object.entries(respostas).map(([id_pergunta, r]) => ({
        id_pergunta: Number(id_pergunta),
        codigo: perguntas.find(p => p.id === Number(id_pergunta))?.codigo,
        resposta_bit:    r.bit    ?? null,
        resposta_texto:  r.texto  ?? null,
        resposta_numero: r.numero ?? null,
        id_opcao:        r.id_opcao ?? null,
        valor_texto:     r.valor_texto ?? null,
      }))

      // Adiciona lesao_detalhe se preenchido
      const pergLesao = perguntas.find(p => p.codigo === 'lesao')
      const pergDetalhe = perguntas.find(p => p.codigo === 'lesao_detalhe')
      if (pergLesao && pergDetalhe && respostas[pergLesao.id]?.bit === true && detalheStr.trim()) {
        payload.push({
          id_pergunta: pergDetalhe.id,
          codigo: 'lesao_detalhe',
          resposta_texto: detalheStr.trim(),
          resposta_bit: null, resposta_numero: null, id_opcao: null, valor_texto: null,
        })
      }

      await avaliacaoService.enviar(payload)
      await revalidar()
      navigate('/dashboard')
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (!pergunta) return null

  const progresso = ((step) / total) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#F0EBE4', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E0D6CA', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#CC1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#FFFFFF', fontSize: 12 }}>
            {APP.sigla}
          </div>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#1A1A1A', letterSpacing: '0.04em' }}>{APP.nome.toUpperCase()}</span>
        </div>
        <span style={{ fontSize: 12, color: '#8A7F76' }}>{step + 1} de {total}</span>
      </div>

      {/* Barra de progresso */}
      <div style={{ height: 3, background: '#E0D6CA' }}>
        <div style={{ height: '100%', width: `${progresso}%`, background: '#CC1A1A', transition: 'width 0.3s ease' }} />
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Saudação apenas no step 0 */}
          {step === 0 && (
            <p style={{ fontSize: 13, color: '#CC1A1A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
              Olá, {usuario?.nome?.split(' ')[0]} 👋
            </p>
          )}

          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', marginBottom: 8, lineHeight: 1.2 }}>
            {pergunta.pergunta}
          </h2>
          <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 28 }}>
            {step === 0 ? 'Vamos montar seu perfil de treino.' : 'Selecione a opção que melhor te descreve.'}
          </p>

          {/* Opções por tipo */}
          {pergunta.tipo === 'opcao' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pergunta.opcoes.map(op => (
                <OpcaoCard
                  key={op.id}
                  label={op.valor}
                  selecionado={resposta(pergunta)?.id_opcao === op.id}
                  onClick={() => setResp(pergunta.id, { id_opcao: op.id, valor_texto: op.valor })}
                />
              ))}
            </div>
          )}

          {pergunta.tipo === 'bool' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ label: 'Sim', valor: true }, { label: 'Não', valor: false }].map(op => (
                <OpcaoCard
                  key={op.label}
                  label={op.label}
                  selecionado={resposta(pergunta)?.bit === op.valor}
                  onClick={() => setResp(pergunta.id, { bit: op.valor })}
                />
              ))}
              {/* Campo detalhe condicional */}
              {pergunta.exibir_detalhe_sim && resposta(pergunta)?.bit === true && (
                <textarea
                  placeholder={pergunta.descricao_detalhe_sim || 'Descreva aqui...'}
                  value={detalheStr}
                  onChange={e => setDetalheStr(e.target.value)}
                  rows={3}
                  style={{ width: '100%', borderRadius: 12, border: '2px solid #E0D6CA', padding: '12px 16px', fontSize: 14, color: '#1A1A1A', resize: 'none', outline: 'none', marginTop: 4, background: '#FFFFFF', boxSizing: 'border-box' }}
                />
              )}
            </div>
          )}

          {pergunta.tipo === 'numero' && (
            <div>
              <input
                type="number"
                min={0}
                value={resposta(pergunta)?.numero ?? ''}
                onChange={e => setResp(pergunta.id, { numero: e.target.value ? Number(e.target.value) : null })}
                placeholder="0"
                style={{ width: '100%', height: 56, borderRadius: 12, border: '2px solid #E0D6CA', padding: '0 20px', fontSize: 22, fontWeight: 700, color: '#1A1A1A', outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = '#CC1A1A'}
                onBlur={e => e.target.style.borderColor = '#E0D6CA'}
              />
            </div>
          )}

          {erro && (
            <p style={{ marginTop: 16, color: '#CC1A1A', fontSize: 13, textAlign: 'center' }}>{erro}</p>
          )}

          {/* Navegação */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {step > 0 && (
              <button
                type="button"
                onClick={voltar}
                style={{ height: 52, paddingInline: 20, borderRadius: 12, border: '2px solid #E0D6CA', background: '#FFFFFF', color: '#6B6560', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
              >
                <ChevronLeft size={18} /> Voltar
              </button>
            )}
            <button
              type="button"
              onClick={avancar}
              disabled={!podeAvancar() || enviando}
              style={{
                flex: 1, height: 52, borderRadius: 12, border: 'none',
                background: podeAvancar() ? 'linear-gradient(135deg,#A81515,#CC1A1A)' : '#E0D6CA',
                color: podeAvancar() ? '#FFFFFF' : '#B0A89E',
                fontWeight: 800, fontSize: 14, cursor: podeAvancar() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.15s',
                boxShadow: podeAvancar() ? '0 4px 16px rgba(180,26,26,0.25)' : 'none',
              }}
            >
              {enviando ? 'Salvando...' : step < total - 1 ? <><span>Continuar</span><ChevronRight size={18} /></> : <><span>Concluir</span><Check size={18} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
