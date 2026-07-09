'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/providers/auth-provider';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const responseMessage = await forgotPassword(email);
      setMessage(responseMessage || 'Link reset password sudah dikirim ke email kamu.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim link reset password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft dark:bg-slate-900 sm:p-10">
        <p className="text-center text-sm font-bold uppercase tracking-[0.3em] text-primary">STMS</p>
        <h1 className="mt-4 text-center font-display text-3xl font-bold text-slate-950 dark:text-white">Lupa Password</h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Masukkan email kamu, kami kirim link reset password.</p>

        {message ? (
          <p role="status" className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>
        ) : (
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

            {error ? <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              {submitting ? 'Mengirim...' : 'Kirim Link Reset'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Ingat password kamu?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">Kembali ke Login</Link>
        </p>
      </section>
    </main>
  );
}
