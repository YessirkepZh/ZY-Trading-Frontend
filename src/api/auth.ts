import { apiClient, setAccessToken } from './client';
import type { ApiToken, AuthUser, Invite, UserRole } from '../types';

interface SessionResponse {
  success: boolean;
  accessToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await apiClient.post<SessionResponse>('/api/auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function acceptInvite(token: string, email: string, password: string): Promise<AuthUser> {
  const { data } = await apiClient.post<SessionResponse>('/api/auth/invites/accept', {
    token,
    email,
    password,
  });
  setAccessToken(data.accessToken);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get<{ success: boolean; user: AuthUser }>('/api/auth/me');
  return data.user;
}

export async function fetchApiTokens(): Promise<ApiToken[]> {
  const { data } = await apiClient.get<{ success: boolean; tokens: ApiToken[] }>('/api/auth/api-tokens');
  return data.tokens;
}

export async function createApiToken(name: string): Promise<{ token: string; apiToken: ApiToken }> {
  const { data } = await apiClient.post<{ success: boolean; token: string; apiToken: ApiToken }>(
    '/api/auth/api-tokens',
    { name },
  );
  return { token: data.token, apiToken: data.apiToken };
}

export async function revokeApiToken(id: number): Promise<void> {
  await apiClient.delete(`/api/auth/api-tokens/${id}`);
}

export async function fetchInvites(): Promise<Invite[]> {
  const { data } = await apiClient.get<{ success: boolean; invites: Invite[] }>('/api/auth/invites');
  return data.invites;
}

export async function createInvite(params: {
  email?: string;
  role: UserRole;
}): Promise<{ token: string; invite: Invite }> {
  const { data } = await apiClient.post<{ success: boolean; token: string; invite: Invite }>(
    '/api/auth/invites',
    params,
  );
  return { token: data.token, invite: data.invite };
}
