'use client';

import { KeyRound, Loader2, Plus, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useAuth } from '@/shared/providers/auth-provider';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';
const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60';
const th = 'py-3 pr-4 font-extrabold';
const td = 'py-3 pr-4';

// =============================== FLEET (add vehicle) ===============================

export function ManageFleetPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', plate_number: '', brand: '', status: 'active' });

  const query = useQuery({ queryKey: ['manage-fleet'], queryFn: () => adminApi.vehiclesList({}), placeholderData: keepPreviousData, refetchInterval: 60_000 });

  const createMutation = useMutation({
    mutationFn: () => adminApi.vehicleCreate({ code: form.code.trim(), plate_number: form.plate_number.trim(), brand: form.brand.trim(), status: form.status }),
    onSuccess: () => {
      toast('Armada berhasil ditambah.', 'success');
      setOpen(false);
      setForm({ code: '', plate_number: '', brand: '', status: 'active' });
      queryClient.invalidateQueries({ queryKey: ['manage-fleet'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menambah armada.'), 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.vehicleUpdate(id, { status }),
    onSuccess: () => {
      toast('Status armada diperbarui.', 'success');
      queryClient.invalidateQueries({ queryKey: ['manage-fleet'] });
      queryClient.invalidateQueries({ queryKey: ['manage-vehicles-all'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal mengubah status.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Armada"
        description="Tambah kendaraan baru. Setelah itu rancang denah kursinya di menu Denah Kursi."
        actions={<ActionButton onClick={() => setOpen((v) => !v)}>{open ? 'Tutup' : <><Plus size={16} /> Armada baru</>}</ActionButton>}
      />

      {open ? (
        <AppCard>
          <SectionHeader title="Armada baru" />
          <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Kode</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="BUS-002" className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Plat nomor</span><input required value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} placeholder="B 5678 SJT" className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Merek</span><input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Hino" className={input} /></label>
            <label className="block"><span className="mb-1.5 block text-sm font-bold">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={input}>
                <option value="active">Aktif</option><option value="maintenance">Perawatan</option><option value="inactive">Nonaktif</option>
              </select>
            </label>
            <div className="lg:col-span-4"><button type="submit" disabled={createMutation.isPending} className={btnPrimary}>{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Simpan armada</button></div>
          </form>
        </AppCard>
      ) : null}

      {query.isLoading ? <Skeleton className="h-48" /> : (query.data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada armada" description="Tambah armada pertama untuk memulai." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-button text-slate-500"><tr><th className={th}>Kode</th><th className={th}>Merek</th><th className={th}>Plat</th><th className={th}>Kursi</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Ubah status</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {query.data!.data.map((v) => (
                <tr key={v.id}>
                  <td className={`${td} font-mono text-xs font-extrabold`}>{v.code}</td>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{v.brand}</td>
                  <td className={td}>{v.plate_number}</td>
                  <td className={td}><Badge tone="neutral">{v.seats_count ?? 0} kursi</Badge></td>
                  <td className={td}>
                    {v.on_trip ? (
                      <Badge tone="warning">On Trip</Badge>
                    ) : (
                      <Badge tone={v.status === 'active' ? 'success' : v.status === 'maintenance' ? 'warning' : 'danger'}>
                        {v.status === 'active' ? 'Ready' : v.status === 'maintenance' ? 'Perbaikan' : 'Nonaktif'}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <select
                      value={v.status}
                      onChange={(e) => statusMutation.mutate({ id: v.id, status: e.target.value })}
                      disabled={statusMutation.isPending || v.on_trip}
                      aria-label={`Ubah status ${v.code}`}
                      title={v.on_trip ? 'Armada sedang dalam perjalanan' : undefined}
                      className="min-h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="active">Ready</option>
                      <option value="maintenance">Perbaikan</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
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

// =============================== ADMINS (owner only) ===============================

export function ManageAdminsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });

  const isOwner = user?.role === 'owner';
  const query = useQuery({ queryKey: ['manage-admins'], queryFn: () => adminApi.adminsList({}), enabled: isOwner, placeholderData: keepPreviousData });

  const createMutation = useMutation({
    mutationFn: () => adminApi.adminCreate(form),
    onSuccess: () => {
      toast('Admin berhasil dibuat.', 'success');
      setForm({ name: '', email: '', password: '', password_confirmation: '' });
      queryClient.invalidateQueries({ queryKey: ['manage-admins'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membuat admin.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: adminApi.adminDelete,
    onSuccess: () => { toast('Admin dihapus.', 'success'); queryClient.invalidateQueries({ queryKey: ['manage-admins'] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal menghapus.'), 'error'),
  });

  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [resetForm, setResetForm] = useState({ password: '', password_confirmation: '' });

  const resetMutation = useMutation({
    mutationFn: (id: number) => adminApi.adminResetPassword(id, resetForm),
    onSuccess: () => {
      toast('Password admin berhasil direset. Sesi lama admin tersebut otomatis keluar.', 'success');
      setResetTarget(null);
      setResetForm({ password: '', password_confirmation: '' });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal mereset password.'), 'error'),
  });

  if (!isOwner) {
    return <div className="space-y-6"><PageHeader title="Kelola Admin" /><EmptyState title="Khusus owner" description="Hanya owner yang dapat mengelola akun admin." /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Kelola Admin" description="Owner dapat menambah dan menghapus akun admin." />

      <AppCard>
        <SectionHeader title="Admin baru" description="Password harus memenuhi standar: min 8 karakter, huruf besar/kecil, angka, simbol." />
        <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className={input} />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={input} />
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className={input} />
          <input required type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Ulangi password" className={input} />
          <div className="lg:col-span-4"><button type="submit" disabled={createMutation.isPending} className={btnPrimary}>{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Tambah admin</button></div>
        </form>
      </AppCard>

      {query.isLoading ? <Skeleton className="h-40" /> : (query.data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada admin" description="Tambah admin pertama di atas." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-button text-slate-500"><tr><th className={th}>Nama</th><th className={th}>Email</th><th className="py-3 text-right font-extrabold">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {query.data!.data.map((a) => (
                <tr key={a.id}>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{a.name}</td>
                  <td className={td}>{a.email}</td>
                  <td className="py-3 text-right">
                    {resetTarget === a.id ? (
                      <form
                        className="flex flex-wrap items-center justify-end gap-2"
                        onSubmit={(e) => { e.preventDefault(); resetMutation.mutate(a.id); }}
                      >
                        <input required type="password" minLength={8} value={resetForm.password} onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })} placeholder="Password baru" className="min-h-9 w-40 rounded-xl border border-slate-200 px-3 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950" aria-label={`Password baru ${a.name}`} />
                        <input required type="password" minLength={8} value={resetForm.password_confirmation} onChange={(e) => setResetForm({ ...resetForm, password_confirmation: e.target.value })} placeholder="Ulangi" className="min-h-9 w-32 rounded-xl border border-slate-200 px-3 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950" aria-label={`Ulangi password ${a.name}`} />
                        <button type="submit" disabled={resetMutation.isPending} className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60">
                          {resetMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />} Simpan
                        </button>
                        <button type="button" onClick={() => { setResetTarget(null); setResetForm({ password: '', password_confirmation: '' }); }} className="min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-500 dark:border-slate-800">Batal</button>
                      </form>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <button onClick={() => setResetTarget(a.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300">
                          <KeyRound size={13} /> Reset password
                        </button>
                        <button onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300"><Trash2 size={13} /> Hapus</button>
                      </span>
                    )}
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

// =============================== DRIVERS (owner/admin) ===============================

export function ManageDriversPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', license_number: '' });

  const query = useQuery({ queryKey: ['manage-drivers-staff'], queryFn: () => adminApi.driversList({}), placeholderData: keepPreviousData });

  const createMutation = useMutation({
    mutationFn: () => adminApi.driverCreate(form),
    onSuccess: () => {
      toast('Driver berhasil dibuat.', 'success');
      setForm({ name: '', email: '', password: '', password_confirmation: '', license_number: '' });
      queryClient.invalidateQueries({ queryKey: ['manage-drivers-staff'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal membuat driver.'), 'error'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.driverUpdate(id, { status }),
    onSuccess: () => {
      toast('Status driver diperbarui.', 'success');
      queryClient.invalidateQueries({ queryKey: ['manage-drivers-staff'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal mengubah status.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Kelola Driver" description="Owner dan admin dapat menambah akun driver." />

      <AppCard>
        <SectionHeader title="Driver baru" description="Password harus memenuhi standar keamanan." />
        <form className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" className={input} />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className={input} />
          <input required value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} placeholder="No. SIM" className={input} />
          <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" className={input} />
          <input required type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} placeholder="Ulangi password" className={input} />
          <div className="lg:col-span-5"><button type="submit" disabled={createMutation.isPending} className={btnPrimary}>{createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Tambah driver</button></div>
        </form>
      </AppCard>

      {query.isLoading ? <Skeleton className="h-40" /> : (query.data?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada driver" description="Tambah driver pertama di atas." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-button text-slate-500"><tr><th className={th}>Nama</th><th className={th}>Email</th><th className={th}>No. SIM</th><th className={th}>Status</th><th className="py-3 text-right font-extrabold">Ubah status</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {query.data!.data.map((d) => (
                <tr key={d.id}>
                  <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{d.user?.name ?? '—'}</td>
                  <td className={td}>{d.user?.email ?? '—'}</td>
                  <td className={`${td} font-mono text-xs`}>{d.license_number}</td>
                  <td className={td}><Badge tone={d.status === 'suspended' ? 'danger' : d.status === 'offline' ? 'warning' : 'success'}>{d.status === 'suspended' ? 'Suspended' : d.status === 'offline' ? 'Nonaktif' : 'Aktif'}</Badge></td>
                  <td className="py-3 text-right">
                    <select
                      value={d.status === 'suspended' ? 'suspended' : d.status === 'offline' ? 'offline' : 'available'}
                      onChange={(e) => statusMutation.mutate({ id: d.id, status: e.target.value })}
                      disabled={statusMutation.isPending}
                      aria-label={`Ubah status ${d.user?.name ?? d.license_number}`}
                      className="min-h-9 rounded-xl border border-slate-200 bg-white px-2 text-xs font-extrabold dark:border-slate-800 dark:bg-slate-950"
                    >
                      <option value="available">Aktif</option>
                      <option value="offline">Nonaktif</option>
                      <option value="suspended">Suspended</option>
                    </select>
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
