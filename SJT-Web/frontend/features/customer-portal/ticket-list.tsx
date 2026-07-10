'use client';

import { ArrowRight, QrCode, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { extractApiError, fetchTickets, formatDateTime } from '@/services/stms';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, Skeleton } from '@/shared/ui/components';

function tone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (['issued', 'active', 'boarded', 'checked_in'].includes(status)) return 'success';
  if (status === 'pending') return 'warning';
  if (['cancelled', 'expired', 'void', 'no_show'].includes(status)) return 'danger';
  return 'neutral';
}

export function TicketList() {
  const query = useQuery({ queryKey: ['customer-tickets'], queryFn: fetchTickets });
  const tickets = query.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tiket Saya"
        description="E-ticket dengan QR boarding untuk setiap perjalanan yang sudah dibayar."
        actions={
          <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
          </ActionButton>
        }
      />

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat tiket" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : tickets.length === 0 ? (
        <EmptyState title="Belum ada tiket" description="Tiket diterbitkan otomatis setelah pembayaran booking berhasil." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {tickets.map((ticket) => (
            <li key={ticket.uuid}>
              <Link href={`/customer/tickets/${ticket.uuid}`} className="group block">
                <AppCard className="transition group-hover:-translate-y-0.5 group-hover:border-primary">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                      <QrCode size={20} />
                    </span>
                    <Badge tone={tone(ticket.status)}>{ticket.status.replaceAll('_', ' ')}</Badge>
                  </div>
                  <p className="mt-4 font-mono text-sm font-extrabold tracking-widest text-slate-900 dark:text-slate-100">{ticket.ticket_number}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Diterbitkan {formatDateTime(ticket.created_at)}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-extrabold text-primary">
                    Buka QR <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                  </span>
                </AppCard>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
