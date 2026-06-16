import { Share2, TrendingUp } from 'lucide-react'

const projecoes = [
  {
    label: 'Hoje',
    bf: '22%',
    massa: '72 kg',
    descricao: 'Início da jornada.',
    ativo: false,
    figuraAltura: 72,
  },
  {
    label: '90 dias',
    bf: '16%',
    massa: '75 kg',
    descricao: 'Composição corporal muda visivelmente com disciplina.',
    ativo: false,
    figuraAltura: 96,
  },
  {
    label: '180 dias',
    bf: '12%',
    massa: '77 kg',
    descricao: 'Definição muscular notável, energia elevada.',
    ativo: true,
    figuraAltura: 120,
  },
]

export default function ShapeFuture() {
  return (
    <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 8 }}>
          Shape Future IA
        </h1>
        <p style={{ fontSize: 14, color: '#8A7F76' }}>
          Sua projeção baseada no método MG e no seu Shape Score
        </p>
      </div>

      {/* Score base */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(204,26,26,0.08)', border: '1px solid rgba(204,26,26,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={18} color="#CC1A1A" strokeWidth={2} />
        </div>
        <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.5 }}>
          Projeção baseada no Shape Score médio de{' '}
          <span style={{ color: '#1A1A1A', fontWeight: 700 }}>86/100</span>
        </p>
      </div>

      {/* Cards de projeção */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
          {projecoes.map((p, i) => (
            <div
              key={p.label}
              style={{
                padding: '24px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                background: p.ativo ? 'rgba(204,26,26,0.06)' : 'transparent',
                borderLeft: i > 0 ? '1px solid #E0D6CA' : 'none',
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: p.ativo ? '#CC1A1A' : '#B0A89E' }}>
                {p.label}
              </p>
              <div>
                <p style={{ fontSize: 30, fontWeight: 900, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{p.bf}</p>
                <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>gordura</p>
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1A', lineHeight: 1, marginBottom: 4 }}>{p.massa}</p>
                <p style={{ fontSize: 10, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.1em' }}>massa</p>
              </div>
              <p style={{ fontSize: 11, color: '#8A7F76', lineHeight: 1.6 }}>{p.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Projeção visual */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 24 }}>
          Sua Projeção Visual
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {projecoes.map((p) => (
            <div key={p.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: '100%', aspectRatio: '3/5', background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: 16, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 16px' }}>
                <div style={{
                  width: 36,
                  height: p.figuraAltura,
                  borderRadius: 99,
                  background: p.ativo
                    ? 'linear-gradient(to top, #CC1A1A, rgba(204,26,26,0.25))'
                    : 'linear-gradient(to top, #C4B9A8, rgba(196,185,168,0.25))',
                  transition: 'height 0.3s',
                }} />
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: p.ativo ? '#CC1A1A' : '#B0A89E' }}>
                {p.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Compartilhar */}
      <button
        className="w-full flex items-center justify-center gap-2 font-black text-white uppercase tracking-widest transition-all active:scale-[0.98]"
        style={{ height: 50, borderRadius: 14, background: 'linear-gradient(135deg, #A81515 0%, #CC1A1A 100%)', fontSize: 13, boxShadow: '0 4px 16px rgba(180,26,26,0.25)' }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.08)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
      >
        <Share2 size={18} />
        Compartilhar minha projeção
      </button>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#C4B9A8', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        Powered by IA MG Evolution
      </p>
    </div>
  )
}
