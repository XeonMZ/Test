'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';
import { confirmVerificationCode, extractApiError, sendVerificationCode } from '@/services/stms';
import { OtpInput } from '@/shared/ui/otp-input';

type EmailVerificationPanelProps = {
  email: string;
  /** Query keys to refresh once the address is verified. */
  invalidateKeys?: string[][];
  onVerified?: () => void;
  toast?: (message: string, tone: 'success' | 'error' | 'info') => void;
  className?: string;
};

/** Matches the backend resend cooldown so the button can't outrun it. */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Email verification, done entirely inside the profile page.
 *
 * The user asks for a code, reads it from their inbox, and types it here —
 * no round trip through a link, and no leaving the app. The panel holds two
 * states: idle (nothing outstanding) and awaiting (a code is in flight), and
 * it only ever renders for accounts that are not yet verified.
 */
export function EmailVerificationPanel({
  email,
  invalidateKeys = [['profile']],
  onVerified,
  toast,
  className,
}: EmailVerificationPanelProps) {
  const queryClient = useQueryClient();
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const sendMutation = useMutation({
    mutationFn: sendVerificationCode,
    onSuccess: (res) => {
      setError(null);
      setAwaitingCode(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast?.(res.message, res.verified ? 'success' : 'info');
    },
    onError: (err) => {
      const message = extractApiError(err, 'Gagal mengirim kode verifikasi.');
      setError(message);
      toast?.(message, 'error');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (submitted: string) => confirmVerificationCode(submitted),
    onSuccess: (res) => {
      setError(null);
      setCode('');
      setAwaitingCode(false);
      toast?.(res.message, 'success');
      invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      onVerified?.();
    },
    onError: (err) => {
      // The backend returns one generic message for wrong/expired/exhausted —
      // don't try to guess which, just show it and clear the boxes.
      const message = extractApiError(err, 'Kode salah atau sudah kedaluwarsa.');
      setError(message);
      setCode('');
      toast?.(message, 'error');
    },
  });

  const busy = sendMutation.isPending || confirmMutation.isPending;

  if (!awaitingCode) {
    return (
      <div className={clsx('rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left dark:border-amber-500/40 dark:bg-amber-950/30', className)}>
        <p className="flex items-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
          <ShieldAlert size={15} className="mt-px shrink-0" />
          <span>Email <strong>{email}</strong> belum terverifikasi. Kami akan mengirim kode 6 digit ke alamat ini.</span>
        </p>
        <button
          type="button"
          onClick={() => sendMutation.mutate()}
          disabled={busy}
          className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-extrabold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
          Kirim kode verifikasi
        </button>
        {error ? <p role="alert" className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={clsx('rounded-2xl border border-slate-200 bg-white p-4 text-left dark:border-slate-800 dark:bg-slate-900', className)}>
      <p className="flex items-start gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
        <Mail size={15} className="mt-px shrink-0 text-primary" />
        <span>Kode dikirim ke <strong>{email}</strong>. Masukkan 6 digit di bawah ini — berlaku 10 menit.</span>
      </p>

      <div className="mt-3">
        <OtpInput
          value={code}
          onChange={(next) => {
            setCode(next);
            if (error) setError(null);
          }}
          onComplete={(complete) => confirmMutation.mutate(complete)}
          disabled={confirmMutation.isPending}
          invalid={error !== null}
          autoFocus
          label="Kode verifikasi"
        />
      </div>

      {error ? <p role="alert" className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => confirmMutation.mutate(code)}
          disabled={code.length !== 6 || busy}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-extrabold text-white transition-colors hover:bg-primary-bright disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {confirmMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
          Verifikasi
        </button>

        <button
          type="button"
          onClick={() => sendMutation.mutate()}
          disabled={cooldown > 0 || busy}
          className="text-xs font-bold text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
        >
          {cooldown > 0 ? `Kirim ulang (${cooldown}s)` : 'Kirim ulang kode'}
        </button>

        <button
          type="button"
          onClick={() => {
            setAwaitingCode(false);
            setCode('');
            setError(null);
          }}
          disabled={busy}
          className="ml-auto text-xs font-bold text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed"
        >
          Nanti saja
        </button>
      </div>
    </div>
  );
}
