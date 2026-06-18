import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Mail, Lock, UserRound, UsersRound, Phone, Dumbbell, Check, ShieldCheck } from 'lucide-react'
import api from '../../services/api'
import { APP } from '../../config/app'

const schema = z.object({
  nome:      z.string().min(3, 'Nome obrigatório'),
  email:     z.string().email('E-mail inválido'),
  telefone:  z.string().min(10, 'Telefone inválido').max(20),
  senha:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string(),
}).refine(d => d.senha === d.confirmar, {
  message: 'Senhas não coincidem',
  path: ['confirmar'],
})

function LogoMG({ size = 96 }) {
  return (
    <img
      src="/logo_mg.png"
      alt="MG"
      style={{ width: size, height: size * 0.65, objectFit: 'contain', display: 'block', mixBlendMode: 'multiply', flexShrink: 0 }}
    />
  )
}

function Campo({ icon: Icon, error, children, extra }) {
  const [foco, setFoco] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          display: 'flex', overflow: 'hidden', borderRadius: 8,
          border: `1px solid ${foco ? '#CC1A1A' : '#E0D6CA'}`,
          transition: 'border-color 0.15s',
        }}
        onFocus={() => setFoco(true)}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false) }}
      >
        <div style={{ height: 40, width: 40, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F3EE', borderRight: '1px solid #E0D6CA' }}>
          <Icon size={15} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
        </div>
        {children}
        {extra}
      </div>
      {error && <p style={{ fontSize: 11, color: '#EF4444', paddingLeft: 4 }}>{error}</p>}
    </div>
  )
}

const inputStyle = {
  flex: 1, height: 40, background: '#FFFFFF', border: 'none', outline: 'none',
  padding: '0 12px', fontSize: 14, color: '#1A1A1A',
}

// ── OTP: 6 caixinhas individuais ──────────────────────────────────────────────
function OTPInput({ onComplete }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef([])

  const handle = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
    if (next.every(d => d !== '')) onComplete(next.join(''))
  }

  const handleKey = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus()
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setDigits(text.split(''))
      refs.current[5]?.focus()
      onComplete(text)
    }
    e.preventDefault()
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          value={d}
          maxLength={1}
          inputMode="numeric"
          onChange={e => handle(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: 44, height: 52, borderRadius: 10, textAlign: 'center',
            fontSize: 22, fontWeight: 800, color: '#1A1A1A',
            border: `2px solid ${d ? '#CC1A1A' : '#E0D6CA'}`,
            outline: 'none', background: d ? '#FEF2F2' : '#FDFCFB',
            transition: 'all 0.12s',
          }}
          onFocus={e => e.target.style.borderColor = '#CC1A1A'}
          onBlur={e => e.target.style.borderColor = digits[i] ? '#CC1A1A' : '#E0D6CA'}
        />
      ))}
    </div>
  )
}

function Countdown({ segundos, onZero }) {
  const [restam, setRestam] = useState(segundos)
  useEffect(() => {
    setRestam(segundos)
    const t = setInterval(() => setRestam(s => {
      if (s <= 1) { clearInterval(t); onZero(); return 0 }
      return s - 1
    }), 1000)
    return () => clearInterval(t)
  }, [segundos])
  if (restam === 0) return null
  return <span style={{ fontSize: 12, color: '#B0A89E' }}>Reenviar em {restam}s</span>
}

