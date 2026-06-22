import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const PROD_URL = 'https://mgevolution.azurewebsites.net/api';

function resolveApiUrl() {
  if (!__DEV__) return PROD_URL;

  // Em dev, deriva o IP da máquina a partir do host do Expo dev server
  // Ex: "192.168.1.100:8081" → "http://192.168.1.100:3000/api"
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:3000/api`;

  // Fallback: IP fixo da máquina de desenvolvimento
  const DEV_IP = Constants.expoConfig?.extra?.devIp;
  if (DEV_IP) return `http://${DEV_IP}:3000/api`;

  return PROD_URL;
}

export const API_URL = resolveApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (cfg) => {
  const token = await SecureStore.getItemAsync('mg_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      await SecureStore.deleteItemAsync('mg_token');
      await SecureStore.deleteItemAsync('mg_usuario');
      return Promise.reject(err);
    }

    if (!err.response) {
      const msg = err.code === 'ECONNABORTED'
        ? 'Tempo de resposta esgotado. Verifique sua conexão e tente novamente.'
        : 'Sem conexão com a internet. Verifique sua rede e tente novamente.';
      err.response = { status: 0, data: { erro: msg } };
    }

    return Promise.reject(err);
  }
);

export default api;
