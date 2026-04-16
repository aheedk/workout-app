import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@workout-app/shared';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post('/auth/login', data);
  return res.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post('/auth/register', data);
  return res.data;
}

export async function refresh(): Promise<{ accessToken: string }> {
  const res = await apiClient.post('/auth/refresh');
  return res.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
