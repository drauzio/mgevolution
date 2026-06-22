import { useState, useRef, useEffect } from 'react'
import { Bell, Dumbbell, Salad, ClipboardList, Calendar, AlertCircle, MessageSquare, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useSWR, { mutate as swrMutate } from 'swr'
import { buscarNotificacoes, marcarLida } from '../../services/notificacoes'

const TIPO_CONFIG = {
  checkin:    { Icon: Calendar,      cor: '#CC1A1A' },
  treino:     { Icon: Dumbbell,      cor: '#2563EB' },
  dieta:      { Icon: Salad,         cor: '#16A34A' },
  solicitacao: { Icon: ClipboardList, cor: '#CC8800' },
  avaliacao:  { Icon: ClipboardList, cor: '#7C3AED' },
  admin:      { Icon: MessageSquare, cor: '#CC1A1A' },
}

export default function NotificacaoBell() {
  const [aberto, setAberto] = useState(false)
  const ref = useRef()
  const navigate = useNavigate()

  const { data } = useSWR('notificacoes', buscarNotificacoes, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  })

  const total = data?.total ?? 0
  const itens = data?.itens ?? []

  useEffect(() => {
    function fechar(e) {
      if (ref.current && !ref.current.contains(e.target)) setAberto(false)
    }
    document.addEventListener('mousedown', fechar)
    return () => document.removeEventListener('mousedown', fechar)
  }, [])

  function irPara(item) {
    if (item.id_notificacao_aluno && !item.lida) {
      marcarLida(item.id_notificacao_aluno).catch(() => {})
    }
    setAberto(false)
    if (item.link) navigate(item.link)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(a => !a)}
        style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: aberto ? '#F0EBE4' : '#F7F3EE',
          border: `1px solid ${aberto ? '#C4B9A8' : '#E0D6CA'}`,
          color: aberto ? '#1A1A1A' : '#8A7F76',
          cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
        }}
      >
        <Bell size={16} strokeWidth={1.8} />
        {total > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5,
            minWidth: 17, height: 17, borderRadius: 9,
            background: '#CC1A1A', color: '#FFFFFF',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            paddingInline: 3, lineHeight: 1,
            border: '2px solid #FFFFFF',
            pointerEvents: 'none',
          }}>
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {aberto && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 300, borderRadius: 14,
          background: '#FFFFFF', border: '1px solid #E0D6CA',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
              Notificações {total > 0 && <span style={{ fontWeight: 400, color: '#8A7F76' }}>({total})</span>}
            </p>
            <button
              onClick={async () => {
                const naoLidas = itens.filter(n => n.tipo === 'admin' && n.id_notificacao_aluno && !n.lida)
                await Promise.all(naoLidas.map(n => marcarLida(n.id_notificacao_aluno).catch(() => {})))
                if (naoLidas.length > 0) {
                  swrMutate('notificacoes')
                  swrMutate('notif-enviadas')
                }
                setAberto(false)
              }}
              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#F0EBE4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={13} color="#8A7F76" />
            </button>
          </div>

          {itens.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <Bell size={28} color="#C4B9A8" strokeWidth={1.5} style={{ margin: '0 auto 10px', display: 'block' }} />
              <p style={{ fontSize: 13, color: '#B0A89E', margin: 0, fontWeight: 500 }}>Tudo em dia!</p>
              <p style={{ fontSize: 11, color: '#C4B9A8', margin: '4px 0 0' }}>Nenhuma notificação pendente</p>
            </div>
          ) : (
            <div>
              {itens.map((item, i) => {
                const cfg = TIPO_CONFIG[item.tipo] || { Icon: AlertCircle, cor: '#8A7F76' }
                return (
                  <button
                    key={i}
                    onClick={() => irPara(item)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'flex-start',
                      gap: 12, padding: '12px 16px',
                      background: 'transparent', border: 'none',
                      borderBottom: i < itens.length - 1 ? '1px solid #F7F3EE' : 'none',
                      cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F7F3EE' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: cfg.cor + '14',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <cfg.Icon size={15} color={cfg.cor} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.2 }}>
                          {item.titulo}
                        </p>
                        {item.urgente && (
                          <span style={{
                            width: 6, height: 6, borderRadius: 3,
                            background: '#CC1A1A', flexShrink: 0, display: 'inline-block',
                          }} />
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#8A7F76', margin: 0, lineHeight: 1.4 }}>
                        {item.descricao}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
