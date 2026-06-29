import { useState, useCallback, useRef } from 'react';
import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Dumbbell, Salad, TrendingUp, UserRound, Clock } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Loading } from '../../src/components/Loading';
import api from '../../src/services/api';
import { buscarStatus } from '../../src/services/checkout';

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

export default function AppLayout() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [assinaturaStatus, setAssinaturaStatus] = useState(null);
  const [expirado, setExpirado] = useState(false);
  const checked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (checked.current) return;
      if (carregando) return;
      if (!usuario) { router.replace('/(auth)/login'); return; }

      const isAluno = (usuario.perfis ?? []).includes('aluno') || usuario.perfil === 'aluno';
      if (!isAluno) { checked.current = true; setCheckingOnboarding(false); return; }

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
          if (status.status === 'expirado') {
            setExpirado(true);
            checked.current = true;
            setCheckingOnboarding(false);
            return;
          }
          setAssinaturaStatus(status);
          checked.current = true;
          setCheckingOnboarding(false);
        })
        .catch(() => {
          // Em caso de erro de rede, bloqueia por segurança se ainda não verificou
          checked.current = true;
          setCheckingOnboarding(false);
        });
    }, [usuario, carregando])
  );

  if (carregando || !usuario || checkingOnboarding) {
    return <Loading style={{ backgroundColor: '#F0EBE4' }} />;
  }

  if (expirado) {
    router.replace('/assinar');
    return <Loading style={{ backgroundColor: '#F0EBE4' }} />;
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
      <Tabs.Screen
        name="notificacoes"
        options={{ href: null }}
      />
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
