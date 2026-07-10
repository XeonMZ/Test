'use client';

import { CheckCircle2, Hash, Loader2, QrCode, ScanLine, Users, UserX } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  boardPassenger,
  checkInByCode,
  checkInPassenger,
  markNoShow,
  verifyTicket,
  type VerifiedTicket,
} from '@/services/portal';
import { QrScanner } from '@/features/driver-portal/qr-scanner';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, SectionHeader } from '@/shared/ui/components';

type Mode = 'scan' | 'payload' | 'code';

const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60';
const btnSuccess = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700 disabled:opacity-60';
const btnDanger = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60';
const inputClass = 'min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 font-mono text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';

/**
 * Passenger check-in console. Three input paths, all hitting the real API:
 *  - Scan QR: camera or uploaded photo, decoded client-side then verified.
 *  - Paste payload: raw signed QR payload string, verified.
 *  - Ticket code: human-readable ticket number, checked in directly.
 */
export function CheckInConsole() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('scan');
  const [payload, setPayload] = useState('');
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState<VerifiedTicket | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const verifyMutation = useMutation({
    mutationFn: verifyTicket,
    onSuccess: (ticket) => {
      setVerified(ticket);
      setLastAction(null);
      toast(`Tiket ${ticket.ticket_number ?? ''} valid.`, 'success');
    },
    onError: (error) => {
      setVerified(null);
      toast(extractApiError(error, 'Tiket tidak valid.'), 'error');
    },
  });

  // Check-in from a verified QR payload.
  const checkInMutation = useMutation({
    mutationFn: (raw: string) => checkInPassenger(raw),
    onSuccess: () => {
      setLastAction('checked_in');
      toast('Penumpang berhasil check-in.', 'success');
    },
    onError: (error) => toast(extractApiError(error, 'Check-in gagal.'), 'error'),
  });

  // Check-in directly by ticket number.
  const codeMutation = useMutation({
    mutationFn: (ticketNumber: string) => checkInByCode(ticketNumber),
    onSuccess: () => {
      setLastAction('checked_in');
      toast('Penumpang berhasil check-in via kode tiket.', 'success');
      setCode('');
    },
    onError: (error) => toast(extractApiError(error, 'Check-in via kode gagal.'), 'error'),
  });

  const boardMutation = useMutation({
    mutationFn: () => boardPassenger(String(verified?.uuid ?? '')),
    onSuccess: () => {
      setLastAction('boarded');
      toast('Penumpang naik ke armada.', 'success');
    },
    onError: (error) => toast(extractApiError(error, 'Boarding gagal.'), 'error'),
  });

  const noShowMutation = useMutation({
    mutationFn: () => markNoShow(String(verified?.uuid ?? '')),
    onSuccess: () => {
      setLastAction('no_show');
      toast('Penumpang ditandai tidak hadir.', 'success');
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menandai no-show.'), 'error'),
  });

  const busy = checkInMutation.isPending || boardMutation.isPending || noShowMutation.isPending;

  // When the scanner or paste yields a payload, verify then auto check-in.
  function handlePayload(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setPayload(value);
    verifyMutation.mutate(value, {
      onSuccess: () => checkInMutation.mutate(value),
    });
  }

  return (
    <AppCard>
      <SectionHeader title="Check-in penumpang" description="Pindai QR dengan kamera atau foto, tempel payload, atau masukkan kode tiket." />

      <div className="mt-5 inline-flex rounded-2xl border border-slate-200 p-1 dark:border-slate-800" role="tablist" aria-label="Mode check-in">
        {([['scan', 'Scan QR', QrCode], ['payload', 'Tempel Payload', ScanLine], ['code', 'Kode Tiket', Hash]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={clsx('inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition sm:text-sm', mode === id ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-primary dark:text-slate-300')}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {mode === 'scan' ? (
          <QrScanner onDetected={handlePayload} />
        ) : mode === 'payload' ? (
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); handlePayload(payload); }}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Payload QR</span>
              <input value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Tempel payload QR tiket di sini…" className={inputClass} />
            </label>
            <button type="submit" disabled={verifyMutation.isPending || !payload.trim()} className={btnPrimary}>
              {verifyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />} Verifikasi & check-in
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (code.trim()) codeMutation.mutate(code.trim()); }}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Nomor tiket</span>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Contoh: TIX-A1B2C3" className={inputClass} />
            </label>
            <button type="submit" disabled={codeMutation.isPending || !code.trim()} className={btnPrimary}>
              {codeMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Hash size={15} />} Check-in via kode
            </button>
          </form>
        )}
      </div>

      {verifyMutation.isPending && mode === 'scan' ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 size={15} className="animate-spin" /> Memverifikasi tiket…</p>
      ) : null}

      {verified ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60"><QrCode size={20} /></span>
            <div className="min-w-0">
              <p className="font-mono text-sm font-extrabold tracking-widest text-slate-900 dark:text-slate-100">{verified.ticket_number ?? verified.uuid}</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Tiket valid — status: {String(verified.status ?? 'issued').replaceAll('_', ' ')}</p>
            </div>
            {lastAction ? <Badge tone={lastAction === 'no_show' ? 'danger' : 'success'}>{lastAction.replaceAll('_', ' ')}</Badge> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => checkInMutation.mutate(payload.trim())} disabled={busy || !payload.trim()} className={btnPrimary}><CheckCircle2 size={15} /> Check-in ulang</button>
            <button onClick={() => boardMutation.mutate()} disabled={busy} className={btnSuccess}><Users size={15} /> Naikkan (board)</button>
            <button onClick={() => noShowMutation.mutate()} disabled={busy} className={btnDanger}><UserX size={15} /> Tidak hadir</button>
          </div>
        </div>
      ) : null}
    </AppCard>
  );
}
