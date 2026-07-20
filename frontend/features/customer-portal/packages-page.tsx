'use client';

import { MapPin, Package as PackageIcon } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { cancelPackageBooking, confirmPackageTransfer, createPackageBooking, extractApiError, fetchMyPackageBookings, formatIDR, payPackageBooking, type PackageBookingSummary } from '@/services/stms';
import { useAuth } from '@/shared/providers/auth-provider';
import { useToast } from '@/shared/providers/toast-provider';
import type { TourPackageRow } from '@/services/portal';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

type Paged = { data: TourPackageRow[] };

const SECTIONS = [
  { key: 'recommended', title: 'Recommended Packages', desc: 'Pilihan terbaik dari tim kami.' },
  { key: 'best_seller', title: 'Best Seller', desc: 'Paling banyak dipesan pelanggan.' },
  { key: 'promo', title: 'Promo', desc: 'Harga spesial waktu terbatas.' },
  { key: 'featured', title: 'Featured Packages', desc: 'Sorotan destinasi unggulan.' },
] as const;

function PackageCard({ p, onBook }: { p: TourPackageRow; onBook: (p: TourPackageRow) => void }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="relative grid h-36 place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
        {p.cover_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover_path} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <PackageIcon size={34} className="text-primary/50" />
        )}
        {p.badge ? <span className="absolute left-3 top-3 rounded-xl bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow">{p.badge}</span> : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{p.name}</h3>
        <p className="flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin size={12} /> {p.destination ?? 'Berbagai destinasi'} · {p.duration_days} hari</p>
        {p.facilities?.length ? <p className="line-clamp-1 text-xs font-semibold text-slate-400">{p.facilities.slice(0, 4).join(' · ')}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-extrabold text-primary">{formatIDR(p.price)}</span>
          <Badge tone="neutral">{p.capacity > 0 ? `${p.capacity} pax` : 'fleksibel'}</Badge>
        </div>
        <button onClick={() => onBook(p)} className="mt-3 min-h-10 w-full rounded-2xl bg-primary text-xs font-extrabold text-white transition hover:bg-primary/90">Pesan Paket</button>
      </div>
    </article>
  );
}

