'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { http } from '@/services/http';
import { type AuthUser, clearAuthSession, getStoredToken, getStoredUser, setAuthSession } from '@/shared/lib/auth-storage';

type ApiEnvelope<T> = { success: boolean; message: string; data: T };

type LoginPayload = { email: string; password: string; remember?: boolean };
type RegisterPayload = { name: string; email: string; password: string; password_confirmation: string; phone: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  forgotPassword: (email: string) => Promise<string>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  if (response?.data?.errors) {
    const firstField = Object.values(response.data.errors)[0];
    if (Array.isArray(firstField) && firstField.length > 0) return firstField[0];
  }
  return response?.data?.message ?? fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  const applySession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setAuthSession(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      try {
        const response = await http.post<ApiEnvelope<{ token: string; user: AuthUser }>>('/login', payload);
        const { token: nextToken, user: nextUser } = response.data.data;
        applySession(nextToken, nextUser);
        return nextUser;
      } catch (error) {
        throw new Error(extractErrorMessage(error, 'Login gagal. Periksa kembali email dan password kamu.'));
      }
    },
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      try {
        const response = await http.post<ApiEnvelope<{ token: string; user: AuthUser }>>('/register', payload);
        const { token: nextToken, user: nextUser } = response.data.data;
        applySession(nextToken, nextUser);
        return nextUser;
      } catch (error) {
        throw new Error(extractErrorMessage(error, 'Registrasi gagal. Periksa kembali data yang kamu isi.'));
      }
    },
    [applySession],
  );

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const response = await http.post<ApiEnvelope<[]>>('/forgot-password', { email });
      return response.data.message;
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Gagal mengirim link reset password.'));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await http.post('/logout');
    } catch {
      /* even if the API call fails, clear the local session */
    } finally {
      clearAuthSession();
      setToken(null);
      setUser(null);
      setStatus('unauthenticated');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, status, isAuthenticated: status === 'authenticated', login, register, forgotPassword, logout }),
    [user, token, status, login, register, forgotPassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
