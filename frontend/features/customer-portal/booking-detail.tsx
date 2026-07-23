'use client';

import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Ticket as TicketIcon, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBooking, extractApiError, fetchBooking, formatDateTime, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const UNPAID = ['draft', 'seat_locked', 'waiting_payment'];
const PAID = ['paid', 'ticket_generated'];

function tone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (PAID.includes(status) || status === 'completed') return 'success';
  if (UNPAID.includes(status)) return 'warning';
  if (status === 'cancelled' || status === 'expired') return 'danger';
  return 'neutral';
}

export function BookingDetail({ id }: { id: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const query = useQuery({ queryKey: ['booking', id], queryFn: () => fetchBooking(id) });
  const booking = query.data;

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: () => {
      toast('Booking dibatalkan. Kursi telah dirilis.', 'success');
      setConfirming(false);
      queryClient.invalidateQueries({ queryKey: ['booking', id] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membatalkan booking.'), 'error'),
  });

  const route = booking?.schedule?.route;
  const seats = (booking as { seat_reservations?: Array<{ id: number; vehicle_seat?: { seat_number?: string } }> } | undefined)?.seat_reservations ?? [];
  const passengers = booking?.passengers ?? [];
  const payment = (booking as { payment?: { status?: string; method?: string; amount?: number } } | undefined)?.payment;
  const ticket = (booking as { ticket?: { uuid?: string; ticket_number?: string } } | undefined)?.ticket;
  const cancellable = booking ? UNPAID.includes(booking.status) : false;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detail Booking"
        description="Rincian lengkap pemesanan, penumpang, kursi, dan status pembayaran."
        actions={
          <Link href="/customer/bookings" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            <ArrowLeft size={15} /> Semua booking
          </Link>
        }
      />

      {query.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      ) : query.isError ? (
        <EmptyState title="Booking tidak ditemukan" description={extractApiError(query.error, 'Booking tidak dapat dimuat.')} />
      ) : booking ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <AppCard>
              <div className="flex items-center justify-between gap-3">
                <SectionHeader title={route ? `${route.origin} → ${route.destination}` : booking.code} description={`Kode booking ${booking.code}`} />
                <Badge tone={tone(booking.status)}>{booking.status.replaceAll('_', ' ')}</Badge>
              </div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <Item label="Keberangkatan" value={formatDateTime(booking.schedule?.departure_at)} />
                <Item label="Perkiraan tiba" value={formatDateTime(booking.schedule?.arrival_at)} />
                <Item label="Armada" value={booking.schedule?.vehicle ? `${booking.schedule.vehicle.brand ?? ''} ${booking.schedule.vehicle.code ?? ''}`.trim() || '—' : '—'} />
                <Item label="Kursi" value={seats.map((s) => s.vehicle_seat?.seat_number).filter(Boolean).join(', ') || '—'} />
              </dl>
            </AppCard>

            <AppCard>
              <SectionHeader title="Penumpang" description={`${passengers.length} penumpang terdaftar.`} />
              {passengers.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada data penumpang.</p>
              ) : (
                <ul className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
                  {passengers.map((passenger, index) => (
                    <li key={passenger.id} className="flex items-center justify-between gap-3 py-3">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{passenger.name}</span>
                      <span className="text-sm font-semibold text-slate-500">{seats[index]?.vehicle_seat?.seat_number ?? '—'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>
          </div>

          <aside className="h-fit space-y-4 lg:sticky lg:top-24">
            <AppCard>
              <SectionHeader title="Pembayaran" />
              <dl className="mt-4 space-y-3 text-sm">
                <Row label="Total" value={formatIDR(booking.amount)} />
                <Row label="Metode" value={payment?.method ? payment.method.replaceAll('_', ' ') : '—'} />
                <Row label="Status" value={payment?.status ?? '—'} />
                {booking.expires_at && UNPAID.includes(booking.status) ? <Row label="Kedaluwarsa" value={formatDateTime(booking.expires_at)} /> : null}
              </dl>

              {UNPAID.includes(booking.status) ? (
                <Link href={`/payment?booking=${booking.uuid}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary/90">
                  Bayar sekarang <ArrowRight size={15} />
                </Link>
              ) : null}

              {ticket?.uuid ? (
                <Link href={`/customer/tickets/${ticket.uuid}`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-slate-200 px-5 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
                  <TicketIcon size={15} /> Lihat e-ticket
                </Link>
              ) : null}
            </AppCard>

            {cancellable ? (
              <AppCard>
                {confirming ? (
                  <div className="space-y-3">
                    <p className="flex items-start gap-2 text-sm font-bold text-rose-700 dark:text-rose-300">
                      <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Batalkan booking ini? Kursi akan dirilis dan tindakan tidak dapat dibatalkan.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-rose-600 px-4 text-sm font-extrabold text-white transition hover:bg-rose-700 disabled:opacity-60">
                        {cancelMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Ya, batalkan
                      </button>
                      <button onClick={() => setConfirming(false)} disabled={cancelMutation.isPending} className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                        Kembali
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirming(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-rose-200 px-5 text-sm font-extrabold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40">
                    <XCircle size={15} /> Batalkan booking
                  </button>
                )}
              </AppCard>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
      <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="text-right font-bold capitalize text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}
