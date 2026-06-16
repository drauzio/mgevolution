import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dumbbell, Flame, Salad, Moon, Droplets, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  treino: z.boolean(),
  cardio: z.boolean(),
  dieta: z.number().min(0).max(100),
  sono: z.number().min(0).max(12),
  agua: z.number().min(0).max(6),
})

const historico = [
  { dia: 'Seg', score: 88 },
  { dia: 'Ter', score: 92 },
  { dia: 'Qua', score: 75 },
  { dia: 'Qui', score: 95 },
  { dia: 'Sex', score: 80 },
  { dia: 'Sab', score: 70 },
  { dia: 'Dom', score: 0 },
]

const categorias = [
  { key: 'treino', tipo: 'toggle', icon: Dumbbell, label: 'Treino',  desc: 'Fez o treino hoje?',       pts: 25, max: null, step: null, sufixo: null, cor: { icon: '#2563EB', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)' } },
  { key: 'cardio', tipo: 'toggle', icon: Flame,    label: 'Cardio',  desc: 'Fez cardio ou caminhada?', pts: 20, max: null, step: null, sufixo: null, cor: { icon: '#CC1A1A', bg: 'rgba(204,26,26,0.08)',  border: 'rgba(204,26,26,0.2)' } },
  { key: 'dieta',  tipo: 'range',  icon: Salad,    label: 'Dieta',   desc: 'Seguiu a dieta?',           pts: 25, max: 100, step: 1,    sufixo: '%',  cor: { icon: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)' } },
  { key: 'sono',   tipo: 'range',  icon: Moon,     label: 'Sono',    desc: 'Horas de sono',             pts: 15, max: 12,  step: 0.5,  sufixo: 'h',  cor: { icon: '#7C3AED', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' } },
  { key: 'agua',   tipo: 'range',  icon: Droplets, label: 'Água',    desc: 'Litros de água',            pts: 15, max: 6,   step: 0.5,  sufixo: 'L',  cor: { icon: '#0891B2', bg: 'rgba(8,145,178,0.08)',  border: 'rgba(8,145,178,0.2)' } },
]

function calcScore({ treino, cardio, dieta, sono, agua }) {
  return Math.round(
    (treino ? 25 : 0) +
    (cardio ? 20 : 0) +
    (dieta / 100) * 25 +
    Math.min(sono / 8, 1) * 15 +
    Math.min(agua / 3, 1) * 15
  )
}

export default function ShapeScore() {
  const [registrado, setRegistrado] = useState(false)

  const { register, handleSubmit, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { treino: false, cardio: false, dieta: 80, sono: 7, agua: 3 },
  })

  const valores = watch()
  const preview = calcScore(valores)

  function onSubmit(data) {
    setRegistrado(calcScore(data))
  }

  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
          Shape Score
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>
          Check-in diário — pequenas ações geram grandes resultados
        </p>
      </div>

      {/* Sucesso */}
      {registrado !== false && (
        <div style={{ background: 'rgba(204,26,26,0.07)', border: '1px solid rgba(204,26,26,0.2)', borderRadius: 20, padding: '32px 28px', textAlign: 'center' }}>
          <CheckCircle2 size={36} style={{ margin: '0 auto 14px', color: '#CC1A1A' }} />
          <p style={{ fontSize: 52, fontWeight: 900, color: '#1A1A1A', lineHeight: 1 }}>
            {registrado}
            <span style={{ fontSize: 18, color: '#8A7F76', fontWeight: 400 }}>/100</span>
          </p>
          <p style={{ color: '#CC1A1A', fontWeight: 700, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12 }}>
            Score registrado!
          </p>
        </div>
      )}

      {/* Card do formulário */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>

        {/* Preview score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #E0D6CA', background: '#FDFAF7' }}>
          <div>
            <p style={{ fontSize: 11, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4, fontWeight: 600 }}>Preview</p>
            <p style={{ fontSize: 13, color: '#B0A89E' }}>Score atual</p>
          </div>
          <p style={{ fontSize: 44, fontWeight: 900, color: '#CC1A1A', lineHeight: 1 }}>
            {preview}
            <span style={{ fontSize: 16, color: '#C4B9A8', fontWeight: 400 }}>/100</span>
          </p>
        </div>

        {/* Itens */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {categorias.map(({ key, tipo, icon: Icon, label, desc, pts, max, step, sufixo, cor }, idx) => (
            <div
              key={key}
              style={{
                paddingTop: idx === 0 ? 0 : 20,
                paddingBottom: 20,
                borderBottom: idx < categorias.length - 1 ? '1px solid #F0EBE4' : 'none',
              }}
            >
              {/* Linha principal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: cor.bg, border: `1px solid ${cor.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} color={cor.icon} strokeWidth={1.8} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 12, color: '#8A7F76' }}>
                    {desc} ·{' '}
                    <span style={{ color: cor.icon, fontWeight: 600 }}>{pts} pts</span>
                  </p>
                </div>

                {tipo === 'range' && (
                  <span style={{ fontSize: 15, fontWeight: 800, color: cor.icon, minWidth: 44, textAlign: 'right' }}>
                    {valores[key]}{sufixo}
                  </span>
                )}

                {tipo === 'toggle' && (
                  <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                    <input {...register(key)} type="checkbox" className="sr-only peer" />
                    <div
                      className="w-11 h-6 rounded-full peer peer-checked:bg-red-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"
                      style={{ background: '#E0D6CA' }}
                    />
                  </label>
                )}
              </div>

              {/* Slider */}
              {tipo === 'range' && (
                <div style={{ paddingLeft: 56, marginTop: 12 }}>
                  <input
                    {...register(key, { valueAsNumber: true })}
                    type="range" min="0" max={max} step={step}
                    className="w-full accent-red-600"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#C4B9A8' }}>0</span>
                    <span style={{ fontSize: 10, color: '#C4B9A8' }}>{max}{sufixo}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Botão */}
          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="w-full font-black text-white uppercase tracking-widest transition-all active:scale-[0.98]"
              style={{ height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', fontSize: 13, boxShadow: '0 4px 16px rgba(180,26,26,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
            >
              Registrar Check-in
            </button>
          </div>
        </form>
      </div>

      {/* Histórico semanal */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>
          Esta Semana
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {historico.map(({ dia, score }) => (
            <div key={dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', width: '100%', height: 64 }}>
                <div style={{ position: 'absolute', inset: 0, background: '#F0EBE4', borderRadius: 8 }} />
                {score > 0 && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 8,
                    height: `${score}%`,
                    background: score >= 90 ? '#CC1A1A' : score >= 70 ? '#E05050' : '#E89090',
                    transition: 'height 0.3s',
                  }} />
                )}
              </div>
              <span style={{ fontSize: 10, color: '#8A7F76', fontWeight: 600 }}>{dia}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: score > 0 ? '#1A1A1A' : '#C4B9A8' }}>{score || '–'}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
