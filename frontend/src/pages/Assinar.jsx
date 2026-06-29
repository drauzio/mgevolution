import { useState } from 'react'
import useSWR from 'swr'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { buscarPlanos, criarPreferencia } from '../services/checkout'

function duracaoLabel(dias) {
  if (dias <= 30)  return 'Mensal'
  if (dias <= 60)  return 'Bimestral'
  if (dias <= 90)  return 'Trimestral'
  if (dias <= 180) return 'Semestral'
  return 'Anual'
}

export default function Assinar({ expirado = false }) {
  const { data: planos = [], isLoading } = useSWR('planos-publicos', buscarPlanos)
  const [assinando, setAssinando] = useState(null)
  const [erro, setErro] = useState(null)

  async function assinar(id_plano) {
    setAssinando(id_plano)
    setErro(null)
    try {
      const { init_point } = await criarPreferencia(id_plano)
      window.location.href = init_point
    } catch {
      setErro('Erro ao iniciar pagamento. Tente novamente.')
      setAssinando(null)
    }
  }

  const planosAtivos = planos.filter(p => p.ativo)

  return (
    <div style={{ minHeight: '100vh', background: '#F7F3EE', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(204,26,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <ShieldCheck size={28} color="#CC1A1A" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1A1A1A', marginBottom: 8 }}>
            {expirado ? 'Sua carência expirou' : 'Escolha seu plano'}
          </h1>
          <p style={{ fontSize: 14, color: '#8A7F76', lineHeight: 1.6 }}>
            {expirado
              ? 'Para continuar acessando o MG Evolution, escolha um plano abaixo.'
              : 'Selecione o plano que melhor se encaixa na sua rotina.'}
          </p>
        </div>

        {isLoading ? (
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
                    onClick={() => assinar(p.id_plano)}
                    disabled={!!assinando}
                    style={{ height: 38, paddingInline: 20, borderRadius: 10, border: 'none', background: assinando === p.id_plano ? '#C4B9A8' : '#CC1A1A', color: '#FFFFFF', fontSize: 13, fontWeight: 700, cursor: assinando ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                  >
                    {assinando === p.id_plano
                      ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</>
                      : 'Assinar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {erro && (
          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#CC1A1A', fontSize: 13, textAlign: 'center' }}>
            {erro}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, color: '#C4B9A8', marginTop: 24 }}>
          Pagamento seguro via Mercado Pago · Pix ou Cartão
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
