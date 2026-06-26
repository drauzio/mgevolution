import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import api from '../services/api';

const AuthCtx = createContext(null);

const KEY_TOKEN   = 'mg_token';
const KEY_USER    = 'mg_usuario';
const KEY_FACEID  = 'mg_faceid_enabled';

function tokenExpirado(token) {
  try {
    const part = token.split('.')[1]
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      part.length + (4 - (part.length % 4)) % 4, '='
    )
    const payload = JSON.parse(atob(b64))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario]               = useState(null);
  const [carregando, setCarregando]         = useState(true);
  const [faceIdAtivo, setFaceIdAtivo]       = useState(false);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  useEffect(() => {
    async function restaurar() {
      try {
        const [token, raw, fi] = await Promise.all([
          SecureStore.getItemAsync(KEY_TOKEN),
          SecureStore.getItemAsync(KEY_USER),
          SecureStore.getItemAsync(KEY_FACEID),
        ]);
        if (token && raw && !tokenExpirado(token)) {
          setUsuario(JSON.parse(raw));
        } else if (token || raw) {
          await Promise.all([
            SecureStore.deleteItemAsync(KEY_TOKEN),
            SecureStore.deleteItemAsync(KEY_USER),
          ]);
          if (token) setSessaoExpirada(true);
        }
        setFaceIdAtivo(fi === 'true');
      } catch {}
      finally { setCarregando(false); }
    }
    restaurar();
  }, []);

  async function entrar(token, userInfo) {
    await SecureStore.setItemAsync(KEY_TOKEN, token);
    await SecureStore.setItemAsync(KEY_USER, JSON.stringify(userInfo));
    const fi = await SecureStore.getItemAsync(KEY_FACEID);
    setFaceIdAtivo(fi === 'true');
    setUsuario(userInfo);
  }

  async function sair() {
    // Com Face ID ativo, mantém token e usuário no SecureStore para restaurar sessão via biometria
    if (!faceIdAtivo) {
      await SecureStore.deleteItemAsync(KEY_TOKEN);
      await SecureStore.deleteItemAsync(KEY_USER);
    }
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
    const ok = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Acesse o MG Evolution',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: true,
    });
    if (!ok.success) return 'cancelado';

    const [token, raw] = await Promise.all([
      SecureStore.getItemAsync(KEY_TOKEN),
      SecureStore.getItemAsync(KEY_USER),
    ]);
    if (!token || !raw || tokenExpirado(token)) {
      await Promise.all([
        SecureStore.deleteItemAsync(KEY_TOKEN),
        SecureStore.deleteItemAsync(KEY_USER),
      ]);
      return 'expirado';
    }

    await entrar(token, JSON.parse(raw));
    return 'ok';
  }

  const value = useMemo(() => ({
    usuario, carregando, faceIdAtivo, sessaoExpirada, setSessaoExpirada,
    entrar, sair, habilitarFaceId, desabilitarFaceId, loginComFaceId,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [usuario, carregando, faceIdAtivo, sessaoExpirada]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
