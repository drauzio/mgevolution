import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, Dumbbell } from 'lucide-react'
import api from '../../services/api'
import { APP } from '../../config/app'

function LogoMG({ size = 96 }) {
  return (
    <img
      src="/logo_mg.png"
      alt="MG"
      style={{ width: size, height: size * 0.65, objectFit: 'contain', display: 'block', mixBlendMode: 'multiply', flexShrink: 0 }}
    />
  )
}

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [foco, setFoco] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (!email) return
    setErro(null)
    setCarregando(true)
    try {
      await api.post('/auth/esqueci-senha', { email })
      setEnviado(true)
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao enviar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F0EBE4' }}>

      {/* ── Painel esquerdo – branding (desktop) ── */}
      <div
        className="hidden lg:flex w-105 shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #D0C6BA 0%, #A89278 100%)' }}
      >
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mgSquaresEsq" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <rect x="8" y="8" width="108" height="108" rx="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mgSquaresEsq)"/>
        </svg>
        <div className="absolute right-0 inset-y-12 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(160,30,30,0.35), transparent)' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-10">
          <LogoMG size={240} />
          <div className="mt-9">
            <h1 className="text-[28px] font-black uppercase leading-[1.05] tracking-tight" style={{ color: '#1A1A1A' }}>
              Evolution
            </h1>
          </div>
          <div className="space-y-2" style={{ marginTop: 32 }}>
            {APP.slogan.map((w, i) => (
              <p
                key={w}
                className="text-[13px] font-bold uppercase tracking-[0.25em]"
                style={{ color: i === APP.slogan.length - 1 ? '#AA1515' : 'rgba(26,26,26,0.28)' }}
              >
                {w}.
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito – formulário ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div
        className="w-full max-w-md rounded-2xl"
        style={{ background: '#FFFFFF', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', padding: '44px 40px' }}
      >
        {/* Voltar */}
        {enviado ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={30} color="#16A34A" strokeWidth={1.8} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: '#1A1A1A', marginBottom: 12 }}>
              E-mail enviado!
            </h2>
            <p className="text-sm" style={{ color: '#6B6560', lineHeight: 1.6, marginBottom: 28 }}>
              Se o endereço <strong>{email}</strong> estiver cadastrado, você receberá as instruções para redefinir sua senha em breve.
            </p>
            <p className="text-xs" style={{ color: '#B0A89E', marginBottom: 24 }}>
              Não recebeu? Verifique a caixa de spam ou tente novamente.
            </p>
            <button
              onClick={() => { setEnviado(false); setEmail('') }}
              className="text-sm font-semibold transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CC1A1A' }}
            >
              Tentar com outro e-mail
            </button>
          </div>
        ) : (
          <>
            {/* Título */}
            <div style={{ marginBottom: 28 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <Dumbbell size={14} strokeWidth={2} style={{ color: '#CC1A1A' }} />
                <span className="text-[15px] font-bold uppercase tracking-[0.2em]" style={{ color: '#CC1A1A' }}>{APP.nome}</span>
              </div>
              <h2 className="text-[22px] font-black uppercase tracking-tight leading-none" style={{ color: '#1A1A1A', marginBottom: 8 }}>
                Esqueci minha senha
              </h2>
              <p className="text-sm" style={{ color: '#8A7F76', lineHeight: 1.5 }}>
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>E-mail</label>
                <div
                  className="flex overflow-hidden rounded-lg"
                  style={{ border: `1px solid ${foco ? '#CC1A1A' : '#E0D6CA'}`, transition: 'border-color 0.15s' }}
                  onFocus={() => setFoco(true)}
                  onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false) }}
                >
                  <div className="h-12 w-12 shrink-0 flex items-center justify-center" style={{ background: '#F7F3EE', borderRight: '1px solid #E0D6CA' }}>
                    <Mail size={16} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    style={{ flex: 1, height: 48, background: '#FFFFFF', border: 'none', outline: 'none', padding: '0 16px 0 10px', fontSize: 14, color: '#1A1A1A' }}
                  />
                </div>
              </div>

              {erro && (
                <div className="rounded-lg px-4 py-3 text-sm text-center" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A' }}>
                  {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={carregando || !email}
                className="w-full h-12 rounded-lg font-black text-[13px] text-white uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', boxShadow: '0 4px 16px rgba(180,26,26,0.3)' }}
                onMouseEnter={e => { if (!carregando) e.currentTarget.style.filter = 'brightness(1.08)' }}
                onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
              >
                {carregando ? 'Enviando...' : 'Enviar link de redefinição'}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            style={{ color: '#8A7F76' }}
            onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
            onMouseLeave={e => e.currentTarget.style.color = '#8A7F76'}
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Voltar ao login
          </Link>
        </div>

        <p className="text-center text-[11px] uppercase tracking-widest" style={{ marginTop: 20, color: '#B0A89E' }}>
          {APP.nome} · {APP.tagline}
        </p>
      </div>
      </div>
    </div>
  )
}
