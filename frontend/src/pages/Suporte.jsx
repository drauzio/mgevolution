import { Link } from 'react-router-dom'
import { ArrowLeft, HeadphonesIcon, Mail, MessageCircle, FileText, Shield } from 'lucide-react'
import { APP } from '../config/app'

export default function Suporte() {
  return (
    <div style={{ minHeight: '100vh', background: '#F0EBE4' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>

        <Link
          to="/login"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#8A7F76', marginBottom: 40, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
          onMouseLeave={e => e.currentTarget.style.color = '#8A7F76'}
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Voltar ao login
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(204,26,26,0.1)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HeadphonesIcon size={22} style={{ color: '#CC1A1A' }} strokeWidth={1.6} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#CC1A1A', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 2 }}>{APP.nome}</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '-0.02em', lineHeight: 1 }}>Suporte</h1>
          </div>
        </div>

        <p style={{ fontSize: 14, color: '#8A7F76', marginBottom: 40, marginTop: 12, lineHeight: 1.6 }}>
          Precisa de ajuda? Entre em contato com nossa equipe pelos canais abaixo.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(204,26,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageCircle size={18} style={{ color: '#CC1A1A' }} strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>WhatsApp</p>
              <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.5, marginBottom: 8 }}>
                Atendimento rápido via WhatsApp para dúvidas sobre o aplicativo.
              </p>
              <a
                href={`https://wa.me/${APP.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Abrir WhatsApp
              </a>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(204,26,26,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={18} style={{ color: '#CC1A1A' }} strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>E-mail</p>
              <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.5, marginBottom: 8 }}>
                Envie um e-mail e nossa equipe responderá em até 1 dia útil.
              </p>
              <a
                href={`mailto:${APP.emailSuporte}`}
                style={{ fontSize: 13, fontWeight: 700, color: '#CC1A1A', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {APP.emailSuporte}
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <FileText size={16} style={{ color: '#CC1A1A' }} strokeWidth={1.8} />
                <p style={{ fontSize: 12, fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Termos de Uso</p>
              </div>
              <Link
                to="/termos"
                style={{ fontSize: 13, fontWeight: 600, color: '#CC1A1A', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Ler termos →
              </Link>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Shield size={16} style={{ color: '#CC1A1A' }} strokeWidth={1.8} />
                <p style={{ fontSize: 12, fontWeight: 800, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Privacidade</p>
              </div>
              <Link
                to="/privacidade"
                style={{ fontSize: 13, fontWeight: 600, color: '#CC1A1A', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Ler política →
              </Link>
            </div>
          </div>

        </div>

        <p style={{ marginTop: 48, fontSize: 12, color: '#B0A89E', textAlign: 'center' }}>
          © {new Date().getFullYear()} {APP.nome} · {APP.tagline}
        </p>
      </div>
    </div>
  )
}
