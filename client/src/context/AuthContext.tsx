import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { AuthResponse } from '@workout-app/shared';
import * as authApi from '../api/auth';
import { setAccessToken } from '../api/client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  unitPreference: 'kg' | 'lb';
  theme: 'light' | 'dark' | 'system';
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleAuthResponse = useCallback((data: AuthResponse) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  useEffect(() => {
    authApi
      .refresh()
      .then((data) => {
        setAccessToken(data.accessToken);
        // After refresh we only get a token, fetch user profile
        import('../api/client').then(({ default: apiClient }) => {
          apiClient
            .get('/users/me')
            .then((res) => setUser(res.data))
            .catch(() => {
              setAccessToken(null);
              setUser(null);
            })
            .finally(() => setIsLoading(false));
        });
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await authApi.register({ email, password, name });
      handleAuthResponse(data);
    },
    [handleAuthResponse]
  );

  const logoutFn = useCallback(async () => {
    await authApi.logout();
    setAccessToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout: logoutFn, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
