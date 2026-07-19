'use client';

import { ArrowRight, CalendarClock, PlusCircle, RefreshCw, Ticket as TicketIcon, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractApiError, fetchCustomerBookings, formatDateTime, formatIDR, resendVerificationEmail, type Booking } from '@/services/stms';
import { useAuth } from '@/shared/providers/auth-provider';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton, StatsCard } from '@/shared/ui/components';

const ACTIVE_STATUSES = ['seat_locked', 'waiting_payment', 'paid', 'ticket_generated'];
const PAID_STATUSES = ['paid', 'ticket_generated', 'completed'];

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (PAID_STATUSES.includes(status)) return 'success';
  if (status === 'seat_locked' || status === 'waiting_payment') return 'warning';
  if (status === 'cancelled' || status === 'expired') return 'danger';
  return 'neutral';
}

/**
 * Shown while the account email is unverified: explains the state and offers
 * the rate-limited "Kirim Ulang" resend. Hidden entirely for verified users
 * (existing accounts are grandfathered as verified by the migration).
 */
function VerifyEmailBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [hidden, setHidden] = useState(false);
  const unverified = Boolean(user) && (user as Record<string, unknown>).email_verified_at == null && 'email_verified_at' in (user as Record<string, unknown>);
  if (!unverified || hidden) return null;

  async function resend() {
    setSending(true);
    try {
      const res = await resendVerificationEmail();
      toast(res.message, res.verified ? 'success' : 'info');
      if (res.verified) setHidden(true);
    } catch (error) {
      toast(extractApiError(error, 'Gagal mengirim ulang email verifikasi.'), 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
      <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
        ✉️ Email Anda belum terverifikasi. Cek kotak masuk <span className="font-mono">{String(user?.email ?? '')}</span> untuk tautan verifikasi.
      </p>
      <button onClick={() => void resend()} disabled={sending} className="min-h-10 rounded-xl bg-amber-600 px-4 text-xs font-extrabold text-white transition hover:bg-amber-700 disabled:opacity-60">
        {sending ? 'Mengirim…' : 'Kirim Ulang Email'}
      </button>
    </div>
  );
}

export function CustomerDashboard() {
  const { user } = useAuth();
  const query = useQuery({ queryKey: ['customer-bookings-dashboard'], queryFn: fetchCustomerBookings });

  const bookings = useMemo(() => query.data ?? [], [query.data]);

  const stats = useMemo(() => {
    const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
    const upcoming = bookings.filter((b) => {
      const dep = b.schedule?.departure_at;
      return PAID_STATUSES.includes(b.status) && dep && new Date(dep).getTime() > Date.now();
    });
    const totalSpent = bookings
      .filter((b) => PAID_STATUSES.includes(b.status))
      .reduce((sum, b) => sum + Number(b.amount ?? 0), 0);
    return { total: bookings.length, active: active.length, upcoming: upcoming.length, totalSpent };
  }, [bookings]);

  const recent = useMemo(
    () => [...bookings].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()).slice(0, 5),
    [bookings],
  );

  const pendingPayment = useMemo(() => bookings.find((b) => b.status === 'seat_locked' || b.status === 'waiting_payment'), [bookings]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <VerifyEmailBanner />
      <PageHeader
        title={user ? `Halo, ${String(user.name).split(' ')[0]} 👋` : 'Dashboard'}
        description="Ringkasan perjalanan dan pemesananmu, langsung dari data live."
        actions={
          <>
            <Link href="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90">
              <PlusCircle size={16} /> Booking baru
            </Link>
            <ActionButton onClick={() => query.refetch()} disabled={query.isFetching} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800">
              <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
            </ActionButton>
          </>
        }
      />

      {pendingPayment ? (
        <div className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40">
          <div>
            <p className="font-extrabold text-amber-800 dark:text-amber-200">Booking {pendingPayment.code} menunggu pembayaran</p>
            <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-300/80">Selesaikan pembayaran sebelum kursi dirilis otomatis.</p>
          </div>
          <Link href={`/payment?booking=${pendingPayment.uuid}`} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 text-sm font-extrabold text-white transition hover:bg-amber-700">
            Bayar sekarang <ArrowRight size={15} />
          </Link>
        </div>
      ) : null}

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Skeleton /><Skeleton /><Skeleton /><Skeleton /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard label="Total booking" value={String(stats.total)} helper="Seluruh riwayat pemesananmu" />
          <StatsCard label="Booking aktif" value={String(stats.active)} helper="Sedang berjalan atau menunggu pembayaran" />
          <StatsCard label="Perjalanan mendatang" value={String(stats.upcoming)} helper="Tiket lunas dengan jadwal ke depan" />
          <StatsCard label="Total pengeluaran" value={formatIDR(stats.totalSpent)} helper="Akumulasi booking lunas" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <AppCard>
          <div className="flex items-center justify-between gap-3">
            <SectionHeader title="Booking terbaru" description="Lima pemesanan terakhirmu." />
            <Link href="/customer/bookings" className="shrink-0 text-sm font-extrabold text-primary hover:underline">Lihat semua</Link>
          </div>
          <div className="mt-5">
            {query.isLoading ? (
              <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
            ) : query.isError ? (
              <EmptyState title="Gagal memuat" description={extractApiError(query.error, 'Terjadi kesalahan saat memuat booking.')} />
            ) : recent.length === 0 ? (
              <EmptyState title="Belum ada booking" description="Mulai perjalanan pertamamu — cari jadwal dan pesan kursi sekarang." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {recent.map((booking) => (
                  <BookingRow key={booking.uuid} booking={booking} />
                ))}
              </ul>
            )}
          </div>
        </AppCard>

        <div className="space-y-4">
          <QuickLink href="/booking" icon={<PlusCircle size={18} />} title="Pesan perjalanan" description="Cari jadwal & pilih kursi" />
          <QuickLink href="/customer/tickets" icon={<TicketIcon size={18} />} title="Tiket saya" description="QR boarding & status tiket" />
          <QuickLink href="/customer/trip-history" icon={<CalendarClock size={18} />} title="Riwayat perjalanan" description="Perjalanan yang sudah selesai" />
          <QuickLink href="/customer/payment" icon={<Wallet size={18} />} title="Pembayaran" description="Riwayat & status pembayaran" />
        </div>
      </div>
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const route = booking.schedule?.route;
  return (
    <li>
      <Link href={`/customer/bookings/${booking.uuid}`} className="group flex items-center justify-between gap-4 py-4 transition">
        <div className="min-w-0">
          <p className="truncate font-extrabold text-slate-900 group-hover:text-primary dark:text-slate-100">
            {route ? `${route.origin} → ${route.destination}` : booking.code}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
            {booking.code} · {formatDateTime(booking.schedule?.departure_at ?? booking.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm font-extrabold text-slate-700 dark:text-slate-200 sm:block">{formatIDR(booking.amount)}</span>
          <Badge tone={statusTone(booking.status)}>{booking.status.replaceAll('_', ' ')}</Badge>
        </div>
      </Link>
    </li>
  );
}

function QuickLink({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary dark:border-slate-800 dark:bg-slate-900">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">{icon}</span>
      <span className="min-w-0">
        <span className="block font-extrabold text-slate-900 dark:text-slate-100">{title}</span>
        <span className="block truncate text-xs font-semibold text-slate-500">{description}</span>
      </span>
      <ArrowRight size={16} className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
    </Link>
  );
}
