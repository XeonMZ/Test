import axios from 'axios';
import { clearAuthSession, getStoredToken } from '@/shared/lib/auth-storage';

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

http.interceptors.request.use((config) => {
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
      const publicPaths = ['/login', '/register', '/forgot-password', '/install'];
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
