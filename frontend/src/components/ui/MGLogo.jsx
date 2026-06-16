export default function MGLogo({ size = 120 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center"
    >
      {/* Círculo externo com borda dourada/âmbar sutil */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, #1a0000 60%, #000 100%)',
          border: '2px solid rgba(180,120,40,0.35)',
          boxShadow: '0 0 40px rgba(220,30,30,0.2), inset 0 0 30px rgba(0,0,0,0.8)',
        }}
      />

      {/* Logo MG em SVG */}
      <svg
        viewBox="0 0 100 100"
        style={{ width: size * 0.72, height: size * 0.72, position: 'relative', zIndex: 1 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mg-red" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3333" />
            <stop offset="50%" stopColor="#cc0000" />
            <stop offset="100%" stopColor="#880000" />
          </linearGradient>
          <linearGradient id="mg-shine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Texto CENTRO DE TREINAMENTO pequeno no topo */}
        <text
          x="50" y="14"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          letterSpacing="1.5"
          fill="rgba(200,150,60,0.7)"
          fontFamily="system-ui, sans-serif"
          style={{ textTransform: 'uppercase' }}
        >
          CENTRO DE TREINAMENTO
        </text>

        {/* Seta/chevron esquerdo — M */}
        <polygon
          points="18,85 38,30 50,58 38,58"
          fill="url(#mg-red)"
        />
        {/* Seta/chevron direito — G */}
        <polygon
          points="82,85 62,30 50,58 62,58"
          fill="url(#mg-red)"
        />
        {/* Triângulo central — ponta */}
        <polygon
          points="50,72 38,58 62,58"
          fill="url(#mg-red)"
          opacity="0.85"
        />

        {/* Brilho sutil */}
        <polygon
          points="18,85 38,30 50,58 38,58"
          fill="url(#mg-shine)"
        />

        {/* Texto MG no centro */}
        <text
          x="50" y="55"
          textAnchor="middle"
          fontSize="18"
          fontWeight="900"
          fill="rgba(255,255,255,0.9)"
          fontFamily="system-ui, sans-serif"
          style={{ letterSpacing: '1px' }}
        >
          MG
        </text>
      </svg>
    </div>
  )
}
