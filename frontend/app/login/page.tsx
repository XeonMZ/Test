'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/providers/auth-provider';
import { PasswordField, validateEmail, validateLoginPassword } from '@/shared/ui/auth/password-field';

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
    const emailError = validateEmail(email);
    const passwordError = validateLoginPassword(password);
    if (emailError || passwordError) {
      setError(emailError ?? passwordError);
      return;
    }
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
    <main className="flex min-h-screen items-center justify-center bg-cloud px-4 py-12 dark:bg-ink-deep">
      <section className="w-full max-w-md rounded-md bg-canvas p-8 shadow-soft dark:bg-ink sm:p-10">
        <p className="text-center text-xs font-semibold uppercase tracking-button text-primary">SJT</p>
        <h1 className="mt-4 text-center font-display text-3xl font-medium tracking-tight text-ink dark:text-white">Login</h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Masuk untuk melanjutkan ke akun kamu.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
              className="h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100 dark:focus:border-primary-bright"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">Password</label>
            <PasswordField
              id="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
              Ingat saya
            </label>
            <Link href="/forgot-password" className="font-semibold text-primary hover:underline">Lupa password?</Link>
          </div>

          {error ? <p role="alert" className="rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-button text-white transition-colors hover:bg-primary-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-steel"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            {submitting ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">Daftar sekarang</Link>
        </p>
      </section>
    </main>
  );
}
