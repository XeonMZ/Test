'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { http } from '@/services/http';
import { extractApiError } from '@/services/stms';
import { OtpInput } from '@/shared/ui/otp-input';

const inputClass =
  'h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100 dark:focus:border-primary-bright';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Password reset step 2: redeem the 6-digit code mailed by /forgot-password
 * and set a new password.
 *
 * The email arrives as a code rather than a link, so this page is reachable
 * directly and pre-fills only the address (passed along from step 1). It never
 * reveals whether an address is registered — the resend action reports the
 * same thing either way, matching the backend's generic reply.
 */
function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const submit = useCallback(
    async (submittedCode: string) => {
      setError(null);
      setNotice(null);
      setSubmitting(true);
      try {
        const response = await http.post<{ success: boolean; message: string }>('/reset-password', {
          email,
          code: submittedCode,
          password,
          password_confirmation: confirmation,
        });
        setMessage(response.data.message || 'Password berhasil diubah. Silakan masuk dengan password baru Anda.');
        window.setTimeout(() => router.push('/login'), 2500);
      } catch (err) {
        setError(extractApiError(err, 'Kode salah atau sudah kedaluwarsa. Minta kode baru bila perlu.'));
        setCode('');
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, confirmation, router],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(code);
  }

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setError(null);
    setResending(true);
    try {
      const response = await http.post<{ success: boolean; message: string }>('/forgot-password', { email });
      setNotice(response.data.message);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(extractApiError(err, 'Gagal mengirim ulang kode. Coba lagi sebentar.'));
    } finally {
      setResending(false);
    }
  }

  if (message) {
    return (
      <>
        <p role="status" className="mt-6 rounded-md bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {message}
        </p>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/login" className="font-semibold text-primary hover:underline">Lanjut ke Login</Link>
        </p>
      </>
    );
  }

  const canSubmit = code.length === 6 && password.length >= 8 && confirmation.length >= 8 && email !== '';

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
          className={inputClass}
        />
      </div>

      <div>
        <OtpInput
          value={code}
          onChange={setCode}
          disabled={submitting}
          invalid={error !== null}
          autoFocus={email !== ''}
          label="Kode verifikasi (6 digit)"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">Kode dikirim ke email Anda dan berlaku 10 menit.</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0 || email === ''}
            className="shrink-0 text-xs font-semibold text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
          >
            {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : resending ? 'Mengirim…' : 'Kirim ulang kode'}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">Password baru</label>
        <input id="password" type="password" required autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
        <p className="mt-1.5 text-xs text-slate-400">Minimal 8 karakter dengan huruf besar-kecil, angka, dan simbol.</p>
      </div>

      <div>
        <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">Ulangi password baru</label>
        <input id="password_confirmation" type="password" required autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className={inputClass} />
      </div>

      {notice ? <p role="status" className="rounded-md bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">{notice}</p> : null}
      {error ? <p role="alert" className="rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || !canSubmit}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-button text-white transition-colors hover:bg-primary-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-steel"
      >
        {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
        {submitting ? 'Menyimpan…' : 'Reset Password'}
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Belum punya kode? <Link href="/forgot-password" className="font-semibold text-primary hover:underline">Minta kode reset</Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud px-4 py-12 dark:bg-ink-deep">
      <section className="w-full max-w-md rounded-2xl bg-canvas p-8 shadow-soft dark:bg-ink sm:p-10">
        <p className="text-center text-xs font-semibold uppercase tracking-button text-primary">SJT</p>
        <h1 className="mt-4 text-center font-display text-3xl font-medium tracking-tight text-ink dark:text-white">Reset Password</h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
          Masukkan kode yang kami kirim ke email Anda, lalu buat password baru.
        </p>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </section>
    </main>
  );
}
