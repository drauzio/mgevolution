import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

const DURACAO_MINIMA_SPLASH = 700;

function EsconderSplash() {
  const { carregando } = useAuth();
  useEffect(() => {
    if (carregando) return;
    const t = setTimeout(() => SplashScreen.hideAsync(), DURACAO_MINIMA_SPLASH);
    return () => clearTimeout(t);
  }, [carregando]);
  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <EsconderSplash />
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
