'use client';

import { clsx } from 'clsx';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock, CreditCard, Loader2, QrCode, RefreshCw, Smartphone, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createPayment,
  extractApiError,
  fetchBooking,
  fetchPayment,
  formatDateTime,
  formatIDR,
} from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';

const METHODS = [
  { id: 'qris', label: 'QRIS', description: 'Scan sekali bayar dari semua e-wallet & mobile banking.', icon: QrCode },
  { id: 'virtual_account', label: 'Virtual Account', description: 'Transfer ke nomor VA khusus, verifikasi otomatis.', icon: Building2 },
  { id: 'bank_transfer', label: 'Bank Transfer', description: 'Transfer manual antar bank dengan konfirmasi webhook.', icon: CreditCard },
  { id: 'ewallet', label: 'E-Wallet', description: 'Bayar langsung dari aplikasi dompet digital.', icon: Smartphone },
] as const;

function useCountdown(target: string | null | undefined) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!target) {
      setRemaining(null);
      return;
    }
    const end = new Date(target).getTime();
    if (Number.isNaN(end)) return;
    const tick = () => setRemaining(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return remaining;
}

function formatCountdown(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function PaymentFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookingUuid = params.get('booking');
  const [method, setMethod] = useState<string>(METHODS[0].id);
  const [error, setError] = useState<string | null>(null);

  const bookingQuery = useQuery({
    queryKey: ['payment-booking', bookingUuid],
    queryFn: () => fetchBooking(bookingUuid!),
    enabled: Boolean(bookingUuid),
  });

  const booking = bookingQuery.data;
  const remaining = useCountdown(booking?.expires_at as string | undefined);
  const expired = remaining === 0 || booking?.status === 'expired' || booking?.status === 'cancelled';
  const alreadyPaid = booking?.status === 'paid' || booking?.status === 'ticket_generated' || booking?.status === 'completed';

  const payMutation = useMutation({
    mutationFn: () => createPayment({ booking_uuid: bookingUuid!, amount: Math.round(Number(booking?.amount ?? 0)), method }),
    onSuccess: (result) => {
      toast('Pembayaran dibuat. Menunggu konfirmasi…', 'success');
      router.push(`/payment/waiting?payment=${result.payment.uuid}&booking=${bookingUuid}`);
    },
    onError: (err) => {
      const message = extractApiError(err, 'Gagal membuat pembayaran.');
      setError(message);
      toast(message, 'error');
    },
  });

  const seatNumbers = useMemo(() => {
    const reservations = (booking as { seat_reservations?: Array<{ vehicle_seat?: { seat_number?: string } }> } | undefined)?.seat_reservations;
    return reservations?.map((r) => r.vehicle_seat?.seat_number).filter(Boolean).join(', ') ?? null;
  }, [booking]);

  if (!bookingUuid) {
    return <StateCard tone="warning" icon={AlertTriangle} title="Booking tidak ditemukan" description="Halaman ini membutuhkan referensi booking. Mulai pemesanan baru untuk melanjutkan." action={<Link href="/booking" className={ctaClass}>Buat booking baru <ArrowRight size={15} /></Link>} />;
  }

  if (bookingQuery.isLoading) {
    return <StateCard tone="info" icon={Loader2} spin title="Memuat booking…" description="Mengambil detail pemesananmu dari server." />;
  }

  if (bookingQuery.isError) {
    return <StateCard tone="danger" icon={XCircle} title="Gagal memuat booking" description={extractApiError(bookingQuery.error, 'Terjadi kesalahan.')} action={<button onClick={() => bookingQuery.refetch()} className={ctaClass}><RefreshCw size={15} /> Coba lagi</button>} />;
  }

  if (alreadyPaid) {
    return <StateCard tone="success" icon={CheckCircle2} title="Booking sudah dibayar" description={`Booking ${booking?.code} sudah lunas. Tiketmu tersedia di menu tiket.`} action={<Link href="/customer/tickets" className={ctaClass}>Lihat tiket <ArrowRight size={15} /></Link>} />;
  }

  if (expired) {
    return <StateCard tone="danger" icon={Clock} title="Waktu pembayaran habis" description="Kursi telah dirilis otomatis agar bisa dipesan pelanggan lain. Silakan buat pemesanan baru." action={<Link href="/booking" className={ctaClass}>Pesan ulang <ArrowRight size={15} /></Link>} />;
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_340px]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-button text-primary">Pembayaran</p>
        <h1 className="mt-3 font-display text-2xl font-medium text-slate-950 dark:text-white sm:text-3xl">Pilih metode pembayaran</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Selesaikan pembayaran sebelum waktu habis. Status akan diperbarui otomatis setelah pembayaran diterima.</p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Metode pembayaran">
          {METHODS.map(({ id, label, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={method === id}
              onClick={() => setMethod(id)}
              className={clsx(
                'rounded-2xl border p-4 text-left transition',
                method === id
                  ? 'border-primary bg-primary/5'
                  : 'border-slate-200 hover:border-primary/50 dark:border-slate-800',
              )}
            >
              <span className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><Icon size={18} className="text-primary" /> {label}</span>
              <span className="mt-1.5 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
            </button>
          ))}
        </div>

        {error ? <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900">{error}</p> : null}

        <button
          type="button"
          onClick={() => payMutation.mutate()}
          disabled={payMutation.isPending}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {payMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {payMutation.isPending ? 'Memproses…' : `Bayar ${formatIDR(booking?.amount)}`}
        </button>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
        <div className="rounded-2xl bg-amber-50 p-4 text-center ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900">
          <p className="text-xs font-extrabold uppercase tracking-buttonst text-amber-700 dark:text-amber-300">Sisa waktu pembayaran</p>
          <p className="mt-1 font-display text-3xl font-medium tabular-nums text-amber-700 dark:text-amber-300" aria-live="polite">{formatCountdown(remaining)}</p>
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <Row label="Kode booking" value={booking?.code ?? '—'} />
          <Row label="Rute" value={booking?.schedule?.route ? `${booking.schedule.route.origin} → ${booking.schedule.route.destination}` : '—'} />
          <Row label="Berangkat" value={formatDateTime(booking?.schedule?.departure_at)} />
          {seatNumbers ? <Row label="Kursi" value={seatNumbers} /> : null}
          <div className="flex justify-between gap-3 border-t border-dashed border-slate-200 pt-3 dark:border-slate-800">
            <dt className="font-extrabold text-slate-700 dark:text-slate-200">Total</dt>
            <dd className="font-display text-lg font-medium text-primary">{formatIDR(booking?.amount)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

export function PaymentWaiting() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentUuid = params.get('payment');
  const bookingUuid = params.get('booking');

  const paymentQuery = useQuery({
    queryKey: ['payment-status', paymentUuid],
    queryFn: () => fetchPayment(paymentUuid!),
    enabled: Boolean(paymentUuid),
    refetchInterval: 4000,
  });

  const payment = paymentQuery.data;
  const expiresAt = (payment?.expiresAt ?? payment?.expires_at) as string | undefined;
  const remaining = useCountdown(expiresAt);
  const gateway = (payment?.gatewayPayload ?? {}) as { redirect_url?: string; snap_token?: string; va_number?: string; qr_string?: string };

  useEffect(() => {
    if (!payment) return;
    if (payment.status === 'paid') router.replace(`/payment/success?booking=${bookingUuid ?? ''}`);
    else if (payment.status === 'failed') router.replace(`/payment/failed?booking=${bookingUuid ?? ''}`);
    else if (payment.status === 'expired' || remaining === 0) router.replace(`/payment/expired`);
  }, [payment, remaining, router, bookingUuid]);

  if (!paymentUuid) {
    return <StateCard tone="warning" icon={AlertTriangle} title="Pembayaran tidak ditemukan" description="Halaman ini membutuhkan referensi pembayaran." action={<Link href="/booking" className={ctaClass}>Kembali ke booking</Link>} />;
  }

  return (
    <StateCard
      tone="info"
      icon={Loader2}
      spin
      title="Menunggu pembayaran"
      description={`Selesaikan pembayaran via ${String(payment?.method ?? '…').replaceAll('_', ' ')}. Status dicek otomatis setiap 4 detik — jangan tutup halaman ini.`}
      extra={
        <>
          {gateway.redirect_url ? (
            <a
              href={gateway.redirect_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep"
            >
              Lanjutkan pembayaran <ArrowRight size={15} />
            </a>
          ) : null}
          {gateway.va_number ? (
            <div className="mt-4 rounded-2xl bg-slate-50 px-6 py-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <p className="text-xs font-extrabold uppercase tracking-buttonst text-slate-500">Nomor Virtual Account</p>
              <p className="mt-1 select-all font-display text-2xl font-medium tabular-nums text-slate-900 dark:text-slate-100">{gateway.va_number}</p>
            </div>
          ) : null}
          {!gateway.redirect_url && gateway.qr_string ? (
            <div className="mt-4 rounded-2xl bg-slate-50 px-6 py-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <p className="text-xs font-extrabold uppercase tracking-buttonst text-slate-500">Kode QRIS</p>
              <p className="mt-1 select-all break-all text-xs font-semibold text-slate-700 dark:text-slate-300">{gateway.qr_string}</p>
            </div>
          ) : null}
          <div className="mt-6 rounded-2xl bg-amber-50 px-6 py-4 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900">
            <p className="text-xs font-extrabold uppercase tracking-buttonst text-amber-700 dark:text-amber-300">Sisa waktu</p>
            <p className="mt-1 font-display text-4xl font-medium tabular-nums text-amber-700 dark:text-amber-300" aria-live="polite">{formatCountdown(remaining)}</p>
          </div>
        </>
      }
      action={bookingUuid ? <Link href={`/customer/bookings/${bookingUuid}`} className="text-sm font-bold text-primary hover:underline">Lihat detail booking</Link> : undefined}
    />
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="text-right font-bold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

const ctaClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep';

const tones = {
  info: 'text-primary bg-primary/10',
  success: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60',
  warning: 'text-amber-600 bg-amber-100 dark:bg-amber-950/60',
  danger: 'text-rose-600 bg-rose-100 dark:bg-rose-950/60',
} as const;

function StateCard({ tone, icon: Icon, spin, title, description, action, extra }: { tone: keyof typeof tones; icon: React.ComponentType<{ size?: number; className?: string }>; spin?: boolean; title: string; description: string; action?: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="mx-auto grid min-h-[50vh] w-full max-w-xl place-items-center">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <span className={clsx('mx-auto grid h-16 w-16 place-items-center rounded-2xl', tones[tone])}>
          <Icon size={30} className={spin ? 'animate-spin' : undefined} aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-medium text-slate-950 dark:text-white sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        {extra}
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </section>
    </div>
  );
}
