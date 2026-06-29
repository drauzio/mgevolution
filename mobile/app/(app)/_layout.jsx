import { useState, useCallback, useRef, useEffect } from 'react';
import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Dumbbell, Salad, TrendingUp, UserRound, Clock, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Loading } from '../../src/components/Loading';
import api from '../../src/services/api';
import { buscarStatus, buscarPlanos, criarPreferencia } from '../../src/services/checkout';
import * as Linking from 'expo-linking';

const BRAND = '#CC1A1A';

function TabIcon({ focused, color, children }) {
  return (
    <View style={[s.iconBox, focused && s.iconBoxActive]}>
      {children(focused ? '#fff' : color)}
    </View>
  );
}

function BannerCarencia({ dias, onAssinar }) {
  const urgente = dias <= 3;
  return (
    <View style={[banner.wrap, urgente ? banner.wrapUrgente : banner.wrapNormal]}>
      <Clock size={14} color={urgente ? '#CC1A1A' : '#B45309'} />
      <Text style={[banner.txt, { color: urgente ? '#CC1A1A' : '#B45309' }]}>
        {dias === 0 ? 'Último dia de carência!' : `Carência: ${dias} dia${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}`}
      </Text>
      <TouchableOpacity onPress={onAssinar} style={[banner.btn, urgente ? banner.btnUrgente : banner.btnNormal]}>
        <Text style={[banner.btnTxt, { color: urgente ? '#CC1A1A' : '#B45309' }]}>Assinar</Text>
      </TouchableOpacity>
    </View>
  );
}

function duracaoLabel(dias) {
  if (dias <= 30)  return 'Mensal';
  if (dias <= 60)  return 'Bimestral';
  if (dias <= 90)  return 'Trimestral';
  if (dias <= 180) return 'Semestral';
  return 'Anual';
}

