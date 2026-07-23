'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { LegalConsent, LegalLink } from '@/features/legal/legal-consent';
import { PasswordField, PasswordStrengthMeter, validateEmail, validateNewPassword } from '@/shared/ui/auth/password-field';
import { useAuth } from '@/shared/providers/auth-provider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Account creation is blocked until the customer accepts the legal terms.
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError('Kamu harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi untuk membuat akun.');
      return;
    }
    const emailError = validateEmail(form.email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passwordError = validateNewPassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      router.replace('/customer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cloud px-4 py-12 dark:bg-ink-deep">
      <section className="w-full max-w-md rounded-2xl bg-canvas p-8 shadow-soft dark:bg-ink sm:p-10">
        <p className="text-center text-xs font-semibold uppercase tracking-button text-primary">SJT</p>
        <h1 className="mt-4 text-center font-display text-3xl font-medium tracking-tight text-ink dark:text-white">Daftar Akun</h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Buat akun customer baru untuk mulai booking.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Field label="Nama Lengkap" id="name" type="text" autoComplete="name" value={form.name} onChange={(v) => update('name', v)} placeholder="Nama kamu" />
          <Field label="Email" id="email" type="email" autoComplete="email" value={form.email} onChange={(v) => update('email', v)} placeholder="nama@email.com" />
          <Field label="Nomor HP" id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(v) => update('phone', v)} placeholder="08xxxxxxxxxx" />
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">Password</label>
            <PasswordField id="password" autoComplete="new-password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Min. 8 karakter, huruf besar/kecil, angka, simbol" />
            <PasswordStrengthMeter password={form.password} />
          </div>
          <div>
            <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">Konfirmasi Password</label>
            <PasswordField id="password_confirmation" autoComplete="new-password" value={form.password_confirmation} onChange={(e) => update('password_confirmation', e.target.value)} placeholder="Ulangi password" />
          </div>

          <LegalConsent id="accept-terms" checked={acceptedTerms} onChange={setAcceptedTerms}>
            Saya telah membaca dan menyetujui <LegalLink href="/terms-and-conditions">Syarat &amp; Ketentuan</LegalLink> serta{' '}
            <LegalLink href="/privacy-policy">Kebijakan Privasi</LegalLink>.
          </LegalConsent>

          {error ? <p role="alert" className="rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting || !acceptedTerms}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold uppercase tracking-button text-white transition-colors hover:bg-primary-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-steel"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            {submitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">Login di sini</Link>
        </p>
      </section>
    </main>
  );
}

function Field({ label, id, type, autoComplete, value, onChange, placeholder }: { label: string; id: string; type: string; autoComplete: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink dark:text-slate-200">{label}</label>
      <input
        id={id}
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100 dark:focus:border-primary-bright"
      />
    </div>
  );
}
