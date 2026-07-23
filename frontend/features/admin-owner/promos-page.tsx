'use client';

import { Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type PromoRow } from '@/services/portal';
import { extractApiError, formatIDR } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const input = 'min-h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const empty = { code: '', name: '', amount: '', starts_at: '', ends_at: '' };

/** Full promo CRUD for admin & owner (audited server-side). */
export function AdminPromosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<typeof empty>(empty);
  const [editId, setEditId] = useState<number | null>(null);

  const query = useQuery({ queryKey: ['admin-promos'], queryFn: () => adminApi.promos() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
  const payload = () => ({ code: form.code, name: form.name, amount: Number(form.amount || 0), starts_at: form.starts_at, ends_at: form.ends_at });

  const saveMutation = useMutation({
    mutationFn: () => (editId ? adminApi.promoUpdate(editId, payload()) : adminApi.promoCreate(payload())),
    onSuccess: () => { toast(editId ? 'Promo diperbarui.' : 'Promo dibuat.', 'success'); setForm(empty); setEditId(null); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan promo.'), 'error'),
  });
  const deleteMutation = useMutation({
    mutationFn: adminApi.promoDelete,
    onSuccess: () => { toast('Promo dihapus.', 'success'); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal menghapus promo.'), 'error'),
  });

  const rows = query.data?.data ?? [];
  const now = Date.now();

  return (
    <div className="space-y-6">
      <PageHeader title="Promo & Voucher" description="CRUD penuh kode promo — dipakai otomatis oleh wizard booking. Semua perubahan tercatat di audit trail." />
      <AppCard>
        <SectionHeader title={editId ? `Edit promo #${editId}` : 'Promo baru'} />
        <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="KODE (unik)" className={input} />
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama promo" className={input} />
          <input required type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Potongan (Rp)" className={input} />
          <input required type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className={input} aria-label="Mulai berlaku" />
          <input required type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} className={input} aria-label="Berakhir" />
          <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
            <button type="submit" disabled={saveMutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-60">
              {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editId ? 'Simpan perubahan' : 'Buat promo'}
            </button>
            {editId ? <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="min-h-11 rounded-md border border-slate-200 px-4 text-sm font-extrabold text-slate-600 dark:border-slate-800 dark:text-slate-300">Batal</button> : null}
          </div>
        </form>
      </AppCard>
      <AppCard>
        <SectionHeader title={`Daftar promo (${rows.length})`} />
        {query.isLoading ? <Skeleton className="mt-4 h-40" /> : query.isError ? (
          <EmptyState title="Gagal memuat promo" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
        ) : rows.length === 0 ? (
          <EmptyState title="Belum ada promo" description="Buat promo pertama lewat form di atas." />
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((p: PromoRow) => {
              const activeNow = now >= Date.parse(p.starts_at) && now <= Date.parse(p.ends_at);
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100"><Tag size={14} className="text-primary" /> {p.code} <Badge tone={activeNow ? 'success' : 'neutral'}>{activeNow ? 'berlaku' : 'tidak berlaku'}</Badge></p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-500">{p.name} · potongan {formatIDR(p.amount)} · {new Date(p.starts_at).toLocaleDateString('id-ID')} — {new Date(p.ends_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditId(p.id); setForm({ code: p.code, name: p.name, amount: String(p.amount), starts_at: p.starts_at.slice(0, 16), ends_at: p.ends_at.slice(0, 16) }); }} className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"><Pencil size={12} /> Edit</button>
                    <button onClick={() => { if (confirm(`Hapus promo ${p.code}?`)) deleteMutation.mutate(p.id); }} disabled={deleteMutation.isPending} className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900 dark:text-rose-300"><Trash2 size={12} /> Hapus</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppCard>
    </div>
  );
}
