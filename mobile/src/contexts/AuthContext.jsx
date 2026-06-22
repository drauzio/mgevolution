import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../services/api';

const AuthCtx = createContext(null);

const KEY_TOKEN   = 'mg_token';
const KEY_USER    = 'mg_usuario';
const KEY_FACEID  = 'mg_faceid_enabled';

export function AuthProvider({ children }) {
  const [usuario, setUsuario]           = useState(null);
  const [carregando, setCarregando]     = useState(true);
  const [faceIdAtivo, setFaceIdAtivo]   = useState(false);

  useEffect(() => {
    async function restaurar() {
      try {
        const [raw, fi] = await Promise.all([
          SecureStore.getItemAsync(KEY_USER),
          SecureStore.getItemAsync(KEY_FACEID),
        ]);
        if (raw) setUsuario(JSON.parse(raw));
        setFaceIdAtivo(fi === 'true');
      } catch {}
      finally { setCarregando(false); }
    }
    restaurar();
  }, []);

  async function entrar(token, userInfo) {
    await SecureStore.setItemAsync(KEY_TOKEN, token);
    await SecureStore.setItemAsync(KEY_USER, JSON.stringify(userInfo));
    setUsuario(userInfo);
  }

  async function sair() {
    await SecureStore.deleteItemAsync(KEY_TOKEN);
    await SecureStore.deleteItemAsync(KEY_USER);
    setUsuario(null);
  }

  async function habilitarFaceId() {
    const suporte = await LocalAuthentication.hasHardwareAsync();
    const cadastrado = await LocalAuthentication.isEnrolledAsync();
    if (!suporte || !cadastrado) {
      throw new Error('Biometria não disponível ou não cadastrada neste dispositivo.');
    }
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirme sua identidade para ativar o Face ID',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (!resultado.success) throw new Error('Autenticação cancelada.');
    await SecureStore.setItemAsync(KEY_FACEID, 'true');
    setFaceIdAtivo(true);
  }

  async function desabilitarFaceId() {
    await SecureStore.deleteItemAsync(KEY_FACEID);
    setFaceIdAtivo(false);
  }

  async function loginComFaceId() {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse o MG Evolution',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (!resultado.success) return false;

    const raw = await SecureStore.getItemAsync(KEY_USER);
    if (!raw) return false;
    setUsuario(JSON.parse(raw));
    return true;
  }

  const value = useMemo(() => ({
    usuario, carregando, faceIdAtivo,
    entrar, sair, habilitarFaceId, desabilitarFaceId, loginComFaceId,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [usuario, carregando, faceIdAtivo]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
