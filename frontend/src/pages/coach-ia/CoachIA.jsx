import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, User, Trash2, Zap, Home } from 'lucide-react'
import api from '../../services/api'

const SUGESTOES = [
  'Analise meu protocolo de treino e dê sugestões de melhoria',
  'Estou progredindo bem nas cargas ou preciso ajustar algo?',
  'Como devo evoluir as cargas nos meus exercícios?',
  'O que comer antes e depois do treino?',
  'Como evitar o platô nos meus resultados?',
  'Como melhorar minha recuperação muscular?',
]

export default function CoachIA() {
  const navigate               = useNavigate()
  const [msgs, setMsgs]       = useState([])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [iniciando, setIniciando] = useState(true)
  const [nomeAluno, setNomeAluno] = useState('')
  const fimRef    = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    api.get('/coach-ia/iniciar')
      .then(({ data }) => {
        setNomeAluno(data.nome || '')
        setMsgs([{
          role: 'assistant',
          content: `Olá${data.nome ? `, ${data.nome.split(' ')[0]}` : ''}! Sou o Coach IA MG. Tenho acesso ao seu perfil — pergunte sobre treino, dieta, suplementação ou recuperação.`,
        }])
      })
      .catch(() => {
        setMsgs([{
          role: 'assistant',
          content: 'Olá! Sou o Coach IA MG. Pergunte sobre treino, dieta, suplementação ou recuperação.',
        }])
      })
      .finally(() => setIniciando(false))
  }, [])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  async function enviar(texto) {
    const msg = (texto || input).trim()
    if (!msg || loading) return
    setInput('')
    setMsgs(p => [...p, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const { data } = await api.post('/coach-ia/chat', { mensagem: msg })
      setMsgs(p => [...p, { role: 'assistant', content: data.resposta }])
    } catch {
      setMsgs(p => [...p, { role: 'assistant', content: 'Erro ao processar. Tente novamente.' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  async function limpar() {
    await api.delete('/coach-ia/sessao').catch(() => {})
    // reinicia
    setMsgs([])
    setIniciando(true)
    api.get('/coach-ia/iniciar')
      .then(({ data }) => {
        setNomeAluno(data.nome || '')
        setMsgs([{
          role: 'assistant',
          content: `Conversa reiniciada! Como posso te ajudar${data.nome ? `, ${data.nome.split(' ')[0]}` : ''}?`,
        }])
      })
      .finally(() => setIniciando(false))
  }

  function formatarMensagem(texto) {
    return texto.split('\n').map((linha, i) => {
      const partes = linha.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i} style={{ display: 'block', marginBottom: linha.trim() === '' ? 6 : 0 }}>
          {partes.map((p, j) =>
            j % 2 === 1
              ? <strong key={j}>{p}</strong>
              : p
          )}
        </span>
      )
    })
  }

  const temMensagens = msgs.length > 1

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 212px)' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>IA Coach</h1>
          <p style={{ fontSize: 14, color: '#8A7F76' }}>
            {nomeAluno ? `Personalizado para ${nomeAluno.split(' ')[0]}` : 'Método Márcio Gonçalves'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 12, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', color: '#6B6560', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <Home size={13} />
            Home
          </button>
          {temMensagens && (
            <button
              onClick={limpar}
              title="Limpar conversa"
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, paddingInline: 12, borderRadius: 10, border: '1px solid #E0D6CA', background: '#FFFFFF', color: '#A09890', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Trash2 size={13} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Container do chat */}
      <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)', minHeight: 0 }}>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {iniciando ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #E0D6CA', borderTopColor: '#CC1A1A', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              {msgs.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: m.role === 'assistant' ? 'rgba(204,26,26,0.1)' : '#F0EBE4', border: m.role === 'assistant' ? '1px solid rgba(204,26,26,0.2)' : '1px solid #E0D6CA' }}>
                    {m.role === 'assistant' ? <Bot size={14} color="#CC1A1A" /> : <User size={14} color="#8A7F76" />}
                  </div>
                  <div style={{ maxWidth: '78%', padding: '10px 13px', borderRadius: m.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px', fontSize: 12, lineHeight: 1.6, background: m.role === 'assistant' ? '#F7F3EE' : '#CC1A1A', color: m.role === 'assistant' ? '#1A1A1A' : '#FFFFFF', border: m.role === 'assistant' ? '1px solid #E0D6CA' : 'none' }}>
                    {m.role === 'assistant' ? formatarMensagem(m.content) : m.content}
                  </div>
                </div>
              ))}

              {/* Sugestões — só na primeira mensagem */}
              {msgs.length === 1 && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#C4B9A8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>Sugestões</p>
                  {SUGESTOES.map(s => (
                    <button
                      key={s}
                      onClick={() => enviar(s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 12, border: '1px solid #E0D6CA', background: '#FAFAF9', color: '#6B6560', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Zap size={12} color="#CC1A1A" style={{ flexShrink: 0 }} />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Digitando */}
              {loading && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.2)' }}>
                    <Bot size={14} color="#CC1A1A" />
                  </div>
                  <div style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: '4px 16px 16px 16px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 150, 300].map(d => (
                      <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: '#CC1A1A', animation: `bounce 1.2s ${d}ms infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={fimRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={e => { e.preventDefault(); enviar() }}
          style={{ padding: '12px 14px', borderTop: '1px solid #E0D6CA', display: 'flex', gap: 10, background: '#FDFAF7', flexShrink: 0 }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte ao Coach IA..."
            disabled={loading || iniciando}
            style={{ flex: 1, height: 44, borderRadius: 12, paddingInline: 16, fontSize: 14, color: '#1A1A1A', background: '#FFFFFF', border: '1px solid #E0D6CA', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#CC1A1A'}
            onBlur={e => e.target.style.borderColor = '#E0D6CA'}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || iniciando}
            style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', opacity: (!input.trim() || loading) ? 0.4 : 1, boxShadow: '0 2px 8px rgba(180,26,26,0.25)' }}
          >
            <Send size={15} color="#FFFFFF" />
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
      `}</style>
    </div>
  )
}
