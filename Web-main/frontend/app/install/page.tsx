'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/button';
import { http } from '@/services/http';

type Requirement = { ok: boolean; message: string };
type Status = { installed: boolean; requirements: Record<string, Requirement> };
const steps = [
  'Welcome',
  'Company Profile',
  'Owner Account',
  'Admin Account',
  'Default Configuration',
  'Payment Configuration',
  'Mail Configuration',
  'Finish',
];
const initialForm = {
  company: {
    name: '',
    logo: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    timezone: 'UTC',
    currency: 'USD',
  },
  owner: { name: '', email: '', password: '', password_confirmation: '' },
  admin: { name: '', email: '', password: '', password_confirmation: '' },
  configuration: {
    seat_lock_minutes: 10,
    ticket_expiry_minutes: 30,
    payment_expiry_minutes: 15,
    timezone: 'UTC',
    language: 'en',
    currency: 'USD',
  },
  payment: {
    midtrans: { server_key: '', client_key: '', environment: 'sandbox' },
  },
  mail: {
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'tls',
    sender_name: '',
    sender_email: '',
  },
  demo_data: false,
};

export default function InstallPage() {
  const [step, setStep] = useState(0),
    [form, setForm] = useState(initialForm),
    [status, setStatus] = useState<Status | null>(null),
    [loading, setLoading] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    http
      .get('/installer/status')
      .then((r) => setStatus(r.data))
      .catch(() => setError('Unable to check installer status.'));
  }, []);
  const progress = useMemo(
    () => Math.round(((step + 1) / steps.length) * 100),
    [step],
  );
  const set = (path: string, value: string | number | boolean) =>
    setForm((current) => {
      const next: any = structuredClone(current);
      path
        .split('.')
        .reduce(
          (node, key, i, parts) =>
            i === parts.length - 1 ? (node[key] = value) : node[key],
          next,
        );
      return next;
    });
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (step < steps.length - 1) return setStep((s) => s + 1);
    setLoading(true);
    try {
      await http.post('/installer/install', form);
      setDone(true);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1800);
    } catch (e: any) {
      setError(
        e.response?.data?.message ??
          'Installation failed. Please check validation errors.',
      );
    } finally {
      setLoading(false);
    }
  }
  if (status?.installed || done)
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <section className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center text-slate-950 shadow-soft">
          <h1 className="font-display text-4xl font-bold">
            Installation complete
          </h1>
          <p className="mt-4 text-slate-600">
            The bootstrap wizard is locked and cannot be reopened.
          </p>
          <a
            className="mt-8 inline-flex rounded-2xl bg-primary px-6 py-3 font-semibold text-white"
            href="/login"
          >
            Go to login
          </a>
        </section>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <form
        onSubmit={submit}
        className="mx-auto max-w-5xl rounded-[2rem] bg-white p-6 shadow-soft md:p-10"
      >
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary">
          STMS First-Time Setup
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-3 flex-1 rounded-full bg-slate-200">
            <div
              className="h-3 rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm font-semibold">{progress}%</span>
        </div>
        <div className="mt-6 grid gap-2 md:grid-cols-4">
          {steps.map((name, i) => (
            <button
              type="button"
              key={name}
              onClick={() => i < step && setStep(i)}
              className={`rounded-2xl px-3 py-2 text-sm ${i === step ? 'bg-primary text-white' : i < step ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-500'}`}
            >
              {i + 1}. {name}
            </button>
          ))}
        </div>
        <section className="mt-8">
          <h1 className="font-display text-3xl font-bold text-slate-950">
            {steps[step]}
          </h1>
          {renderStep(step, form, set, status)}
        </section>
        {error && (
          <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        <div className="mt-8 flex justify-between">
          <Button
            type="button"
            disabled={step === 0 || loading}
            onClick={() => setStep((s) => s - 1)}
            className="bg-slate-700 hover:bg-slate-800"
          >
            Back
          </Button>
          <Button disabled={loading}>
            {loading
              ? 'Installing…'
              : step === steps.length - 1
                ? 'Finish & Lock Installer'
                : 'Next'}
          </Button>
        </div>
      </form>
    </main>
  );
}
function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = true,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold capitalize text-slate-700">
        {label}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-primary"
      />
    </label>
  );
}
function renderStep(
  step: number,
  form: typeof initialForm,
  set: (path: string, value: string | number | boolean) => void,
  status: Status | null,
) {
  const grid = 'mt-6 grid gap-4 md:grid-cols-2';
  if (step === 0)
    return (
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {Object.entries(status?.requirements ?? {}).map(([k, v]) => (
          <div key={k} className="rounded-2xl border p-4">
            <p className="font-semibold capitalize">
              {k}: {v.ok ? 'Ready' : 'Check required'}
            </p>
            <p className="text-sm text-slate-500">{v.message}</p>
          </div>
        ))}
        <p className="md:col-span-2 text-slate-600">
          Welcome. This wizard verifies PHP, database, storage, queue, cache,
          and Reverb before saving bootstrap settings.
        </p>
      </div>
    );
  if (step === 1)
    return (
      <div className={grid}>
        {[
          'name',
          'logo',
          'address',
          'phone',
          'email',
          'website',
          'timezone',
          'currency',
        ].map((k) => (
          <Input
            key={k}
            required={!['logo', 'website'].includes(k)}
            label={k.replace('_', ' ')}
            value={(form.company as any)[k]}
            onChange={(v) => set(`company.${k}`, v)}
          />
        ))}
      </div>
    );
  if (step === 2 || step === 3) {
    const p = step === 2 ? 'owner' : 'admin';
    return (
      <div className={grid}>
        <Input
          label="Full Name"
          value={(form as any)[p].name}
          onChange={(v) => set(`${p}.name`, v)}
        />
        <Input
          label="Email"
          type="email"
          value={(form as any)[p].email}
          onChange={(v) => set(`${p}.email`, v)}
        />
        <Input
          label="Password"
          type="password"
          value={(form as any)[p].password}
          onChange={(v) => set(`${p}.password`, v)}
        />
        <Input
          label="Password Confirmation"
          type="password"
          value={(form as any)[p].password_confirmation}
          onChange={(v) => set(`${p}.password_confirmation`, v)}
        />
      </div>
    );
  }
  if (step === 4)
    return (
      <div className={grid}>
        {[
          'seat_lock_minutes',
          'ticket_expiry_minutes',
          'payment_expiry_minutes',
          'timezone',
          'language',
          'currency',
        ].map((k) => (
          <Input
            key={k}
            label={k.replaceAll('_', ' ')}
            value={(form.configuration as any)[k]}
            onChange={(v) =>
              set(
                `configuration.${k}`,
                [
                  'seat_lock_minutes',
                  'ticket_expiry_minutes',
                  'payment_expiry_minutes',
                ].includes(k)
                  ? Number(v)
                  : v,
              )
            }
          />
        ))}
      </div>
    );
  if (step === 5)
    return (
      <div className={grid}>
        <Input
          required={false}
          label="Server Key"
          value={form.payment.midtrans.server_key}
          onChange={(v) => set('payment.midtrans.server_key', v)}
        />
        <Input
          required={false}
          label="Client Key"
          value={form.payment.midtrans.client_key}
          onChange={(v) => set('payment.midtrans.client_key', v)}
        />
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Environment
          </span>
          <select
            value={form.payment.midtrans.environment}
            onChange={(e) =>
              set('payment.midtrans.environment', e.target.value)
            }
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3"
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </label>
      </div>
    );
  if (step === 6)
    return (
      <div className={grid}>
        {[
          'host',
          'port',
          'username',
          'password',
          'encryption',
          'sender_name',
          'sender_email',
        ].map((k) => (
          <Input
            key={k}
            required={!['username', 'password', 'encryption'].includes(k)}
            label={k.replace('_', ' ')}
            value={(form.mail as any)[k]}
            onChange={(v) => set(`mail.${k}`, k === 'port' ? Number(v) : v)}
          />
        ))}
      </div>
    );
  return (
    <div className="mt-6 space-y-4">
      <p className="text-slate-600">
        Finish will save configuration, seed required data, generate an
        application key if needed, lock the installer, and redirect to login.
      </p>
      <label className="flex items-center gap-3 rounded-2xl bg-blue-50 p-4 font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={form.demo_data}
          onChange={(e) => set('demo_data', e.target.checked)}
        />{' '}
        Create Demo Data
      </label>
    </div>
  );
}
