import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useSWR from 'swr'
import { ShieldCheck, Loader2, CheckCircle2, Copy, Check, ArrowLeft, QrCode } from 'lucide-react'
import { buscarPlanos, buscarConfig, pagar } from '../services/checkout'

function duracaoLabel(dias) {
  if (dias <= 30)  return 'Mensal'
  if (dias <= 60)  return 'Bimestral'
  if (dias <= 90)  return 'Trimestral'
  if (dias <= 180) return 'Semestral'
  return 'Anual'
}

function carregarSdk() {
  return new Promise((resolve) => {
    if (window.MercadoPago) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://sdk.mercadopago.com/js/v2'
    s.onload = resolve
    document.body.appendChild(s)
  })
}

export default function Assinar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const idPlanoPre = searchParams.get('id_plano')

  const { data: planos = [], isLoading: carregandoPlanos } = useSWR('planos-publicos', buscarPlanos)

  const [fase, setFase]                   = useState('planos') // planos | pagamento | sucesso | pix
  const [planoSelecionado, setPlano]      = useState(null)
  const [pixData, setPixData]             = useState(null)
  const [copiado, setCopiado]             = useState(false)
  const [erroBrick, setErroBrick]         = useState(null)
  const [brickPronto, setBrickPronto]     = useState(false)
  const controllerRef                     = useRef(null)

  const planosAtivos = planos.filter(p => p.ativo)

  // Se veio com ?id_plano=X, pula direto para o brick
  useEffect(() => {
    if (!idPlanoPre || !planosAtivos.length) return
    const plano = planosAtivos.find(p => String(p.id_plano) === String(idPlanoPre))
    if (plano) iniciarPagamento(plano)
  }, [idPlanoPre, planosAtivos.length])

  async function iniciarPagamento(plano) {
    setPlano(plano)
    setErroBrick(null)
    setBrickPronto(false)
    setFase('pagamento')
  }

  // Inicializa o Brick quando fase muda para 'pagamento'
  useEffect(() => {
    if (fase !== 'pagamento' || !planoSelecionado) return

    let ativo = true

    async function init() {
      try {
        const cfg = await buscarConfig()
        if (!ativo) return

        await carregarSdk()
        if (!ativo) return

        const mp = new window.MercadoPago(cfg.public_key, { locale: 'pt-BR' })
        const bricksBuilder = mp.bricks()

        const controller = await bricksBuilder.create('payment', 'mp-brick-container', {
          initialization: {
            amount: Number(planoSelecionado.preco),
            payer:  { email: cfg.email },
          },
          customization: {
            paymentMethods: {
              creditCard:   'all',
              debitCard:    'all',
              bankTransfer: 'all',
            },
            visual: {
              style:         { theme: 'flat' },
              hideFormTitle: true,
            },
          },
          callbacks: {
            onReady: () => { if (ativo) setBrickPronto(true) },
            onSubmit: ({ formData }) => {
              return pagar(planoSelecionado.id_plano, formData).then(result => {
                if (!ativo) return
                if (result.status === 'approved') {
                  setFase('sucesso')
                } else if (result.status === 'pending' && result.qr_code) {
                  setPixData(result)
                  setFase('pix')
                } else {
                  setErroBrick('Pagamento não aprovado. Verifique os dados e tente novamente.')
                }
              }).catch(() => {
                if (ativo) setErroBrick('Erro ao processar pagamento. Tente novamente.')
                throw new Error('payment_error')
              })
            },
            onError: () => {
              if (ativo) setErroBrick('Erro no formulário de pagamento.')
            },
          },
        })

        if (ativo) controllerRef.current = controller
      } catch {
        if (ativo) setErroBrick('Não foi possível carregar o checkout. Recarregue a página.')
      }
    }

    init()

    return () => {
      ativo = false
      controllerRef.current?.unmount()
      controllerRef.current = null
    }
  }, [fase, planoSelecionado])

  function voltar() {
    controllerRef.current?.unmount()
    controllerRef.current = null
    setFase('planos')
    setPlano(null)
    setErroBrick(null)
    setBrickPronto(false)
  }

  async function copiarPix() {
    if (!pixData?.qr_code) return
    await navigator.clipboard.writeText(pixData.qr_code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  // ── FASE: SUCESSO ────────────────────────────────────────────────────────
  if (fase === 'sucesso') return (
    <Tela>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle2 size={36} color="#16A34A" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>Pagamento aprovado!</h2>
        <p style={{ fontSize: 14, color: '#8A7F76', marginBottom: 28, lineHeight: 1.6 }}>
          Sua assinatura do plano <strong>{planoSelecionado?.nome}</strong> foi ativada com sucesso.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ height: 46, paddingInline: 32, borderRadius: 12, border: 'none', background: '#CC1A1A', color: '#FFF', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          Acessar o app
        </button>
      </div>
    </Tela>
  )

  // ── FASE: PIX QR ────────────────────────────────────────────────────────
  if (fase === 'pix') return (
    <Tela>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <QrCode size={30} color="#2563EB" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', marginBottom: 6 }}>Pague via Pix</h2>
        <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 20 }}>
          Escaneie o QR code ou copie o código Pix abaixo. Após o pagamento, acesse o app normalmente.
        </p>

        {pixData.qr_code_base64 && (
          <div style={{ margin: '0 auto 20px', width: 200, height: 200, border: '1px solid #E0D6CA', borderRadius: 12, overflow: 'hidden' }}>
            <img
              src={`data:image/png;base64,${pixData.qr_code_base64}`}
              alt="QR Code Pix"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )}

        {pixData.qr_code && (
          <div style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: 10, padding: '12px 14px', marginBottom: 12, wordBreak: 'break-all', fontSize: 11, color: '#8A7F76', textAlign: 'left' }}>
            {pixData.qr_code}
          </div>
        )}

        <button
          onClick={copiarPix}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, paddingInline: 24, borderRadius: 10, border: '1.5px solid #E0D6CA', background: '#FFF', color: '#1A1A1A', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}
        >
          {copiado ? <><Check size={16} color="#16A34A" /> Copiado!</> : <><Copy size={16} /> Copiar código Pix</>}
        </button>

        <p style={{ fontSize: 12, color: '#C4B9A8', marginTop: 8 }}>
          Após pagar, recarregue o app para liberar o acesso.
        </p>
      </div>
    </Tela>
  )

  // ── FASE: PAGAMENTO (Brick) ──────────────────────────────────────────────
  if (fase === 'pagamento') return (
    <Tela>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={voltar} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8A7F76', fontSize: 13 }}>
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>

      <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: '#F7F3EE', border: '1px solid #E0D6CA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1A' }}>{planoSelecionado?.nome}</p>
          <p style={{ fontSize: 12, color: '#8A7F76' }}>{duracaoLabel(planoSelecionado?.duracao_dias)} · {planoSelecionado?.duracao_dias} dias</p>
        </div>
        <p style={{ fontSize: 20, fontWeight: 900, color: '#CC1A1A' }}>
          R$ {Number(planoSelecionado?.preco).toFixed(2).replace('.', ',')}
        </p>
      </div>

      {!brickPronto && !erroBrick && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} color="#CC1A1A" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {erroBrick && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
          {erroBrick}
        </div>
      )}

      <div id="mp-brick-container" />

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Tela>
  )

  // ── FASE: PLANOS ────────────────────────────────────────────────────────
  return (
    <Tela>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(204,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <ShieldCheck size={28} color="#CC1A1A" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>Escolha seu plano</h1>
        <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.6 }}>
          Selecione o plano que melhor se encaixa na sua rotina.
        </p>
      </div>

      {carregandoPlanos ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} color="#CC1A1A" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {planosAtivos.map(p => (
            <div
              key={p.id_plano}
              style={{ background: '#FFFFFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
            >
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
                <p style={{ fontSize: 12, color: '#8A7F76' }}>{duracaoLabel(p.duracao_dias)} · {p.duracao_dias} dias</p>
                {p.descricao && <p style={{ fontSize: 12, color: '#8A7F76', marginTop: 4 }}>{p.descricao}</p>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#CC1A1A', marginBottom: 8 }}>
                  R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                </p>
                <button
                  onClick={() => iniciarPagamento(p)}
                  style={{ height: 38, paddingInline: 20, borderRadius: 10, border: 'none', background: '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  Assinar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p style={{ textAlign: 'center', fontSize: 12, color: '#C4B9A8', marginTop: 24 }}>
        Pagamento seguro via Mercado Pago · Pix ou Cartão
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Tela>
  )
}

function Tela({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        {children}
      </div>
    </div>
  )
}
