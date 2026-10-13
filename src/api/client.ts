import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_KEY_STORAGE_KEY = 'zy_auth';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (apiKey) config.headers.set('x-api-key', apiKey);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

export async function checkApiKey(apiKey: string): Promise<'ok' | 'invalid' | 'error'> {
  try {
    await axios.get(`${BASE_URL}/api/auth/check`, {
      headers: { 'x-api-key': apiKey },
      timeout: 15000,
    });
    return 'ok';
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 401) return 'invalid';
    return 'error';
  }
}
