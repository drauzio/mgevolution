import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { APP } from '../../config/app'
import { Mail, Lock, UsersRound, Eye, EyeOff, Dumbbell } from 'lucide-react'

const STORAGE_KEY = 'mg_lembrar_email'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
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

const inputClass = 'flex-1 h-12 bg-white text-gray-900 text-sm placeholder:text-gray-400 outline-none'
const labelClass = 'text-[11px] font-semibold text-gray-500 uppercase tracking-widest'

export default function Login() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const [erro, setErro] = useState(null)
  const [lembrar, setLembrar] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [verSenha, setVerSenha] = useState(false)
  const [focoEmail, setFocoEmail] = useState(false)
  const [focoSenha, setFocoSenha] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: localStorage.getItem(STORAGE_KEY) || '' },
  })

  async function onSubmit(data) {
    setErro(null)
    if (lembrar) localStorage.setItem(STORAGE_KEY, data.email)
    else localStorage.removeItem(STORAGE_KEY)
    try {
      const resultado = await login(data.email, data.senha)
      const perfil = resultado?.usuario?.perfil
      navigate(
        perfil === 'admin'          ? '/admin'       :
        perfil === 'personal'       ? '/personal'    :
        perfil === 'nutricionista'  ? '/nutri'        :
        '/dashboard'
      )
    } catch (e) {
      setErro(e.response?.data?.erro || 'E-mail ou senha inválidos')
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F0EBE4' }}>

      {/* ── Painel esquerdo – branding (desktop) ── */}
      <div
        className="hidden lg:flex w-105 shrink-0 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #D0C6BA 0%, #A89278 100%)' }}
      >
        {/* Grade de quadrados arredondados */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mgSquares" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <rect x="8" y="8" width="108" height="108" rx="18" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mgSquares)"/>
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div
          className="w-full max-w-95 rounded-2xl"
          style={{ background: '#FFFFFF', boxShadow: '0 8px 48px rgba(0,0,0,0.10)', padding: '44px 40px' }}
        >

          {/* Logo mobile */}
          <div className="flex flex-col items-center gap-4 mb-10 lg:hidden">
            <LogoMG size={120} />
            <div className="text-center">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: '#AA1515' }}>Centro de Treinamento</p>
              <h1 className="text-lg font-black uppercase tracking-tight mt-1" style={{ color: '#1A1A1A' }}>Márcio Gonçalves</h1>
            </div>
          </div>

          {/* Título */}
          <div style={{ marginBottom: 28 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
              <Dumbbell size={14} strokeWidth={2} style={{ color: '#CC1A1A' }} />
              <span className="text-[15px] font-bold uppercase tracking-[0.2em]" style={{ color: '#CC1A1A' }}>{APP.nome}</span>
            </div>
            <div className="flex items-center gap-3" style={{ marginBottom: 28 }}>
              <UsersRound size={40} strokeWidth={1.5} style={{ color: '#CC1A1A', flexShrink: 0 }} />
              <div>
                <h2 className="text-[22px] font-black uppercase tracking-tight leading-none" style={{ color: '#1A1A1A' }}>Entrar</h2>
                <p className="text-sm" style={{ marginTop: 6, color: '#8A7F76' }}>Acesse com suas credenciais</p>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            {/* E-mail */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>E-mail</label>
              <div
                className="flex overflow-hidden rounded-lg"
                style={{ border: `1px solid ${focoEmail ? '#CC1A1A' : '#E0D6CA'}`, transition: 'border-color 0.15s' }}
                onFocus={() => setFocoEmail(true)}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocoEmail(false) }}
              >
                <div className="h-12 shrink-0 flex items-center justify-center" style={{ background: '#F7F3EE', borderRight: '1px solid #E0D6CA', paddingLeft: 14, paddingRight: 12 }}>
                  <Mail size={16} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className={inputClass}
                  style={{ paddingLeft: 10, paddingRight: 16 }}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Senha</label>
              <div
                className="flex overflow-hidden rounded-lg"
                style={{ border: `1px solid ${focoSenha ? '#CC1A1A' : '#E0D6CA'}`, transition: 'border-color 0.15s' }}
                onFocus={() => setFocoSenha(true)}
                onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocoSenha(false) }}
              >
                <div className="h-12 shrink-0 flex items-center justify-center" style={{ background: '#F7F3EE', borderRight: '1px solid #E0D6CA', paddingLeft: 14, paddingRight: 12 }}>
                  <Lock size={16} strokeWidth={1.8} style={{ color: '#8A7F76' }} />
                </div>
                <input
                  {...register('senha')}
                  type={verSenha ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={inputClass}
                  style={{ paddingLeft: 10, paddingRight: 16 }}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(v => !v)}
                  className="h-12 w-11 shrink-0 flex items-center justify-center transition-colors"
                  style={{ background: '#FFFFFF', color: '#8A7F76' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1A1A1A' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8A7F76' }}
                >
                  {verSenha ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                </button>
              </div>
              {errors.senha && <p className="text-red-500 text-xs">{errors.senha.message}</p>}

              {/* Lembrar e-mail + Esqueci senha */}
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrar}
                    onChange={e => setLembrar(e.target.checked)}
                    className="accent-red-600 w-3.5 h-3.5"
                  />
                  <span style={{ fontSize: 12, color: '#8A7F76' }}>Lembrar e-mail</span>
                </label>
                <Link
                  to="/esqueci-senha"
                  style={{ fontSize: 12, color: '#8A7F76' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
                  onMouseLeave={e => e.currentTarget.style.color = '#8A7F76'}
                >
                  Esqueci minha senha
                </Link>
              </div>
            </div>

            {/* Erro geral */}
            {erro && (
              <div className="rounded-lg px-4 py-3 text-sm text-center" style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A' }}>
                {erro}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg font-black text-[13px] text-white uppercase tracking-widest transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', boxShadow: '0 4px 16px rgba(180,26,26,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm" style={{ marginTop: 24, color: '#8A7F76' }}>
            Não tem conta?{' '}
            <Link to="/cadastro" className="font-semibold transition-colors" style={{ color: '#CC1A1A' }}>
              Criar conta
            </Link>
          </p>

          <p className="text-center" style={{ marginTop: 16, fontSize: 12, color: '#B0A89E' }}>
            Contato:{' '}
            <a
              href="mailto:contato@mgevolution.com.br"
              style={{ color: '#8A7F76', textDecoration: 'underline' }}
              onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
              onMouseLeave={e => e.currentTarget.style.color = '#8A7F76'}
            >
              contato@mgevolution.com.br
            </a>
          </p>
        </div>

        <p style={{ marginTop: 24, fontSize: 11, color: '#B0A89E', textAlign: 'center' }}>
          Copyright © {new Date().getFullYear()} {APP.nome}. Todos os direitos reservados.{' · '}
          <Link to="/termos" style={{ color: '#B0A89E', textDecoration: 'underline' }}
            onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
            onMouseLeave={e => e.currentTarget.style.color = '#B0A89E'}
          >
            Termos de Uso
          </Link>
          {' · '}
          <Link to="/privacidade" style={{ color: '#B0A89E', textDecoration: 'underline' }}
            onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
            onMouseLeave={e => e.currentTarget.style.color = '#B0A89E'}
          >
            Política de Privacidade
          </Link>
          {' · '}
          <Link to="/suporte" style={{ color: '#B0A89E', textDecoration: 'underline' }}
            onMouseEnter={e => e.currentTarget.style.color = '#CC1A1A'}
            onMouseLeave={e => e.currentTarget.style.color = '#B0A89E'}
          >
            Suporte
          </Link>
        </p>
      </div>
    </div>
  )
}
