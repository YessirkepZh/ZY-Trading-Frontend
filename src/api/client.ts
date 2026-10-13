import axios, { type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Shared key from the pre-account login; it must not linger in storage
localStorage.removeItem('zy_auth');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  // Refresh token lives in an httpOnly cookie scoped to /api/auth
  withCredentials: true,
});

// Access token is kept in memory only; a reload restores it via the refresh cookie
let accessToken: string | null = null;
let onSessionExpired: (() => void) | null = null;
let refreshInFlight: Promise<boolean> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

const SESSION_ENDPOINTS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/invites/accept'];

/** Single-flight refresh so parallel 401s rotate the cookie only once */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= apiClient
    .post<{ accessToken: string }>('/api/auth/refresh')
    .then(({ data }) => {
      setAccessToken(data.accessToken);
      return true;
    })
    .catch(() => {
      setAccessToken(null);
      return false;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.set('Authorization', `Bearer ${accessToken}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
      return Promise.reject(error);
    }

    const config = error.config as InternalAxiosRequestConfig & { _retried?: boolean };
    if (config._retried || SESSION_ENDPOINTS.includes(config.url ?? '')) {
      return Promise.reject(error);
    }

    config._retried = true;
    if (await refreshSession()) return apiClient(config);

    onSessionExpired?.();
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const message = (err.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof message === 'string') return message;
    if (!err.response) return 'Сервер недоступен, попробуйте позже';
  }
  return fallback;
}
