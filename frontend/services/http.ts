import axios from 'axios';
import { clearAuthSession, getStoredToken } from '@/shared/lib/auth-storage';
import { resolveApiBaseUrl } from './api-config';

export const http = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

http.interceptors.request.use((config) => {
  // Re-resolve per request. The axios instance is created at module load,
  // which can happen before the runtime-config script has run; re-resolving
  // here guarantees the value injected by the server layout is honoured.
  if (typeof window !== 'undefined') {
    const resolved = resolveApiBaseUrl();
    if (resolved !== http.defaults.baseURL) http.defaults.baseURL = resolved;
    config.baseURL = resolved;
  }

  const token = getStoredToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/install'];
      const onPublicPath = publicPaths.some((path) => window.location.pathname.startsWith(path));
      clearAuthSession();
      if (!onPublicPath) {
        const next = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?next=${next}`;
      }
    }
    return Promise.reject(error);
  },
);