function TelaExpirado() {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const [planos, setPlanos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [assinando, setAssinando] = useState(null);
  const [erro, setErro]           = useState(null);

  useEffect(() => {
    buscarPlanos()
      .then(data => setPlanos(data.filter(p => p.ativo)))
      .catch(() => setErro('Não foi possível carregar os planos. Verifique sua conexão.'))
      .finally(() => setLoading(false));
  }, []);

  async function assinar(id_plano) {
    setAssinando(id_plano);
    setErro(null);
    try {
      const { init_point } = await criarPreferencia(id_plano);
      await Linking.openURL(init_point);
    } catch {
      setErro('Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setAssinando(null);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F7F3EE' }}
      contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }}
    >
      <View style={exp.header}>
        <View style={exp.iconBox}>
          <ShieldCheck size={28} color="#CC1A1A" />
        </View>
        <Text style={exp.titulo}>Sua carência expirou</Text>
        <Text style={exp.subtitulo}>Escolha um plano para continuar usando o MG Evolution.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#CC1A1A" style={{ marginTop: 40 }} />
      ) : planos.length === 0 && !erro ? (
        <View style={exp.aviso}>
          <Text style={exp.avisoTxt}>Nenhum plano disponível no momento. Entre em contato com seu personal.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {planos.map(p => (
            <View key={p.id_plano} style={exp.card}>
              <View style={{ flex: 1 }}>
                <Text style={exp.planoNome}>{p.nome}</Text>
                <Text style={exp.planoDuracao}>{duracaoLabel(p.duracao_dias)} · {p.duracao_dias} dias</Text>
                {p.descricao ? <Text style={exp.planoDesc}>{p.descricao}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={exp.preco}>R$ {Number(p.preco).toFixed(2).replace('.', ',')}</Text>
                <TouchableOpacity
                  onPress={() => assinar(p.id_plano)}
                  disabled={!!assinando}
                  style={[exp.btn, assinando && exp.btnDisabled]}
                >
                  {assinando === p.id_plano
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={exp.btnTxt}>Assinar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {erro ? <Text style={exp.erro}>{erro}</Text> : null}

      <Text style={exp.rodape}>Pagamento seguro via Mercado Pago · Pix ou Cartão</Text>

      <TouchableOpacity onPress={logout} style={exp.sairBtn}>
        <Text style={exp.sairTxt}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Estado: 'verificando' | 'ok' | 'expirado'
export default function AppLayout() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [estado, setEstado] = useState('verificando');
  const [assinaturaStatus, setAssinaturaStatus] = useState(null);
  const checked = useRef(false);

  function verificar() {
    checked.current = false;
    setEstado('verificando');
  }

  useFocusEffect(
    useCallback(() => {
      if (checked.current) return;
      if (carregando) return;
      if (!usuario) { router.replace('/(auth)/login'); return; }

      const isAluno = (usuario.perfis ?? []).includes('aluno') || usuario.perfil === 'aluno';
      if (!isAluno) { checked.current = true; setEstado('ok'); return; }

      api.get('/avaliacao/status')
        .then(r => {
          if (!r.data.concluida) {
            router.replace('/onboarding');
            return;
          }
          return buscarStatus();
        })
        .then(status => {
          if (!status) return;
          checked.current = true;
          if (status.status === 'expirado') {
            setEstado('expirado');
          } else {
            setAssinaturaStatus(status);
            setEstado('ok');
          }
        })
        .catch(() => {
          checked.current = true;
          setEstado('expirado'); // bloqueia em caso de erro — mais seguro
        });
    }, [usuario, carregando])
  );

  if (carregando || !usuario || estado === 'verificando') {
    return <Loading style={{ backgroundColor: '#F0EBE4' }} />;
  }

  if (estado === 'expirado') {
    return <TelaExpirado />;
  }

  return (
    <View style={{ flex: 1 }}>
      {assinaturaStatus?.status === 'carencia' && (
        <BannerCarencia
          dias={assinaturaStatus.dias_restantes}
          onAssinar={() => router.push('/assinar')}
        />
      )}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: BRAND,
          tabBarInactiveTintColor: '#8A7F76',
          tabBarStyle: [s.tabBar, { height: 60 + insets.bottom, paddingBottom: 6 + insets.bottom }],
          tabBarLabelStyle: s.label,
          tabBarItemStyle: s.item,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Início',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color}>
                {(c) => <Home size={21} color={c} strokeWidth={2.3} />}
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="treinos"
          options={{
            title: 'Treinos',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color}>
                {(c) => <Dumbbell size={21} color={c} strokeWidth={2.3} />}
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="dieta"
          options={{
            title: 'Dieta',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color}>
                {(c) => <Salad size={21} color={c} strokeWidth={2.3} />}
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen name="coach-ia"    options={{ href: null }} />
        <Tabs.Screen name="notificacoes" options={{ href: null }} />
        <Tabs.Screen
          name="evolucao"
          options={{
            title: 'Evolução',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color}>
                {(c) => <TrendingUp size={21} color={c} strokeWidth={2.3} />}
              </TabIcon>
            ),
          }}
        />
        <Tabs.Screen
          name="perfil"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ focused, color }) => (
              <TabIcon focused={focused} color={color}>
                {(c) => <UserRound size={21} color={c} strokeWidth={2.3} />}
              </TabIcon>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const banner = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  wrapNormal:  { backgroundColor: '#FFFBEB', borderBottomWidth: 1, borderBottomColor: '#FDE68A' },
  wrapUrgente: { backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FCA5A5' },
  txt:         { flex: 1, fontSize: 12, fontWeight: '600' },
  btn:         { borderRadius: 6, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1 },
  btnNormal:   { borderColor: '#FDE68A' },
  btnUrgente:  { borderColor: '#FCA5A5' },
  btnTxt:      { fontSize: 11, fontWeight: '700' },
});

const exp = StyleSheet.create({
  header:     { alignItems: 'center', marginBottom: 28 },
  iconBox:    { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(204,26,26,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  titulo:     { fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 8, textAlign: 'center' },
  subtitulo:  { fontSize: 13, color: '#8A7F76', textAlign: 'center', lineHeight: 20 },
  aviso:      { padding: 16, borderRadius: 12, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  avisoTxt:   { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  card:       { backgroundColor: '#FFF', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E0D6CA' },
  planoNome:  { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  planoDuracao:{ fontSize: 12, color: '#8A7F76' },
  planoDesc:  { fontSize: 12, color: '#8A7F76', marginTop: 4 },
  preco:      { fontSize: 18, fontWeight: '900', color: '#CC1A1A', marginBottom: 8 },
  btn:        { backgroundColor: '#CC1A1A', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, minWidth: 80, alignItems: 'center' },
  btnDisabled:{ backgroundColor: '#C4B9A8' },
  btnTxt:     { color: '#FFF', fontSize: 13, fontWeight: '700' },
  erro:       { color: '#CC1A1A', fontSize: 13, textAlign: 'center', marginTop: 16 },
  rodape:     { color: '#C4B9A8', fontSize: 11, textAlign: 'center', marginTop: 24 },
  sairBtn:    { alignItems: 'center', marginTop: 12, padding: 8 },
  sairTxt:    { fontSize: 13, color: '#8A7F76' },
});

const s = StyleSheet.create({
  tabBar: {
    paddingTop: 6,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E8E2DC',
    elevation: 12, shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  item:  { paddingVertical: 2 },
  label: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  iconBox: {
    width: 38, height: 34, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: '#CC1A1A' },
});
