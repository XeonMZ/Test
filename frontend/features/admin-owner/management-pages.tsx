'use client';

import {
  CalendarPlus,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError, formatDateTime, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60';
const th = 'py-3 pr-4 font-extrabold';
const td = 'py-3 pr-4';

function useFormOptions() {
  return useQuery({ queryKey: ['admin-form-options'], queryFn: adminApi.formOptions, staleTime: 60_000 });
}

// =============================== ROUTES ===============================

export function ManageRoutesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', origin: '', destination: '', distance_km: '', duration_minutes: '' });

  const query = useQuery({ queryKey: ['manage-routes'], queryFn: () => adminApi.routesList({}), placeholderData: keepPreviousData });

  const createMutation = useMutation({
    mutationFn: () => adminApi.routeCreate({
      code: form.code.trim(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      distance_km: Number(form.distance_km),
      duration_minutes: Number(form.duration_minutes),
    }),
    onSuccess: () => {
      toast('Rute berhasil dibuat.', 'success');
      setOpen(false);
      setForm({ code: '', origin: '', destination: '', distance_km: '', duration_minutes: '' });
      queryClient.invalidateQueries({ queryKey: ['manage-routes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-form-options'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membuat rute.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Rute"
        description="Definisikan rute perjalanan. Rute menjadi dasar jadwal dan aturan harga."
        actions={<ActionButton onClick={() => setOpen((v) => !v)}>{open ? <X size={16} /> : <Plus size={16} />} {open ? 'Tutup' : 'Rute baru'}</ActionButton>}
      />

      {open ? (
        <AppCard>
          <SectionHeader title="Rute baru" />
          <form
            className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
          >
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Kode</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="JKT-BDG" className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Kota asal</span><input required value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} placeholder="Jakarta" className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Kota tujuan</span><input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Bandung" className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Jarak (km)</span><input required type="number" min={1} value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Durasi (menit)</span><input required type="number" min={1} value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className={input} /></label>
            <div className="flex items-end"><button type="submit" disabled={createMutation.isPending} className={btnPrimary}>{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan rute</button></div>
          </form>
        </AppCard>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-48" />
      ) : query.isError ? (
        <EmptyState title="Gagal memuat rute" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (query.data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada rute" description="Buat rute pertama untuk mulai menyusun jadwal." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className={th}>Kode</th><th className={th}>Rute</th><th className={th}>Jarak</th><th className={th}>Durasi</th><th className={th}>Jadwal</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {query.data!.data.map((route) => (
                <tr key={route.id}>
                  <td className={`${td} font-mono text-xs font-extrabold`}>{route.code}</td>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{route.origin} → {route.destination}</td>
                  <td className={td}>{route.distance_km} km</td>
                  <td className={td}>{route.duration_minutes} mnt</td>
                  <td className={td}><Badge tone="neutral">{route.schedules_count ?? 0} jadwal</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      )}
    </div>
  );
}

// ============================== SCHEDULES ==============================

export function ManageSchedulesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ route_id: '', vehicle_id: '', driver_id: '', departure_at: '', arrival_at: '', base_fare: '' });

  const options = useFormOptions();
  const query = useQuery({ queryKey: ['manage-schedules'], queryFn: () => adminApi.schedulesList({}), placeholderData: keepPreviousData });

  const createMutation = useMutation({
    mutationFn: () => adminApi.scheduleCreate({
      route_id: Number(form.route_id),
      vehicle_id: Number(form.vehicle_id),
      driver_id: Number(form.driver_id),
      departure_at: form.departure_at,
      arrival_at: form.arrival_at,
      base_fare: Number(form.base_fare),
    }),
    onSuccess: () => {
      toast('Jadwal berhasil dibuat.', 'success');
      setOpen(false);
      setForm({ route_id: '', vehicle_id: '', driver_id: '', departure_at: '', arrival_at: '', base_fare: '' });
      queryClient.invalidateQueries({ queryKey: ['manage-schedules'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membuat jadwal.'), 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: adminApi.scheduleCancel,
    onSuccess: () => {
      toast('Jadwal dibatalkan.', 'success');
      queryClient.invalidateQueries({ queryKey: ['manage-schedules'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membatalkan jadwal.'), 'error'),
  });

  const noRoutes = (options.data?.routes.length ?? 0) === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Jadwal & Harga"
        description="Buat keberangkatan: pilih rute, armada, driver, waktu, dan tarif dasar per kursi."
        actions={<ActionButton onClick={() => setOpen((v) => !v)} disabled={noRoutes}>{open ? <X size={16} /> : <CalendarPlus size={16} />} {open ? 'Tutup' : 'Jadwal baru'}</ActionButton>}
      />

      {noRoutes && !options.isLoading ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200">
          Belum ada rute. Buat rute dulu di menu Kelola Rute sebelum menyusun jadwal.
        </div>
      ) : null}

      {open ? (
        <AppCard>
          <SectionHeader title="Jadwal baru" description="Sistem otomatis menolak jika armada/driver bentrok pada rentang waktu." />
          <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Rute</span>
              <select required value={form.route_id} onChange={(e) => setForm({ ...form, route_id: e.target.value })} className={input}>
                <option value="">Pilih rute</option>
                {options.data?.routes.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.origin} → {r.destination}</option>)}
              </select>
            </label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Armada</span>
              <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className={input}>
                <option value="">Pilih armada</option>
                {options.data?.vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} · {v.code}</option>)}
              </select>
            </label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Driver</span>
              <select required value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className={input}>
                <option value="">Pilih driver</option>
                {options.data?.drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Keberangkatan</span><input required type="datetime-local" value={form.departure_at} onChange={(e) => setForm({ ...form, departure_at: e.target.value })} className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Tiba</span><input required type="datetime-local" value={form.arrival_at} onChange={(e) => setForm({ ...form, arrival_at: e.target.value })} className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Tarif dasar (Rp)</span><input required type="number" min={0} value={form.base_fare} onChange={(e) => setForm({ ...form, base_fare: e.target.value })} placeholder="150000" className={input} /></label>
            <div className="flex items-end lg:col-span-3"><button type="submit" disabled={createMutation.isPending} className={btnPrimary}>{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan jadwal</button></div>
          </form>
        </AppCard>
      ) : null}

      {query.isLoading ? (
        <Skeleton className="h-48" />
      ) : query.isError ? (
        <EmptyState title="Gagal memuat jadwal" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (query.data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada jadwal" description="Buat jadwal pertama agar pelanggan bisa memesan." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className={th}>Rute</th><th className={th}>Berangkat</th><th className={th}>Armada</th><th className={th}>Driver</th><th className={th}>Tarif</th><th className={th}>Booking</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {query.data!.data.map((s) => (
                <tr key={s.id}>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{s.route ? `${s.route.origin} → ${s.route.destination}` : '—'}</td>
                  <td className={`${td} text-slate-500`}>{formatDateTime(s.departure_at)}</td>
                  <td className={td}>{s.vehicle ? `${s.vehicle.brand} · ${s.vehicle.code}` : '—'}</td>
                  <td className={td}>{s.driver?.user?.name ?? '—'}</td>
                  <td className={`${td} font-extrabold`}>{formatIDR(s.base_fare)}</td>
                  <td className={td}><Badge tone="neutral">{s.bookings_count ?? 0}</Badge></td>
                  <td className={td}><Badge tone={s.status === 'scheduled' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning'}>{s.status}</Badge></td>
                  <td className="py-3 text-right">
                    {!['cancelled', 'completed'].includes(s.status) ? (
                      <button onClick={() => cancelMutation.mutate(s.id)} disabled={cancelMutation.isPending} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300">Batalkan</button>
                    ) : <span className="text-xs font-bold text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      )}
    </div>
  );
}

// =============================== PRICING ===============================

export function ManagePricingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ route_id: '', name: '', amount: '' });

  const options = useFormOptions();
  const query = useQuery({ queryKey: ['manage-pricing'], queryFn: () => adminApi.pricingList({}), placeholderData: keepPreviousData });

  const createMutation = useMutation({
    mutationFn: () => adminApi.pricingCreate({ route_id: Number(form.route_id), name: form.name.trim(), amount: Number(form.amount) }),
    onSuccess: () => {
      toast('Aturan harga dibuat.', 'success');
      setForm({ route_id: '', name: '', amount: '' });
      queryClient.invalidateQueries({ queryKey: ['manage-pricing'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membuat aturan harga.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.pricingDelete,
    onSuccess: () => {
      toast('Aturan harga dihapus.', 'success');
      queryClient.invalidateQueries({ queryKey: ['manage-pricing'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menghapus.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Aturan Harga" description="Aturan harga tambahan per rute (mis. tarif akhir pekan, kelas VIP)." />

      <AppCard>
        <SectionHeader title="Aturan baru" />
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
          <select required value={form.route_id} onChange={(e) => setForm({ ...form, route_id: e.target.value })} className={input}>
            <option value="">Pilih rute</option>
            {options.data?.routes.map((r) => <option key={r.id} value={r.id}>{r.code} · {r.origin} → {r.destination}</option>)}
          </select>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama aturan (mis. Weekend)" className={input} />
          <input required type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Jumlah (Rp)" className={input} />
          <button type="submit" disabled={createMutation.isPending} className={btnPrimary}>{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Tambah</button>
        </form>
      </AppCard>

      {query.isLoading ? (
        <Skeleton className="h-40" />
      ) : (query.data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada aturan harga" description="Tarif dasar tetap berlaku dari masing-masing jadwal." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500"><tr><th className={th}>Rute</th><th className={th}>Nama aturan</th><th className={th}>Jumlah</th><th className="py-3 text-right font-extrabold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {query.data!.data.map((rule) => (
                <tr key={rule.id}>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{rule.route ? `${rule.route.origin} → ${rule.route.destination}` : '—'}</td>
                  <td className={td}>{rule.name}</td>
                  <td className={`${td} font-extrabold`}>{formatIDR(rule.amount)}</td>
                  <td className="py-3 text-right">
                    <button onClick={() => deleteMutation.mutate(rule.id)} disabled={deleteMutation.isPending} aria-label="Hapus" className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"><Trash2 size={13} /> Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AppCard>
      )}
    </div>
  );
}

// ============================= VEHICLE SEATS =============================