/** Customer view: four managed sections, all content from the CMS. */
export function PublicPackagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [booking, setBooking] = useState<TourPackageRow | null>(null);
  const [form, setForm] = useState({ travel_date: '', pax: '1', contact_phone: '', notes: '' });
  const [instructions, setInstructions] = useState<string | null>(null);
  const [lastBookingUuid, setLastBookingUuid] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ['catalog-packages'],
    queryFn: async () => {
      const results = await Promise.all(
        SECTIONS.map(async (s) => [s.key, (await http.get<{ data: Paged }>(`/catalog/tour-packages?filter=${s.key}&per_page=8`)).data.data.data] as const),
      );
      return Object.fromEntries(results) as Record<string, TourPackageRow[]>;
    },
  });

  const isCustomer = user?.role === 'customer';
  const myBookings = useQuery({ queryKey: ['my-package-bookings'], queryFn: fetchMyPackageBookings, enabled: isCustomer });

  const createMutation = useMutation({
    mutationFn: () => createPackageBooking({ tour_package_id: booking!.id, travel_date: form.travel_date, pax: Number(form.pax), contact_phone: form.contact_phone || undefined, notes: form.notes || undefined }),
    onSuccess: (res) => { setInstructions(res.payment_instructions); setLastBookingUuid(res.booking.uuid); toast('Booking paket dibuat. Ikuti instruksi pembayaran.', 'success'); queryClient.invalidateQueries({ queryKey: ['my-package-bookings'] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal membuat booking paket.'), 'error'),
  });
  const confirmMutation = useMutation({
    mutationFn: confirmPackageTransfer,
    onSuccess: () => { toast('Terima kasih! Tim kami akan memverifikasi pembayaran.', 'success'); queryClient.invalidateQueries({ queryKey: ['my-package-bookings'] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal mengonfirmasi transfer.'), 'error'),
  });
  const payMutation = useMutation({
    mutationFn: (uuid: string) => payPackageBooking(uuid, 'snap'),
    onSuccess: (res) => {
      const url = (res.payload?.redirect_url as string) || '';
      if (url) { window.open(url, '_blank', 'noopener'); toast('Halaman pembayaran dibuka. Status akan diperbarui otomatis setelah pembayaran.', 'info'); }
      else toast('Pembayaran dibuat. Selesaikan sesuai instruksi gateway.', 'info');
      queryClient.invalidateQueries({ queryKey: ['my-package-bookings'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memulai pembayaran online.'), 'error'),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelPackageBooking,
    onSuccess: () => { toast('Booking dibatalkan.', 'success'); queryClient.invalidateQueries({ queryKey: ['my-package-bookings'] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal membatalkan booking.'), 'error'),
  });

  function openBooking(p: TourPackageRow) {
    setBooking(p); setInstructions(null); setForm({ travel_date: '', pax: '1', contact_phone: '', notes: '' });
  }

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (query.isError) return <EmptyState title="Gagal memuat paket wisata" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;

  const data = query.data ?? {};
  const allEmpty = SECTIONS.every((s) => (data[s.key] ?? []).length === 0);
  const statusTone = (s: string) => (s === 'paid' || s === 'completed' ? 'success' : s === 'cancelled' ? 'danger' : 'warning');
  const statusLabel = (s: string) => ({ waiting_payment: 'Menunggu Pembayaran', waiting_verification: 'Menunggu Verifikasi', paid: 'Terkonfirmasi', completed: 'Selesai', cancelled: 'Dibatalkan' } as Record<string, string>)[s] ?? s;

  return (
    <div className="space-y-8">
      <PageHeader title="Paket Wisata" description="Jelajahi paket wisata SJT Travel — dikurasi dan diperbarui oleh tim kami." />

      {isCustomer && (myBookings.data?.length ?? 0) > 0 ? (
        <AppCard>
          <SectionHeader title="Booking Paket Saya" description="Pantau status dan selesaikan pembayaran." />
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {myBookings.data!.map((b: PackageBookingSummary) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">{b.tour_package?.name ?? 'Paket'} <Badge tone={statusTone(b.status)}>{statusLabel(b.status)}</Badge></p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">{b.code} · {new Date(b.travel_date).toLocaleDateString('id-ID')} · {b.pax} pax · {formatIDR(b.amount)}</p>
                </div>
                <div className="flex gap-2">
                  {b.status === 'waiting_payment' ? <button onClick={() => payMutation.mutate(b.uuid)} disabled={payMutation.isPending} className="min-h-9 rounded-xl bg-primary px-3 text-xs font-extrabold text-white hover:bg-primary/90 disabled:opacity-60">Bayar Online</button> : null}
                  {b.status === 'waiting_payment' ? <button onClick={() => confirmMutation.mutate(b.uuid)} disabled={confirmMutation.isPending} className="min-h-9 rounded-xl bg-emerald-600 px-3 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60">Sudah Transfer</button> : null}
                  {b.status === 'waiting_payment' || b.status === 'waiting_verification' ? <button onClick={() => { if (confirm('Batalkan booking ini?')) cancelMutation.mutate(b.uuid); }} className="min-h-9 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300">Batal</button> : null}
                </div>
              </li>
            ))}
          </ul>
        </AppCard>
      ) : null}

      {allEmpty ? (
        <EmptyState title="Belum ada paket wisata" description="Paket akan tampil di sini begitu dipublikasikan. Cek kembali segera!" />
      ) : (
        SECTIONS.map((s) => {
          const rows = data[s.key] ?? [];
          if (rows.length === 0) return null;
          return (
            <AppCard key={s.key}>
              <SectionHeader title={s.title} description={s.desc} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rows.map((p) => <PackageCard key={p.id} p={p} onBook={openBooking} />)}
              </div>
            </AppCard>
          );
        })
      )}

      {booking ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onClick={() => setBooking(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Pesan: {booking.name}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{booking.destination ?? 'Berbagai destinasi'} · {booking.duration_days} hari · {formatIDR(booking.price)}/pax</p>
            {instructions ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">✅ Booking dibuat! Bayar online sekarang atau transfer manual sesuai instruksi:<br /><span className="mt-1 block font-normal">{instructions}</span></div>
                {lastBookingUuid ? <button onClick={() => payMutation.mutate(lastBookingUuid)} disabled={payMutation.isPending} className="min-h-11 w-full rounded-2xl bg-primary text-sm font-extrabold text-white hover:bg-primary/90 disabled:opacity-60">{payMutation.isPending ? 'Membuka pembayaran…' : '💳 Bayar Online Sekarang'}</button> : null}
                <button onClick={() => setBooking(null)} className="min-h-11 w-full rounded-2xl border border-slate-200 text-sm font-extrabold text-slate-600 dark:border-slate-800 dark:text-slate-300">Nanti — cek "Booking Paket Saya"</button>
              </div>
            ) : (
              <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
                <input required type="date" value={form.travel_date} onChange={(e) => setForm({ ...form, travel_date: e.target.value })} className="min-h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950" aria-label="Tanggal keberangkatan" />
                <input required type="number" min={1} value={form.pax} onChange={(e) => setForm({ ...form, pax: e.target.value })} placeholder="Jumlah pax" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950" />
                <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="No. HP kontak (opsional)" className="min-h-11 w-full rounded-2xl border border-slate-200 px-4 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950" />
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Catatan (opsional)" rows={2} className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-800 dark:bg-slate-950" />
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Total: {formatIDR(booking.price * Number(form.pax || 0))}</p>
                {!isCustomer ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">Masuk sebagai customer untuk memesan paket.</p> : null}
                <div className="flex gap-2">
                  <button type="submit" disabled={!isCustomer || createMutation.isPending} className="min-h-11 flex-1 rounded-2xl bg-primary text-sm font-extrabold text-white hover:bg-primary/90 disabled:opacity-60">{createMutation.isPending ? 'Memproses…' : 'Buat Booking'}</button>
                  <button type="button" onClick={() => setBooking(null)} className="min-h-11 rounded-2xl border border-slate-200 px-4 text-sm font-extrabold text-slate-600 dark:border-slate-800 dark:text-slate-300">Tutup</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
