import type { AppRole } from '@/shared/ui/navigation/types';

export type AuthUser = {
  id: number;
  uuid?: string;
  name: string;
  email: string;
  role: AppRole;
  [key: string]: unknown;
};

const TOKEN_KEY = 'stms.auth.token';
const USER_KEY = 'stms.auth.user';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getStoredToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: AuthUser) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* ignore storage failures (e.g. private mode) */
  }
}

export function clearAuthSession() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}
