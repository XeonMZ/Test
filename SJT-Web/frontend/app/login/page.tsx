'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/providers/auth-provider';

const roleRedirect: Record<string, string> = {
  customer: '/customer',
  driver: '/driver',
  admin: '/admin',
  owner: '/owner',
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email, password, remember });
      // Prevent open-redirect: only allow internal same-origin paths.
      const rawNext = searchParams.get('next');
      const safeNext = rawNext && /^\/(?!\/)/.test(rawNext) && rawNext !== '/login' ? rawNext : null;
      router.replace(safeNext ?? (roleRedirect[user.role] ?? '/'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft dark:bg-slate-900 sm:p-10">
        <p className="text-center text-sm font-bold uppercase tracking-[0.3em] text-primary">SJT</p>
        <h1 className="mt-4 text-center font-display text-3xl font-bold text-slate-950 dark:text-white">Login</h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Masuk untuk melanjutkan ke akun kamu.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
              Ingat saya
            </label>
            <Link href="/forgot-password" className="font-bold text-primary hover:underline">Lupa password?</Link>
          </div>

          {error ? <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            {submitting ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Belum punya akun?{' '}
          <Link href="/register" className="font-bold text-primary hover:underline">Daftar sekarang</Link>
        </p>
      </section>
    </main>
  );
}
