import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'
import { buscarStatus } from '../services/checkout'

const configs = {
  sucesso: {
    icon:  CheckCircle,
    cor:   '#15803d',
    bg:    'rgba(34,197,94,0.08)',
    title: 'Pagamento confirmado!',
    msg:   'Sua assinatura foi ativada. Bem-vindo ao MG Evolution!',
    btn:   'Acessar o app',
    dest:  '/dashboard',
  },
  falhou: {
    icon:  XCircle,
    cor:   '#CC1A1A',
    bg:    'rgba(204,26,26,0.08)',
    title: 'Pagamento não aprovado',
    msg:   'Ocorreu um problema com seu pagamento. Tente novamente.',
    btn:   'Tentar novamente',
    dest:  '/assinar',
  },
  pendente: {
    icon:  Clock,
    cor:   '#B45309',
    bg:    'rgba(251,191,36,0.12)',
    title: 'Pagamento em análise',
    msg:   'Seu pagamento está sendo processado. Assim que confirmado, seu acesso será liberado.',
    btn:   'Ir para o app',
    dest:  '/dashboard',
  },
}

// O tipo é definido pelo path da rota (/pagamento/sucesso|falhou|pendente),
// nunca por query param — o Mercado Pago não envia ?tipo= nas back_urls.
function tipoPorPath(pathname) {
  if (pathname.includes('falhou'))   return 'falhou'
  if (pathname.includes('pendente')) return 'pendente'
  return 'sucesso'
}

export default function PagamentoRetorno() {
  const location = useLocation()
  const navigate = useNavigate()
  const tipoRota = tipoPorPath(location.pathname)

  const [tipo, setTipo]               = useState(tipoRota)
  const [verificando, setVerificando] = useState(tipoRota === 'sucesso')

  // Quando o retorno indica sucesso, confirma no backend antes de exibir a
  // mensagem — o webhook do Mercado Pago é assíncrono e pode ainda não ter
  // ativado a assinatura no momento do redirecionamento.
  useEffect(() => {
    if (tipoRota !== 'sucesso') return
    let ativo = true
    buscarStatus()
      .then(status => {
        if (!ativo) return
        if (status?.status !== 'ativa') setTipo('pendente')
      })
      .catch(() => { if (ativo) setTipo('pendente') })
      .finally(() => { if (ativo) setVerificando(false) })
    return () => { ativo = false }
  }, [tipoRota])

  const cfg  = configs[tipo] || configs.sucesso
  const Icon = verificando ? Loader2 : cfg.icon

  return (
    <div style={{ minHeight: '100vh', background: '#F7F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#FFFFFF', borderRadius: 20, padding: 40, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: verificando ? 'rgba(180,83,9,0.08)' : cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon size={36} color={verificando ? '#B45309' : cfg.cor} style={verificando ? { animation: 'spin 1s linear infinite' } : undefined} />
        </div>
        {verificando ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 10 }}>Confirmando pagamento…</h1>
            <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.6 }}>Aguarde um instante enquanto verificamos o status.</p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 10 }}>{cfg.title}</h1>
            <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.6, marginBottom: 28 }}>{cfg.msg}</p>
            <button
              onClick={() => navigate(cfg.dest)}
              style={{ width: '100%', height: 44, borderRadius: 12, border: 'none', background: '#CC1A1A', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {cfg.btn}
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
