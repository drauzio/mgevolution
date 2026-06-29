import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Linking from 'expo-linking'
import { ShieldCheck } from 'lucide-react-native'
import { buscarPlanos, criarPreferencia } from '../src/services/checkout'

function duracaoLabel(dias) {
  if (dias <= 30)  return 'Mensal'
  if (dias <= 60)  return 'Bimestral'
  if (dias <= 90)  return 'Trimestral'
  if (dias <= 180) return 'Semestral'
  return 'Anual'
}

export default function Assinar() {
  const insets = useSafeAreaInsets()
  const [planos, setPlanos]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [assinando, setAssinando] = useState(null)
  const [erro, setErro]         = useState(null)

  useEffect(() => {
    buscarPlanos()
      .then(data => setPlanos(data.filter(p => p.ativo)))
      .finally(() => setLoading(false))
  }, [])

  async function assinar(id_plano) {
    setAssinando(id_plano)
    setErro(null)
    try {
      const { init_point } = await criarPreferencia(id_plano)
      await Linking.openURL(init_point)
    } catch {
      setErro('Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setAssinando(null)
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F7F3EE' }}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
    >
      <View style={s.header}>
        <View style={s.iconBox}>
          <ShieldCheck size={28} color="#CC1A1A" />
        </View>
        <Text style={s.titulo}>Sua carência expirou</Text>
        <Text style={s.subtitulo}>Escolha um plano para continuar usando o MG Evolution.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#CC1A1A" style={{ marginTop: 40 }} />
      ) : (
        <View style={s.lista}>
          {planos.map(p => (
            <View key={p.id_plano} style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.planoNome}>{p.nome}</Text>
                <Text style={s.planoDuracao}>{duracaoLabel(p.duracao_dias)} · {p.duracao_dias} dias</Text>
                {p.descricao ? <Text style={s.planoDesc}>{p.descricao}</Text> : null}
              </View>
              <View style={s.cardDireita}>
                <Text style={s.preco}>R$ {Number(p.preco).toFixed(2).replace('.', ',')}</Text>
                <TouchableOpacity
                  onPress={() => assinar(p.id_plano)}
                  disabled={!!assinando}
                  style={[s.btn, assinando && s.btnDisabled]}
                >
                  {assinando === p.id_plano
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={s.btnTxt}>Assinar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {erro ? <Text style={s.erro}>{erro}</Text> : null}

      <Text style={s.rodape}>Pagamento seguro via Mercado Pago · Pix ou Cartão</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:   { padding: 24 },
  header:      { alignItems: 'center', marginBottom: 28 },
  iconBox:     { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(204,26,26,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  titulo:      { fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  subtitulo:   { fontSize: 13, color: '#8A7F76', textAlign: 'center', lineHeight: 20 },
  lista:       { gap: 12 },
  card:        { backgroundColor: '#FFF', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E0D6CA' },
  planoNome:   { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  planoDuracao:{ fontSize: 12, color: '#8A7F76' },
  planoDesc:   { fontSize: 12, color: '#8A7F76', marginTop: 4 },
  cardDireita: { alignItems: 'flex-end' },
  preco:       { fontSize: 18, fontWeight: '900', color: '#CC1A1A', marginBottom: 8 },
  btn:         { backgroundColor: '#CC1A1A', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, minWidth: 80, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#C4B9A8' },
  btnTxt:      { color: '#FFF', fontSize: 13, fontWeight: '700' },
  erro:        { color: '#CC1A1A', fontSize: 13, textAlign: 'center', marginTop: 16 },
  rodape:      { color: '#C4B9A8', fontSize: 11, textAlign: 'center', marginTop: 24 },
})
