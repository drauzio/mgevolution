import { useState, useCallback, useRef } from 'react';
import { Tabs, useRouter, useFocusEffect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Dumbbell, Salad, TrendingUp, UserRound } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { Loading } from '../../src/components/Loading';
import api from '../../src/services/api';

const BRAND = '#CC1A1A';

function TabIcon({ focused, color, children }) {
  return (
    <View style={[s.iconBox, focused && s.iconBoxActive]}>
      {children(focused ? '#fff' : color)}
    </View>
  );
}

export default function AppLayout() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const checked = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (checked.current) return; // já passou, não re-executa
      if (carregando) return;
      if (!usuario) { router.replace('/(auth)/login'); return; }

      const isAluno = (usuario.perfis ?? []).includes('aluno') || usuario.perfil === 'aluno';
      if (!isAluno) { checked.current = true; setCheckingOnboarding(false); return; }

      api.get('/avaliacao/status')
        .then(r => {
          if (!r.data.concluida) {
            router.replace('/onboarding');
          } else {
            checked.current = true;
            setCheckingOnboarding(false);
          }
        })
        .catch(() => { checked.current = true; setCheckingOnboarding(false); });
    }, [usuario, carregando])
  );

  if (carregando || !usuario || checkingOnboarding) {
    return <Loading style={{ backgroundColor: '#F0EBE4' }} />;
  }

  return (
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
  );
}

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
