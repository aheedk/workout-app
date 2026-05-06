import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@workout-app/shared';

const REFRESH_TOKEN_KEY = 'refreshToken';

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
    else localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // localStorage unavailable (private mode, disabled) — cookie path still works.
  }
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post('/auth/login', data);
  setStoredRefreshToken(res.data.refreshToken ?? null);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post('/auth/register', data);
  setStoredRefreshToken(res.data.refreshToken ?? null);
  return res.data;
}

export async function refresh(): Promise<{ accessToken: string; refreshToken?: string }> {
  // Send the persisted refresh token in the body as a fallback for environments
  // where the HttpOnly cookie doesn't survive (iOS PWA, Safari ITP, etc).
  const stored = getStoredRefreshToken();
  const res = await apiClient.post('/auth/refresh', stored ? { refreshToken: stored } : {});
  if (res.data.refreshToken) setStoredRefreshToken(res.data.refreshToken);
  return res.data;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } finally {
    setStoredRefreshToken(null);
  }
}
