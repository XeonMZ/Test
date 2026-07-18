'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';

/**
 * Enterprise-grade validation helpers used by login & register.
 */

// RFC-5322-lite: good enough to reject obviously invalid addresses without
// being hostile to valid ones.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return 'Email wajib diisi.';
  if (value.length > 254) return 'Email terlalu panjang.';
  if (!EMAIL_RE.test(value)) return 'Format email tidak valid.';
  return null;
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string; issues: string[] };

/**
 * Enterprise password policy: min 8 chars, upper, lower, number, symbol.
 * Returns the list of unmet requirements plus a 0–4 strength score.
 */
export function checkPasswordStrength(password: string): PasswordStrength {
  const issues: string[] = [];
  if (password.length < 8) issues.push('minimal 8 karakter');
  if (!/[A-Z]/.test(password)) issues.push('huruf besar');
  if (!/[a-z]/.test(password)) issues.push('huruf kecil');
  if (!/[0-9]/.test(password)) issues.push('angka');
  if (!/[^A-Za-z0-9]/.test(password)) issues.push('simbol');

  const met = 5 - issues.length;
  const score = Math.max(0, Math.min(4, met - 1)) as PasswordStrength['score'];
  const label = ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][score];
  return { score, label, issues };
}

/** For login we only need "not empty"; the server enforces the rest. */
export function validateLoginPassword(password: string): string | null {
  if (!password) return 'Password wajib diisi.';
  return null;
}

/** For registration we enforce the full enterprise policy client-side. */
export function validateNewPassword(password: string): string | null {
  const { issues } = checkPasswordStrength(password);
  if (issues.length > 0) return `Password harus mengandung ${issues.join(', ')}.`;
  return null;
}

const baseInput =
  'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

type PasswordFieldProps = InputHTMLAttributes<HTMLInputElement> & { id: string };

/**
 * Password input with a show/hide eye toggle (#6). Drop-in replacement for a
 * bare <input type="password">.
 */
export function PasswordField({ id, className, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} className={className ?? baseInput} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-2xl text-slate-400 transition hover:text-primary"
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
        tabIndex={-1}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/** Small strength meter for the register form. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { score, label } = checkPasswordStrength(password);
  const colors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? colors[score] : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Kekuatan: {label}</p>
    </div>
  );
}
