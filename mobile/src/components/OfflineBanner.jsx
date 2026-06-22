import { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { useOffline } from '../hooks/useOffline';

export function OfflineBanner() {
  const offline = useOffline();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: offline ? 0 : -120,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [offline]);

  return (
    <Animated.View style={[s.banner, { transform: [{ translateY }] }]}>
      <WifiOff size={16} color="#fff" />
      <Text style={s.texto}>Sem conexão com a internet</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  banner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
    backgroundColor: '#dc2626',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, paddingHorizontal: 16, paddingTop: 44,
  },
  texto: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
