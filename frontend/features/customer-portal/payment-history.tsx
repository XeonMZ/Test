'use client';

import { ArrowRight, RefreshCw, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { extractApiError, fetchCustomerBookings, formatDateTime, formatIDR } from '@/services/stms';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, Skeleton, StatsCard } from '@/shared/ui/components';

type PaymentRow = {
  bookingUuid: string;
  bookingCode: string;
  route: string;
  amount: number;
  method: string;
  status: string;
  date: string | undefined;
  payable: boolean;
};

const UNPAID = ['draft', 'seat_locked', 'waiting_payment'];

function tone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (status === 'paid') return 'success';
  if (['failed', 'expired'].includes(status)) return 'danger';
  if (status === 'pending') return 'warning';
  return 'neutral';
}

/**
 * The API exposes payments through their parent booking, so the payment
 * history is derived from the customer's bookings rather than invented.
 */
export function PaymentHistory() {
  const query = useQuery({ queryKey: ['customer-bookings'], queryFn: fetchCustomerBookings });

  const rows = useMemo<PaymentRow[]>(() => {
    return (query.data ?? []).map((booking) => {
      const payment = (booking as { payment?: { status?: string; method?: string; amount?: number; created_at?: string } }).payment;
      const route = booking.schedule?.route;
      return {
        bookingUuid: booking.uuid,
        bookingCode: booking.code,
        route: route ? `${route.origin} → ${route.destination}` : '—',
        amount: Number(payment?.amount ?? booking.amount ?? 0),
        method: payment?.method?.replaceAll('_', ' ') ?? '—',
        status: payment?.status ?? (UNPAID.includes(booking.status) ? 'belum dibayar' : booking.status),
        date: payment?.created_at ?? booking.created_at,
        payable: UNPAID.includes(booking.status),
      };
    });
  }, [query.data]);

  const totalPaid = useMemo(() => rows.filter((r) => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0), [rows]);
  const outstanding = useMemo(() => rows.filter((r) => r.payable).reduce((sum, r) => sum + r.amount, 0), [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pembayaran"
        description="Riwayat dan status pembayaran untuk seluruh pemesananmu."
        actions={
          <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
          </ActionButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatsCard label="Total dibayar" value={formatIDR(totalPaid)} helper="Akumulasi pembayaran berhasil" />
        <StatsCard label="Menunggu pembayaran" value={formatIDR(outstanding)} helper="Selesaikan sebelum booking kedaluwarsa" />
      </div>

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat pembayaran" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : rows.length === 0 ? (
        <EmptyState title="Belum ada pembayaran" description="Riwayat pembayaran muncul setelah kamu membuat pemesanan pertama." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-3 pr-4 font-extrabold">Booking</th>
                <th className="py-3 pr-4 font-extrabold">Rute</th>
                <th className="py-3 pr-4 font-extrabold">Metode</th>
                <th className="py-3 pr-4 font-extrabold">Tanggal</th>
                <th className="py-3 pr-4 font-extrabold">Status</th>
                <th className="py-3 text-right font-extrabold">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((row) => (
                <tr key={row.bookingUuid}>
                  <td className="py-3 pr-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{row.bookingCode}</td>
                  <td className="py-3 pr-4 font-bold text-slate-900 dark:text-slate-100">{row.route}</td>
                  <td className="py-3 pr-4 capitalize text-slate-600 dark:text-slate-300">{row.method}</td>
                  <td className="py-3 pr-4 text-slate-500">{formatDateTime(row.date)}</td>
                  <td className="py-3 pr-4">
                    {row.payable ? (
                      <Link href={`/payment?booking=${row.bookingUuid}`} className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-700 hover:underline dark:text-amber-300">
                        <Wallet size={13} /> Bayar sekarang <ArrowRight size={12} />
                      </Link>
                    ) : (
                      <Badge tone={tone(row.status)}>{row.status}</Badge>
                    )}
                  </td>
                  <td className="py-3 text-right font-extrabold text-slate-900 dark:text-slate-100">{formatIDR(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      )}
    </div>
  );
}