export default function Cadastro() {
  const navigate  = useNavigate()
  const [erro, setErro]   = useState(null)

  // OTP state
  const [faseOTP,    setFaseOTP]    = useState('idle')   // idle | enviando | aguardando | verificando | ok
  const [erroOTP,    setErroOTP]    = useState(null)
  const [tokenOTP,   setTokenOTP]   = useState(null)
  const [countdown,  setCountdown]  = useState(0)
  const [podeReenviar, setPodeReenviar] = useState(false)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const telefone = watch('telefone', '')
  const telefoneValido = telefone.replace(/\D/g, '').length >= 10

  async function enviarOTP() {
    if (!telefoneValido) return
    setFaseOTP('enviando')
    setErroOTP(null)
    setPodeReenviar(false)
    try {
      await api.post('/auth/otp/enviar', { telefone })
      setFaseOTP('aguardando')
      setCountdown(60)
    } catch (e) {
      const aguardar = e.response?.data?.aguardar
      if (aguardar) {
        setFaseOTP('aguardando')
        setCountdown(aguardar)
      } else {
        setFaseOTP('idle')
        setErroOTP(e.response?.data?.erro || 'Erro ao enviar código')
      }
    }
  }

  async function verificarOTP(codigo) {
    setFaseOTP('verificando')
    setErroOTP(null)
    try {
      const r = await api.post('/auth/otp/verificar', { telefone, codigo })
      setTokenOTP(r.data.token)
      setFaseOTP('ok')
    } catch (e) {
      setErroOTP(e.response?.data?.erro || 'Código incorreto')
      setFaseOTP('aguardando')
    }
  }

  async function onSubmit(data) {
    if (faseOTP !== 'ok') { setErro('Verifique seu WhatsApp antes de continuar'); return }
    setErro(null)
    try {
      await api.post('/auth/registro', {
        nome:      data.nome,
        email:     data.email,
        telefone:  data.telefone,
        senha:     data.senha,
        token_otp: tokenOTP,
      })
      navigate('/login?cadastrado=1')
    } catch (e) {
      setErro(e.response?.data?.erro || 'Erro ao criar conta')
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
            <pattern id="mgSquaresCad" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <rect x="8" y="8" width="108" height="108" rx="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mgSquaresCad)"/>
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
              <p key={w} className="text-[13px] font-bold uppercase tracking-[0.25em]"
                style={{ color: i === APP.slogan.length - 1 ? '#AA1515' : 'rgba(26,26,26,0.28)' }}>
                {w}.
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Painel direito – formulário ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-[380px] rounded-2xl"
          style={{ background: '#FFFFFF', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', padding: '36px 36px' }}
        >

          {/* Logo mobile */}
          <div className="flex flex-col items-center gap-4 mb-8 lg:hidden">
            <LogoMG size={120} />
            <div className="text-center">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: '#AA1515' }}>Centro de Treinamento</p>
              <h1 className="text-lg font-black uppercase tracking-tight mt-1" style={{ color: '#1A1A1A' }}>Márcio Gonçalves</h1>
            </div>
          </div>

          {/* Título */}
          <div style={{ marginBottom: 22 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <Dumbbell size={14} strokeWidth={2} style={{ color: '#CC1A1A' }} />
              <span className="text-[15px] font-bold uppercase tracking-[0.2em]" style={{ color: '#CC1A1A' }}>{APP.nome}</span>
            </div>
            <div className="flex items-center gap-3">
              <UsersRound size={34} strokeWidth={1.5} style={{ color: '#CC1A1A', flexShrink: 0 }} />
              <div>
                <h2 className="text-[20px] font-black uppercase tracking-tight leading-none" style={{ color: '#1A1A1A' }}>Criar conta</h2>
                <p className="text-xs" style={{ marginTop: 5, color: '#8A7F76' }}>Comece sua transformação agora</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <Campo icon={UserRound} error={errors.nome?.message}>
              <input {...register('nome')} type="text" placeholder="Nome completo" autoComplete="name" style={inputStyle} />
            </Campo>

            <Campo icon={Mail} error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="E-mail" autoComplete="email" style={inputStyle} />
            </Campo>

            {/* ── Campo telefone + botão verificar ── */}
            <Campo
              icon={faseOTP === 'ok' ? Check : Phone}
              error={errors.telefone?.message || erroOTP}
              extra={
                faseOTP !== 'ok' && (
                  <button
                    type="button"
                    onClick={enviarOTP}
                    disabled={!telefoneValido || faseOTP === 'enviando' || faseOTP === 'verificando' || (faseOTP === 'aguardando' && !podeReenviar)}
                    style={{
                      flexShrink: 0, height: 40, paddingInline: 12, border: 'none',
                      borderLeft: '1px solid #E0D6CA',
                      background: '#F7F3EE', fontSize: 12, fontWeight: 700,
                      color: telefoneValido ? '#CC1A1A' : '#B0A89E',
                      cursor: telefoneValido ? 'pointer' : 'default',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {faseOTP === 'enviando' ? 'Enviando…' : faseOTP === 'aguardando' && !podeReenviar ? '•••' : 'Verificar'}
                  </button>
                )
              }
            >
              <input
                {...register('telefone')}
                type="tel"
                placeholder="WhatsApp (62) 99999-9999"
                autoComplete="tel"
                disabled={faseOTP === 'ok'}
                style={{
                  ...inputStyle,
                  color: faseOTP === 'ok' ? '#15803d' : '#1A1A1A',
                  fontWeight: faseOTP === 'ok' ? 700 : 400,
                }}
              />
            </Campo>

            {/* ── Painel OTP ── */}
            {(faseOTP === 'aguardando' || faseOTP === 'verificando') && (
              <div style={{ background: '#FDFAF7', border: '1px solid #E8E2DC', borderRadius: 10, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldCheck size={15} color="#CC1A1A" />
                  <p style={{ fontSize: 12, color: '#6B6560' }}>
                    Código enviado para <strong>{telefone}</strong>
                  </p>
                </div>

                <OTPInput onComplete={verificarOTP} key={faseOTP === 'aguardando' ? 'input' : 'verif'} />

                {faseOTP === 'verificando' && (
                  <p style={{ fontSize: 12, color: '#8A7F76', textAlign: 'center' }}>Verificando…</p>
                )}

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {podeReenviar
                    ? <button type="button" onClick={enviarOTP} style={{ fontSize: 12, color: '#CC1A1A', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                        Reenviar código
                      </button>
                    : <Countdown segundos={countdown} onZero={() => setPodeReenviar(true)} />
                  }
                </div>
              </div>
            )}

            {/* ── Confirmação de telefone verificado ── */}
            {faseOTP === 'ok' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8 }}>
                <Check size={14} color="#15803d" />
                <p style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Telefone verificado com sucesso</p>
              </div>
            )}

            <Campo icon={Lock} error={errors.senha?.message}>
              <input {...register('senha')} type="password" placeholder="Senha (mín. 6 caracteres)" style={inputStyle} />
            </Campo>

            <Campo icon={Lock} error={errors.confirmar?.message}>
              <input {...register('confirmar')} type="password" placeholder="Confirmar senha" style={inputStyle} />
            </Campo>

            {erro && (
              <div style={{ borderRadius: 8, padding: '10px 12px', fontSize: 12, textAlign: 'center', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A' }}>
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || faseOTP !== 'ok'}
              className="w-full rounded-lg font-black text-[12px] text-white uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ marginTop: 4, height: 40, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', boxShadow: '0 4px 16px rgba(180,26,26,0.3)', border: 'none', cursor: faseOTP === 'ok' ? 'pointer' : 'not-allowed' }}
              onMouseEnter={e => faseOTP === 'ok' && (e.currentTarget.style.filter = 'brightness(1.08)')}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm" style={{ marginTop: 18, color: '#8A7F76' }}>
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold" style={{ color: '#CC1A1A' }}>Entrar</Link>
          </p>

          <p className="text-center text-[11px] uppercase tracking-widest" style={{ marginTop: 16, color: '#B0A89E' }}>
            {APP.nome} · {APP.tagline}
          </p>
        </div>
      </div>
    </div>
  )
}
