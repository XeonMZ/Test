'use client';

import { Loader2, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60';
const th = 'py-3 pr-4 font-extrabold';
const td = 'py-3 pr-4';

export function JastipPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    item_name: '', description: '', sender_name: '', receiver_name: '', driver_id: '', route_id: '',
    pickup_label: '', pickup_lat: '', pickup_lng: '', drop_label: '', drop_lat: '', drop_lng: '', fee: '',
  });

  const drivers = useQuery({ queryKey: ['manage-drivers-staff'], queryFn: () => adminApi.driversList({}), staleTime: 60_000 });
  const options = useQuery({ queryKey: ['manage-form-options'], queryFn: adminApi.formOptions, staleTime: 60_000 });
  const query = useQuery({ queryKey: ['jastip'], queryFn: () => adminApi.jastipList({}), placeholderData: keepPreviousData });

  const createMutation = useMutation({
    mutationFn: () => adminApi.jastipCreate({
      item_name: form.item_name.trim(),
      description: form.description.trim() || undefined,
      sender_name: form.sender_name.trim() || undefined,
      receiver_name: form.receiver_name.trim() || undefined,
      driver_id: Number(form.driver_id),
      route_id: Number(form.route_id),
      pickup_label: form.pickup_label.trim() || undefined,
      pickup_lat: form.pickup_lat ? Number(form.pickup_lat) : undefined,
      pickup_lng: form.pickup_lng ? Number(form.pickup_lng) : undefined,
      drop_label: form.drop_label.trim() || undefined,
      drop_lat: form.drop_lat ? Number(form.drop_lat) : undefined,
      drop_lng: form.drop_lng ? Number(form.drop_lng) : undefined,
      fee: form.fee ? Number(form.fee) : 0,
    }),
    onSuccess: () => {
      toast('Paket jastip dibuat.', 'success');
      setOpen(false);
      setForm({ item_name: '', description: '', sender_name: '', receiver_name: '', driver_id: '', route_id: '', pickup_label: '', pickup_lat: '', pickup_lng: '', drop_label: '', drop_lat: '', drop_lng: '', fee: '' });
      queryClient.invalidateQueries({ queryKey: ['jastip'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membuat paket.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.jastipDelete,
    onSuccess: () => { toast('Paket dihapus.', 'success'); queryClient.invalidateQueries({ queryKey: ['jastip'] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal menghapus.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Jastip / Paket"
        description="Kelola jasa titip barang & paket. Assign ke driver dengan titik jemput dan titik antar."
        actions={<ActionButton onClick={() => setOpen((v) => !v)}>{open ? 'Tutup' : <><Plus size={16} /> Paket baru</>}</ActionButton>}
      />

      {open ? (
        <AppCard>
          <SectionHeader title="Paket baru" description="Tempel koordinat dari Google Maps untuk titik jemput & antar." />
          <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
            <input required value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Nama barang" className={input} />
            <input value={form.sender_name} onChange={(e) => setForm({ ...form, sender_name: e.target.value })} placeholder="Pengirim" className={input} />
            <input value={form.receiver_name} onChange={(e) => setForm({ ...form, receiver_name: e.target.value })} placeholder="Penerima" className={input} />
            <select required value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className={input}>
              <option value="">Assign driver (opsional)</option>
              {drivers.data?.data.map((d) => <option key={d.id} value={d.id}>{d.user?.name ?? `Driver #${d.id}`}</option>)}
            </select>
            <select required value={form.route_id} onChange={(e) => setForm({ ...form, route_id: e.target.value })} className={input}>
              <option value="">Pilih rute (wajib)</option>
              {options.data?.routes?.map((r: { id: number; code: string; origin: string; destination: string }) => (
                <option key={r.id} value={r.id}>{r.code} — {r.origin} → {r.destination}</option>
              ))}
            </select>
            <input value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} placeholder="Biaya (Rp)" type="number" className={input} />
            <div />
            <input value={form.pickup_label} onChange={(e) => setForm({ ...form, pickup_label: e.target.value })} placeholder="Titik jemput" className={input} />
            <input value={form.pickup_lat} onChange={(e) => setForm({ ...form, pickup_lat: e.target.value })} placeholder="Lat jemput" className={input} />
            <input value={form.pickup_lng} onChange={(e) => setForm({ ...form, pickup_lng: e.target.value })} placeholder="Lng jemput" className={input} />
            <input value={form.drop_label} onChange={(e) => setForm({ ...form, drop_label: e.target.value })} placeholder="Titik antar" className={input} />
            <input value={form.drop_lat} onChange={(e) => setForm({ ...form, drop_lat: e.target.value })} placeholder="Lat antar" className={input} />
            <input value={form.drop_lng} onChange={(e) => setForm({ ...form, drop_lng: e.target.value })} placeholder="Lng antar" className={input} />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi (opsional)" rows={2} className={`${input} sm:col-span-2 lg:col-span-3`} />
            <div className="lg:col-span-3"><button type="submit" disabled={createMutation.isPending} className={btnPrimary}>{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Package size={15} />} Simpan paket</button></div>
          </form>
        </AppCard>
      ) : null}

      {query.isLoading ? <Skeleton className="h-48" /> : (query.data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada paket" description="Buat paket jastip pertama di atas." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className={th}>Kode</th><th className={th}>Barang</th><th className={th}>Jemput → Antar</th><th className={th}>Driver</th><th className={th}>Biaya</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {query.data!.data.map((j) => (
                <tr key={j.id}>
                  <td className={`${td} font-mono text-xs font-extrabold`}>{j.code}</td>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{j.item_name}</td>
                  <td className={`${td} text-xs`}>{j.pickup_label ?? '—'} → {j.drop_label ?? '—'}</td>
                  <td className={td}>{j.driver?.user?.name ?? <span className="text-slate-400">Belum di-assign</span>}</td>
                  <td className={`${td} font-extrabold`}>{formatIDR(j.fee)}</td>
                  <td className={td}><Badge tone={j.status === 'delivered' ? 'success' : j.status === 'cancelled' ? 'danger' : 'warning'}>{j.status}</Badge></td>
                  <td className="py-3 text-right"><button onClick={() => deleteMutation.mutate(j.id)} disabled={deleteMutation.isPending} aria-label="Hapus" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      )}
    </div>
  );
}
