import { useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

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

export default function PagamentoRetorno() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const tipo       = params.get('tipo') || 'sucesso'
  const cfg        = configs[tipo] || configs.sucesso
  const Icon       = cfg.icon

  return (
    <div style={{ minHeight: '100vh', background: '#F7F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 400, width: '100%', background: '#FFFFFF', borderRadius: 20, padding: 40, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Icon size={36} color={cfg.cor} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 10 }}>{cfg.title}</h1>
        <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.6, marginBottom: 28 }}>{cfg.msg}</p>
        <button
          onClick={() => navigate(cfg.dest)}
          style={{ width: '100%', height: 44, borderRadius: 12, border: 'none', background: '#CC1A1A', color: '#FFFFFF', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          {cfg.btn}
        </button>
      </div>
    </div>
  )
}
