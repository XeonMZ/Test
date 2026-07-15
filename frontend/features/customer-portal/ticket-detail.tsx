'use client';

import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useQuery } from '@tanstack/react-query';
import { extractApiError, fetchTicket, fetchTicketQr, formatDateTime } from '@/services/stms';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (['issued', 'active', 'boarded', 'checked_in'].includes(status)) return 'success';
  if (['pending'].includes(status)) return 'warning';
  if (['cancelled', 'expired', 'void'].includes(status)) return 'danger';
  return 'neutral';
}

export function TicketDetail({ id }: { id: string }) {
  const ticketQuery = useQuery({ queryKey: ['ticket', id], queryFn: () => fetchTicket(id) });
  const qrQuery = useQuery({ queryKey: ['ticket-qr', id], queryFn: () => fetchTicketQr(id), refetchInterval: 60_000 });

  const ticket = ticketQuery.data;
  const booking = ticket?.booking;
  const route = booking?.schedule?.route;

  return (
    <div className="space-y-6">
      <PageHeader
        title="E-Ticket"
        description="Tunjukkan QR ini ke driver saat check-in. QR diperbarui berkala untuk keamanan."
        actions={
          <Link href="/customer/tickets" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
            <ArrowLeft size={15} /> Semua tiket
          </Link>
        }
      />

      {ticketQuery.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      ) : ticketQuery.isError ? (
        <EmptyState title="Tiket tidak ditemukan" description={extractApiError(ticketQuery.error, 'Tiket tidak dapat dimuat.')} />
      ) : ticket ? (
        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <AppCard className="text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary">Boarding pass</p>
            <div className="mx-auto mt-5 grid w-fit place-items-center rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700">
              {qrQuery.isLoading ? (
                <Skeleton className="h-52 w-52" />
              ) : qrQuery.isError ? (
                <div className="grid h-52 w-52 place-items-center px-4 text-sm font-bold text-rose-600">
                  QR gagal dimuat.
                  <button onClick={() => qrQuery.refetch()} className="mt-2 inline-flex items-center gap-1 text-primary"><RefreshCw size={13} /> Coba lagi</button>
                </div>
              ) : (
                <QRCodeSVG value={qrQuery.data ?? ''} size={208} level="M" aria-label={`QR tiket ${ticket.ticket_number}`} />
              )}
            </div>
            <p className="mt-4 font-mono text-sm font-extrabold tracking-widest text-slate-900 dark:text-slate-100">{ticket.ticket_number}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"><ShieldCheck size={14} /> Payload QR ditandatangani server</p>
          </AppCard>

          <AppCard>
            <div className="flex items-center justify-between gap-3">
              <SectionHeader title="Detail perjalanan" />
              <Badge tone={statusTone(ticket.status)}>{ticket.status.replaceAll('_', ' ')}</Badge>
            </div>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Item label="Rute" value={route ? `${route.origin} → ${route.destination}` : '—'} />
              <Item label="Keberangkatan" value={formatDateTime(booking?.schedule?.departure_at)} />
              <Item label="Kode booking" value={booking?.code ?? '—'} />
              <Item label="Armada" value={booking?.schedule?.vehicle ? `${booking.schedule.vehicle.brand ?? ''} ${booking.schedule.vehicle.code ?? ''}`.trim() || '—' : '—'} />
              <Item label="Diterbitkan" value={formatDateTime(ticket.created_at)} />
              <Item label="Nomor tiket" value={ticket.ticket_number} mono />
            </dl>
          </AppCard>
        </div>
      ) : null}
    </div>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60">
      <dt className="text-xs font-extrabold uppercase tracking-widest text-slate-400">{label}</dt>
      <dd className={`mt-1 font-bold text-slate-900 dark:text-slate-100 ${mono ? 'font-mono text-sm tracking-wider' : ''}`}>{value}</dd>
    </div>
  );
}
