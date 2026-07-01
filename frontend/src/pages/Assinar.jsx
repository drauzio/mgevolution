import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import useSWR from 'swr'
import { ShieldCheck, Loader2, CheckCircle2, Copy, Check, ChevronLeft, QrCode, Lock, CreditCard, Zap } from 'lucide-react'
import { buscarPlanos, buscarConfig, pagar, cancelarPagamento } from '../services/checkout'

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
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const idPlanoPre = searchParams.get('id_plano')
  const temHistorico = location.key !== 'default'

  const { data: planos = [], isLoading: carregandoPlanos } = useSWR('planos-publicos', buscarPlanos)

  const [fase, setFase]               = useState('planos')
  const [planoSelecionado, setPlano]  = useState(null)
  const [pixData, setPixData]         = useState(null)
  const [pixPaymentId, setPixPaymentId] = useState(null)
  const [copiado, setCopiado]         = useState(false)
  const [erroBrick, setErroBrick]     = useState(null)
  const [brickPronto, setBrickPronto] = useState(false)
  const controllerRef                 = useRef(null)

  const planosAtivos = planos.filter(p => p.ativo)

  useEffect(() => {
    if (!idPlanoPre || !planosAtivos.length) return
    const plano = planosAtivos.find(p => String(p.id_plano) === String(idPlanoPre))
    if (plano) iniciarPagamento(plano)
  }, [idPlanoPre, planosAtivos.length])

  // Avisa o app nativo (quando embutido numa WebView) em qual etapa a página está,
  // pra ele decidir se mostra o rodapé "Já paguei — verificar acesso"
  useEffect(() => {
    window.ReactNativeWebView?.postMessage(JSON.stringify({ tipo: 'mg_fase', fase }))
  }, [fase])

  async function iniciarPagamento(plano) {
    setPlano(plano)
    setErroBrick(null)
    setBrickPronto(false)
    setFase('pagamento')
  }

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
            paymentMethods: { creditCard: 'all', debitCard: 'all', bankTransfer: 'all' },
            visual: { style: { theme: 'flat' }, hideFormTitle: true },
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
                  setPixPaymentId(result.payment_id)
                  setFase('pix')
                } else {
                  const detalhe = result.status_detail ? ` (${result.status_detail})` : ''
                  setErroBrick(`Pagamento não aprovado${detalhe}. Verifique os dados e tente novamente.`)
                }
              }).catch(() => {
                if (ativo) setErroBrick('Erro ao processar pagamento. Tente novamente.')
                throw new Error('payment_error')
              })
            },
            onError: () => { if (ativo) setErroBrick('Erro no formulário de pagamento.') },
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
    if (pixPaymentId) {
      cancelarPagamento(pixPaymentId).catch(() => {})
      setPixPaymentId(null)
    }
    controllerRef.current?.unmount()
    controllerRef.current = null
    setFase('planos')
    setPlano(null)
    setPixData(null)
    setErroBrick(null)
    setBrickPronto(false)
  }

  async function copiarPix() {
    if (!pixData?.qr_code) return
    await navigator.clipboard.writeText(pixData.qr_code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  // ── SUCESSO ──────────────────────────────────────────────────────────────
  if (fase === 'sucesso') return (
    <Pagina>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(22,163,74,0.25)' }}>
          <CheckCircle2 size={40} color="#FFF" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1A1A1A', marginBottom: 10 }}>Pagamento aprovado!</h2>
        <p style={{ fontSize: 15, color: '#8A7F76', marginBottom: 32, lineHeight: 1.7 }}>
          Sua assinatura do plano <strong style={{ color: '#1A1A1A' }}>{planoSelecionado?.nome}</strong> foi ativada com sucesso.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ height: 50, paddingInline: 40, borderRadius: 14, border: 'none', background: '#CC1A1A', color: '#FFF', fontSize: 16, fontWeight: 800, cursor: 'pointer', letterSpacing: '0.02em' }}
        >
          Acessar o app →
        </button>
      </div>
    </Pagina>
  )

  // ── PIX ──────────────────────────────────────────────────────────────────
  if (fase === 'pix') return (
    <Pagina>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={voltar}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E0D6CA', background: '#FFF', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeft size={20} color="#1A1A1A" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 auto' }}>Pagamento via Pix</p>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#16A34A,#22C55E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(22,163,74,0.2)' }}>
          <QrCode size={32} color="#FFF" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>Pague via Pix</h2>
        <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 24, lineHeight: 1.7 }}>
          Escaneie o QR code ou copie o código abaixo.<br />O acesso é liberado assim que o pagamento for confirmado.
        </p>

        {pixData.qr_code_base64 && (
          <div style={{ margin: '0 auto 20px', width: 210, height: 210, background: '#FFF', border: '2px solid #E0D6CA', borderRadius: 16, overflow: 'hidden', padding: 8, boxSizing: 'border-box' }}>
            <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code Pix" style={{ width: '100%', height: '100%', borderRadius: 8 }} />
          </div>
        )}

        {pixData.qr_code && (
          <div style={{ background: '#F7F3EE', border: '1px solid #E0D6CA', borderRadius: 12, padding: '12px 16px', marginBottom: 14, wordBreak: 'break-all', fontSize: 11, color: '#8A7F76', textAlign: 'left', fontFamily: 'monospace', lineHeight: 1.6 }}>
            {pixData.qr_code}
          </div>
        )}

        <button
          onClick={copiarPix}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 46, paddingInline: 28, borderRadius: 12, border: copiado ? '1.5px solid #16A34A' : '1.5px solid #E0D6CA', background: copiado ? 'rgba(22,163,74,0.06)' : '#FFF', color: copiado ? '#16A34A' : '#1A1A1A', fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
        >
          {copiado ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar código Pix</>}
        </button>

        <p style={{ fontSize: 12, color: '#C4B9A8', marginTop: 20 }}>
          Após pagar, recarregue o app para liberar o acesso.
        </p>
      </div>
    </Pagina>
  )

  // ── PAGAMENTO (Brick) ────────────────────────────────────────────────────
  if (fase === 'pagamento') return (
    <Pagina>
      {/* Header com voltar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={voltar}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E0D6CA', background: '#FFF', cursor: 'pointer', flexShrink: 0 }}
        >
          <ChevronLeft size={20} color="#1A1A1A" />
        </button>
        <p style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', margin: '0 auto' }}>Finalizar assinatura</p>
        <div style={{ width: 36 }} />
      </div>

      {/* Resumo do plano */}
      <div style={{ background: '#FFF', border: '1px solid #E0D6CA', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 13, color: '#8A7F76', marginBottom: 2 }}>{duracaoLabel(planoSelecionado?.duracao_dias)}</p>
          <p style={{ fontSize: 16, fontWeight: 900, color: '#1A1A1A' }}>{planoSelecionado?.nome}</p>
          <p style={{ fontSize: 12, color: '#C4B9A8', marginTop: 2 }}>{planoSelecionado?.duracao_dias} dias de acesso</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#8A7F76' }}>Total</p>
          <p style={{ fontSize: 26, fontWeight: 900, color: '#CC1A1A', lineHeight: 1.1 }}>
            R$ {Number(planoSelecionado?.preco).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Métodos aceitos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '10px 14px', background: '#F7F3EE', borderRadius: 10 }}>
        <Lock size={13} color="#8A7F76" />
        <span style={{ fontSize: 12, color: '#8A7F76' }}>Pagamento seguro via Mercado Pago</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#8A7F76', background: '#FFF', border: '1px solid #E0D6CA', borderRadius: 6, padding: '2px 8px' }}><CreditCard size={11} /> Cartão</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#16A34A', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 6, padding: '2px 8px' }}><Zap size={11} /> Pix</span>
        </div>
      </div>

      {/* Loading do Brick */}
      {!brickPronto && !erroBrick && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
          <Loader2 size={28} color="#CC1A1A" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 13, color: '#8A7F76' }}>Carregando formulário de pagamento...</p>
        </div>
      )}

      {erroBrick && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
          {erroBrick}
        </div>
      )}

      <div id="mp-brick-container" />

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Pagina>
  )

  // ── PLANOS ───────────────────────────────────────────────────────────────
  return (
    <Pagina>
      {/* Voltar (só mostra quando tem pra onde voltar de verdade) */}
      {temHistorico && (
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: '1.5px solid #E0D6CA', background: '#FFF', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} color="#1A1A1A" />
          </button>
        </div>
      )}

      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg,#CC1A1A,#E53E3E)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 8px 24px rgba(204,26,26,0.25)' }}>
          <ShieldCheck size={30} color="#FFF" />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1A1A1A', marginBottom: 10, letterSpacing: '-0.01em' }}>Escolha seu plano</h1>
        <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.7, maxWidth: 340, margin: '0 auto' }}>
          Acesso completo a treinos, dieta e acompanhamento. Cancele quando quiser.
        </p>
      </div>

      {/* Lista de planos */}
      {carregandoPlanos ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={28} color="#CC1A1A" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {planosAtivos.map((p, i) => {
            const destaque = i === 0 && planosAtivos.length > 1
            return (
              <div
                key={p.id_plano}
                style={{
                  background: destaque ? 'linear-gradient(135deg,#CC1A1A,#E53E3E)' : '#FFF',
                  border: destaque ? 'none' : '1.5px solid #E0D6CA',
                  borderRadius: 18,
                  padding: destaque ? '40px 22px 20px' : '20px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  boxShadow: destaque ? '0 8px 28px rgba(204,26,26,0.22)' : '0 1px 4px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {destaque && (
                  <div style={{ position: 'absolute', top: 12, right: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 800, color: '#FFF', letterSpacing: '0.05em' }}>
                    MAIS POPULAR
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: destaque ? 'rgba(255,255,255,0.7)' : '#8A7F76', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                    {duracaoLabel(p.duracao_dias)}
                  </p>
                  <p style={{ fontSize: 17, fontWeight: 900, color: destaque ? '#FFF' : '#1A1A1A', marginBottom: 2 }}>{p.nome}</p>
                  {p.descricao && <p style={{ fontSize: 12, color: destaque ? 'rgba(255,255,255,0.75)' : '#8A7F76' }}>{p.descricao}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 24, fontWeight: 900, color: destaque ? '#FFF' : '#CC1A1A', lineHeight: 1, marginBottom: 10 }}>
                    R$ {Number(p.preco).toFixed(2).replace('.', ',')}
                  </p>
                  <button
                    onClick={() => iniciarPagamento(p)}
                    style={{
                      height: 40, paddingInline: 22, borderRadius: 10, border: 'none',
                      background: destaque ? '#FFF' : '#CC1A1A',
                      color: destaque ? '#CC1A1A' : '#FFF',
                      fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Assinar agora
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Rodapé */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 24 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#B0A89E' }}><Lock size={11} /> Pagamento seguro</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#C4B9A8' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#B0A89E' }}><CreditCard size={11} /> Cartão ou Pix</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#C4B9A8' }} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#B0A89E' }}>Mercado Pago</span>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Pagina>
  )
}

function Pagina({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        {children}
      </div>
    </div>
  )
}
