import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User } from 'lucide-react'
import api from '../../services/api'

const INIT = [
  {
    role: 'assistant',
    content: 'Olá! Sou o Coach IA MG, baseado no método do Márcio Gonçalves. Pode me perguntar sobre treino, dieta, suplementação, cardio ou qualquer dúvida da sua jornada. Como posso te ajudar hoje?',
  },
]

export default function CoachIA() {
  const [msgs, setMsgs] = useState(INIT)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const fimRef = useRef(null)

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  async function enviar(e) {
    e.preventDefault()
    const texto = input.trim()
    if (!texto || loading) return
    setInput('')
    setMsgs((p) => [...p, { role: 'user', content: texto }])
    setLoading(true)
    try {
      const { data } = await api.post('/coach-ia/chat', { mensagem: texto })
      setMsgs((p) => [...p, { role: 'assistant', content: data.resposta }])
    } catch {
      setMsgs((p) => [...p, { role: 'assistant', content: 'Erro ao processar. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 9rem)' }}
      className="lg:h-[calc(100dvh-4rem)]"
    >
      {/* Cabeçalho */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
          IA Coach
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>Baseado no método do Márcio Gonçalves</p>
      </div>

      {/* Container do chat */}
      <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>

        {/* Mensagens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}
            >
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: m.role === 'assistant' ? 'rgba(204,26,26,0.1)' : '#F0EBE4',
                border: m.role === 'assistant' ? '1px solid rgba(204,26,26,0.2)' : '1px solid #E0D6CA',
              }}>
                {m.role === 'assistant'
                  ? <Bot size={15} color="#CC1A1A" />
                  : <User size={15} color="#8A7F76" />
                }
              </div>

              {/* Balão */}
              <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: m.role === 'assistant' ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
                fontSize: 14,
                lineHeight: 1.6,
                background: m.role === 'assistant' ? '#F7F3EE' : '#CC1A1A',
                color: m.role === 'assistant' ? '#1A1A1A' : '#FFFFFF',
                border: m.role === 'assistant' ? '1px solid #E0D6CA' : 'none',
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {/* Digitando */}
          {loading && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.2)' }}>
                <Bot size={15} color="#CC1A1A" />
              </div>
              <div style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: '4px 18px 18px 18px', padding: '12px 18px', display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 150, 300].map((d) => (
                  <div
                    key={d}
                    className="animate-bounce"
                    style={{ width: 7, height: 7, borderRadius: '50%', background: '#CC1A1A', animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={fimRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={enviar}
          style={{ padding: '14px 16px', borderTop: '1px solid #E0D6CA', display: 'flex', gap: 10, background: '#FDFAF7' }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua dúvida..."
            style={{
              flex: 1, height: 44, borderRadius: 12, paddingLeft: 16, paddingRight: 16,
              fontSize: 14, color: '#1A1A1A', background: '#FFFFFF',
              border: '1px solid #E0D6CA', outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#CC1A1A'}
            onBlur={e => e.target.style.borderColor = '#E0D6CA'}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', opacity: (!input.trim() || loading) ? 0.4 : 1,
              transition: 'opacity 0.2s, filter 0.2s',
              boxShadow: '0 2px 8px rgba(180,26,26,0.25)',
            }}
            onMouseEnter={e => { if (input.trim() && !loading) e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
          >
            <Send size={15} color="#FFFFFF" />
          </button>
        </form>
      </div>
    </div>
  )
}
