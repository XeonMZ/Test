'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { http } from '@/services/http';
import { extractApiError } from '@/services/stms';

const inputClass =
  'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

/**
 * Consumes the token from the password-reset email
 * (…/reset-password?token=…&email=…) and calls POST /reset-password.
 */
function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') ?? '';
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await http.post<{ success: boolean; message: string }>('/reset-password', {
        token,
        email,
        password,
        password_confirmation: confirmation,
      });
      setMessage(response.data.message || 'Password berhasil direset. Silakan login dengan password baru.');
      window.setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(extractApiError(err, 'Gagal mereset password. Link mungkin sudah kedaluwarsa.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <>
        <p role="alert" className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
          Link reset tidak valid atau tidak lengkap. Minta link baru dari halaman lupa password.
        </p>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/forgot-password" className="font-bold text-primary hover:underline">Kirim ulang link reset</Link>
        </p>
      </>
    );
  }

  if (message) {
    return (
      <>
        <p role="status" className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">{message}</p>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/login" className="font-bold text-primary hover:underline">Lanjut ke Login</Link>
        </p>
      </>
    );
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Password baru</label>
        <input id="password" type="password" required autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
        <p className="mt-1.5 text-xs text-slate-400">Minimal 8 karakter dengan huruf besar-kecil, angka, dan simbol.</p>
      </div>
      <div>
        <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Ulangi password baru</label>
        <input id="password_confirmation" type="password" required autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} />
      </div>

      {error ? <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
        {submitting ? 'Menyimpan…' : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft dark:bg-slate-900 sm:p-10">
        <p className="text-center text-sm font-bold uppercase tracking-[0.3em] text-primary">SJT</p>
        <h1 className="mt-4 text-center font-display text-3xl font-bold text-slate-950 dark:text-white">Reset Password</h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Buat password baru untuk akunmu.</p>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
