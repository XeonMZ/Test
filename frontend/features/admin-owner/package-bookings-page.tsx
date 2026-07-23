'use client';

import { CheckCircle2, Loader2, Package, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type PackageBookingRow } from '@/services/portal';
import { extractApiError, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const FILTERS = [
  { key: '', label: 'Semua' },
  { key: 'waiting_verification', label: 'Perlu Verifikasi' },
  { key: 'waiting_payment', label: 'Menunggu Bayar' },
  { key: 'paid', label: 'Terkonfirmasi' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
] as const;

const tone = (s: string) => (s === 'paid' || s === 'completed' ? 'success' : s === 'cancelled' ? 'danger' : 'warning');
const label = (s: string) => ({ waiting_payment: 'Menunggu Bayar', waiting_verification: 'Perlu Verifikasi', paid: 'Terkonfirmasi', completed: 'Selesai', cancelled: 'Dibatalkan' } as Record<string, string>)[s] ?? s;

/** Admin & owner: verify package transfers and manage the lifecycle. */
export function AdminPackageBookingsPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');

  const query = useQuery({ queryKey: ['admin-package-bookings', filter], queryFn: () => adminApi.packageBookings(filter ? { status: filter } : undefined) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-package-bookings'] });

  const verify = useMutation({ mutationFn: adminApi.packageBookingVerify, onSuccess: () => { toast('Pembayaran diverifikasi — booking terkonfirmasi.', 'success'); refresh(); }, onError: (e) => toast(extractApiError(e, 'Gagal memverifikasi.'), 'error') });
  const verifySettlement = useMutation({ mutationFn: adminApi.packageBookingVerifySettlement, onSuccess: () => { toast('Pelunasan diverifikasi — booking LUNAS.', 'success'); refresh(); }, onError: (e) => toast(extractApiError(e, 'Gagal memverifikasi pelunasan.'), 'error') });
  const reject = useMutation({ mutationFn: (v: { id: number; note: string }) => adminApi.packageBookingReject(v.id, v.note), onSuccess: () => { toast('Verifikasi ditolak, customer diberi tahu.', 'success'); refresh(); }, onError: (e) => toast(extractApiError(e, 'Gagal menolak.'), 'error') });
  const transition = useMutation({ mutationFn: (v: { id: number; action: 'complete' | 'cancel' }) => adminApi.packageBookingTransition(v.id, v.action), onSuccess: () => { toast('Status diperbarui.', 'success'); refresh(); }, onError: (e) => toast(extractApiError(e, 'Gagal memperbarui status.'), 'error') });

  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Booking Paket Wisata" description="Verifikasi transfer pelanggan dan kelola status booking paket. Setiap aksi terekam di audit trail dan memicu notifikasi + email otomatis." />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`min-h-9 rounded-xl px-3 text-xs font-extrabold transition ${filter === f.key ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300'}`}>{f.label}</button>
        ))}
      </div>

      <AppCard>
        <SectionHeader title={`Daftar booking (${rows.length})`} />
        {query.isLoading ? <Skeleton className="mt-4 h-40" /> : query.isError ? (
          <EmptyState title="Gagal memuat" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
        ) : rows.length === 0 ? (
          <EmptyState title="Tidak ada booking" description="Belum ada booking paket pada filter ini." />
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((b: PackageBookingRow) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100"><Package size={14} className="text-primary" /> {b.tour_package?.name ?? 'Paket'} <Badge tone={tone(b.status)}>{label(b.status)}</Badge></p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{b.code} · {b.customer?.user?.name ?? '—'} · {new Date(b.travel_date).toLocaleDateString('id-ID')} · {b.pax} pax · {formatIDR(b.amount)}</p>
                  {b.is_dp ? (
                    <p className="mt-0.5 text-xs font-bold">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase tracking-button text-slate-600 dark:bg-slate-800 dark:text-slate-300">DP {b.dp_percent ?? ''}%</span>{' '}
                      {b.is_settled ? (
                        <span className="text-emerald-600 dark:text-emerald-400">LUNAS</span>
                      ) : (
                        <>
                          <span className="text-slate-500">Diterima {formatIDR(b.paid_amount ?? 0)}</span>
                          {' · '}
                          <span className="text-amber-600 dark:text-amber-400">Sisa {formatIDR(b.outstanding_amount ?? 0)}</span>
                          {b.settlement_claimed_at ? <span className="text-sky-600 dark:text-sky-400"> · customer klaim sudah transfer</span> : null}
                        </>
                      )}
                    </p>
                  ) : null}
                  {b.admin_note ? <p className="mt-0.5 text-xs font-semibold text-amber-600">Catatan: {b.admin_note}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === 'waiting_verification' || b.status === 'waiting_payment' ? (
                    <button onClick={() => verify.mutate(b.id)} disabled={verify.isPending} className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60">{verify.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Verifikasi</button>
                  ) : null}
                  {b.status === 'waiting_verification' ? (
                    <button onClick={() => { const note = prompt('Alasan penolakan (dikirim ke customer):'); if (note) reject.mutate({ id: b.id, note }); }} className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"><XCircle size={12} /> Tolak</button>
                  ) : null}
                  {b.status === 'paid' && b.is_dp && !b.is_settled ? (
                    <button onClick={() => verifySettlement.mutate(b.id)} disabled={verifySettlement.isPending} className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-amber-500 px-3 text-xs font-extrabold text-white hover:bg-amber-600 disabled:opacity-60">{verifySettlement.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Verifikasi Pelunasan</button>
                  ) : null}
                  {b.status === 'paid' && b.is_settled !== false ? <button onClick={() => transition.mutate({ id: b.id, action: 'complete' })} className="min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300">Tandai Selesai</button> : null}
                  {['waiting_payment', 'waiting_verification', 'paid'].includes(b.status) ? <button onClick={() => { if (confirm('Batalkan booking ini?')) transition.mutate({ id: b.id, action: 'cancel' }); }} className="min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-500 hover:border-rose-300 hover:text-rose-700 dark:border-slate-800">Batalkan</button> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppCard>
    </div>
  );
}
