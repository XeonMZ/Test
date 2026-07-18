'use client';

import { ArrowRight, PlusCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractApiError, fetchCustomerBookings, formatDateTime, formatIDR, type Booking } from '@/services/stms';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, Skeleton } from '@/shared/ui/components';

const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'unpaid', label: 'Belum dibayar' },
  { id: 'paid', label: 'Lunas' },
  { id: 'closed', label: 'Selesai / batal' },
] as const;

const UNPAID = ['draft', 'seat_locked', 'waiting_payment'];
const PAID = ['paid', 'ticket_generated'];
const CLOSED = ['completed', 'cancelled', 'expired'];

function tone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (PAID.includes(status) || status === 'completed') return 'success';
  if (UNPAID.includes(status)) return 'warning';
  if (status === 'cancelled' || status === 'expired') return 'danger';
  return 'neutral';
}

export function BookingList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const query = useQuery({ queryKey: ['customer-bookings'], queryFn: fetchCustomerBookings });

  const bookings = useMemo(() => {
    const all = query.data ?? [];
    if (filter === 'unpaid') return all.filter((b) => UNPAID.includes(b.status));
    if (filter === 'paid') return all.filter((b) => PAID.includes(b.status));
    if (filter === 'closed') return all.filter((b) => CLOSED.includes(b.status));
    return all;
  }, [query.data, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Saya"
        description="Seluruh riwayat pemesananmu beserta status pembayaran dan tiket."
        actions={
          <>
            <Link href="/booking" className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white transition hover:bg-primary/90">
              <PlusCircle size={16} /> Booking baru
            </Link>
            <ActionButton onClick={() => query.refetch()} disabled={query.isFetching} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800">
              <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
            </ActionButton>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`min-h-10 rounded-2xl px-4 text-sm font-extrabold transition ${filter === option.id ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat booking" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : bookings.length === 0 ? (
        <EmptyState title="Tidak ada booking" description="Belum ada pemesanan pada filter ini. Mulai perjalanan baru kapan saja." />
      ) : (
        <ul className="space-y-3">
          {bookings.map((booking) => <BookingCard key={booking.uuid} booking={booking} />)}
        </ul>
      )}
    </div>
  );
}

function BookingCard({ booking }: { booking: Booking }) {
  const route = booking.schedule?.route;
  const unpaid = UNPAID.includes(booking.status);
  const hasTicket = PAID.includes(booking.status);
  // Track Driver shows only while the departure is ON TRIP (schedule status
  // auto-syncs with the driver's real trip state on the backend).
  const onTrip = PAID.includes(booking.status) && (booking.schedule as { status?: string } | null | undefined)?.status === 'departed';
  const ticketUuid = (booking as { ticket?: { uuid?: string } }).ticket?.uuid;

  return (
    <li>
      <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-extrabold text-slate-950 dark:text-white">
              {route ? `${route.origin} → ${route.destination}` : booking.code}
            </p>
            <Badge tone={tone(booking.status)}>{booking.status.replaceAll('_', ' ')}</Badge>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-500">
            {booking.code} · Berangkat {formatDateTime(booking.schedule?.departure_at)}
          </p>
          <p className="mt-1 font-display text-lg font-extrabold text-primary">{formatIDR(booking.amount)}</p>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {unpaid ? (
            <Link href={`/payment?booking=${booking.uuid}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-amber-600 px-4 text-sm font-extrabold text-white transition hover:bg-amber-700">
              Bayar sekarang <ArrowRight size={15} />
            </Link>
          ) : null}
          {onTrip ? (
            <Link href={`/customer/track/${booking.uuid}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white transition hover:bg-emerald-700">
              🟢 Track Driver
            </Link>
          ) : null}
          {hasTicket && ticketUuid ? (
            <Link href={`/customer/tickets/${ticketUuid}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-extrabold text-white transition hover:bg-primary/90">
              Lihat tiket <ArrowRight size={15} />
            </Link>
          ) : null}
          <Link href={`/customer/bookings/${booking.uuid}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            Detail
          </Link>
        </div>
      </AppCard>
    </li>
  );
}
