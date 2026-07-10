'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/shared/providers/auth-provider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
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
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
      <section className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-soft dark:bg-slate-900 sm:p-10">
        <p className="text-center text-sm font-bold uppercase tracking-[0.3em] text-primary">SJT</p>
        <h1 className="mt-4 text-center font-display text-3xl font-bold text-slate-950 dark:text-white">Daftar Akun</h1>
        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">Buat akun customer baru untuk mulai booking.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Field label="Nama Lengkap" id="name" type="text" autoComplete="name" value={form.name} onChange={(v) => update('name', v)} placeholder="Nama kamu" />
          <Field label="Email" id="email" type="email" autoComplete="email" value={form.email} onChange={(v) => update('email', v)} placeholder="nama@email.com" />
          <Field label="Nomor HP" id="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(v) => update('phone', v)} placeholder="08xxxxxxxxxx" />
          <Field label="Password" id="password" type="password" autoComplete="new-password" value={form.password} onChange={(v) => update('password', v)} placeholder="Minimal 8 karakter" />
          <Field label="Konfirmasi Password" id="password_confirmation" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(v) => update('password_confirmation', v)} placeholder="Ulangi password" />

          {error ? <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
            {submitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-primary hover:underline">Login di sini</Link>
        </p>
      </section>
    </main>
  );
}

function Field({ label, id, type, autoComplete, value, onChange, placeholder }: { label: string; id: string; type: string; autoComplete: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</label>
      <input
        id={id}
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
      />
    </div>
  );
}
