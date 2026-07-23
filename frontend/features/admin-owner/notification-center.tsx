'use client';

import {
  Ban,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Megaphone,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type NotificationActivityItem, type NotificationActivityPayload } from '@/services/portal';
import { extractApiError, formatDateTime, formatTime } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

// =====================================================================
// Notification Center — the single hub for all notification activity.
// Admin/Owner see one card per SEND ACTIVITY (never one row per
// recipient); recipients are lazy-loaded per role when expanded.
// Driver/Customer inboxes are separate per-user pages and only ever
// query /notifications (own rows) — they cannot reach these endpoints.
// =====================================================================

const inputClass = 'min-h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const selectClass = 'min-h-11 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950';
const pagerBtn = 'grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40 dark:border-slate-800 dark:text-slate-300';
const smallBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-300';
const dangerBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300';

const ROLE_LABEL: Record<string, string> = { all: 'Semua User', customer: 'Customer', driver: 'Driver', admin: 'Admin', owner: 'Owner' };

const FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'broadcast', label: 'Broadcast' },
  { value: 'personal', label: 'Personal' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Terkirim' },
  { value: 'failed', label: 'Gagal' },
  { value: 'read', label: 'Dibaca (semua)' },
  { value: 'unread', label: 'Belum Dibaca (ada)' },
];

function targetLabel(a: NotificationActivityItem): string {
  if (a.kind === 'personal') return a.target_user ? `${a.target_user.name} (${ROLE_LABEL[a.target_user.role] ?? a.target_user.role})` : 'Personal';
  return ROLE_LABEL[a.target_role ?? 'all'] ?? a.target_role ?? 'Semua User';
}

function formatDateID(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

// ------------------------- Compose / edit form -------------------------

type ComposeState = NotificationActivityPayload & { id?: number };

const EMPTY_COMPOSE: ComposeState = { kind: 'broadcast', role: 'all', email: '', title: '', body: '' };

function ComposeCard({ editing, onDone }: { editing: ComposeState | null; onDone: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ComposeState>(editing ?? EMPTY_COMPOSE);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['notification-activities'] });
    queryClient.invalidateQueries({ queryKey: ['broadcast-history'] });
  };

  const mutation = useMutation({
    mutationFn: (send: boolean) => {
      const payload = { kind: form.kind, role: form.kind === 'broadcast' ? form.role : undefined, email: form.kind === 'personal' ? form.email : undefined, title: form.title.trim(), body: form.body.trim() };
      return form.id
        ? adminApi.notificationActivityUpdate(form.id, { ...payload, send })
        : adminApi.notificationActivityCreate({ ...payload, send });
    },
    onSuccess: (_, send) => {
      toast(send ? 'Notifikasi terkirim.' : 'Draft tersimpan.', 'success');
      setForm(EMPTY_COMPOSE);
      refresh();
      onDone();
    },
    onError: (error) => toast(extractApiError(error, 'Gagal memproses notifikasi.'), 'error'),
  });

  const valid = form.title.trim().length > 0 && form.body.trim().length > 0 && (form.kind === 'broadcast' || (form.email ?? '').includes('@'));

  return (
    <AppCard>
      <SectionHeader
        title={form.id ? 'Edit Draft' : 'Buat Notifikasi'}
        description="Kirim broadcast per role atau pesan personal via email pengguna. Simpan sebagai draft untuk dikirim nanti."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as 'broadcast' | 'personal' })} aria-label="Jenis notifikasi" className={selectClass}>
          <option value="broadcast">Broadcast (per role)</option>
          <option value="personal">Personal (satu pengguna)</option>
        </select>
        {form.kind === 'broadcast' ? (
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} aria-label="Target role" className={selectClass}>
            {Object.entries(ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        ) : (
          <input type="email" required value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email pengguna tujuan" aria-label="Email pengguna tujuan" className={inputClass} />
        )}
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={150} placeholder="Judul notifikasi" aria-label="Judul" className={`${inputClass} sm:col-span-2`} />
        <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={2000} rows={3} placeholder="Isi notifikasi…" aria-label="Isi" className={`${inputClass} sm:col-span-2`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => mutation.mutate(true)} disabled={!valid || mutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary/90 disabled:opacity-50">
          {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Kirim Sekarang
        </button>
        <button onClick={() => mutation.mutate(false)} disabled={!valid || mutation.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-5 text-sm font-extrabold text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-200">
          <Save size={15} /> {form.id ? 'Simpan Draft' : 'Simpan sebagai Draft'}
        </button>
        {form.id ? (
          <button onClick={() => { setForm(EMPTY_COMPOSE); onDone(); }} className={smallBtn}>Batal edit</button>
        ) : null}
      </div>
    </AppCard>
  );
}

// -------------------- Detail: stats + recipients per role --------------------

function RecipientList({ activityId, role }: { activityId: number; role: string }) {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['notification-recipients', activityId, role, page],
    queryFn: () => adminApi.notificationActivityRecipients(activityId, { role, page, per_page: 20 }),
    placeholderData: keepPreviousData,
  });
  const meta = query.data;

  if (query.isLoading) return <Skeleton className="h-16" />;
  if (query.isError) return <p className="text-sm font-semibold text-rose-600">{extractApiError(query.error, 'Gagal memuat penerima.')}</p>;
  if ((meta?.data.length ?? 0) === 0) return <p className="text-sm font-semibold text-slate-500">Tidak ada penerima pada role ini.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="py-2 pr-4 font-extrabold">Nama</th><th className="py-2 pr-4 font-extrabold">Terkirim</th><th className="py-2 pr-4 font-extrabold">Dibaca</th><th className="py-2 pr-4 font-extrabold">Waktu Dibaca</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {meta!.data.map((r) => (
            <tr key={r.id}>
              <td className="py-2.5 pr-4 font-bold text-slate-900 dark:text-slate-100">{r.user?.name ?? '—'}<span className="block text-[10px] font-semibold text-slate-400">{r.user?.email ?? ''}</span></td>
              <td className="py-2.5 pr-4"><Badge tone={r.delivered ? 'success' : 'danger'}>{r.delivered ? 'Terkirim' : 'Gagal'}</Badge></td>
              <td className="py-2.5 pr-4"><Badge tone={r.read ? 'success' : 'warning'}>{r.read ? 'Dibaca' : 'Belum'}</Badge></td>
              <td className="py-2.5 pr-4 text-slate-500">{r.read_at ? formatDateTime(r.read_at) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {meta && meta.last_page > 1 ? (
        <nav className="mt-3 flex items-center justify-between" aria-label="Paginasi penerima">
          <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page}/{meta.last_page} · {meta.total} penerima</p>
          <div className="flex gap-2">
            <button disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={15} /></button>
            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={15} /></button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function ActivityDetail({ activityId }: { activityId: number }) {
  const [openRole, setOpenRole] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ['notification-activity', activityId],
    queryFn: () => adminApi.notificationActivityShow(activityId),
  });

  if (query.isLoading) return <Skeleton className="h-40" />;
  if (query.isError || !query.data) return <EmptyState title="Gagal memuat detail" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;

  const { activity, stats, by_role } = query.data;

  const statChips = [
    { label: 'Total Target', value: stats.total, color: 'text-slate-900 dark:text-slate-100' },
    { label: 'Berhasil', value: stats.delivered, color: 'text-emerald-600' },
    { label: 'Gagal', value: stats.failed, color: 'text-rose-600' },
    { label: 'Sudah Dibaca', value: stats.read, color: 'text-emerald-600' },
    { label: 'Belum Dibaca', value: stats.unread, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-5">
      {/* Full message + sender */}
      <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-950/60">
        <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">{activity.title}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{activity.body}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
          <span className="inline-flex items-center gap-1.5"><UserRound size={13} /> {activity.sender ? `${activity.sender.name} · ${ROLE_LABEL[activity.sender.role] ?? activity.sender.role}` : 'Sistem'}</span>
          <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {formatDateID(activity.sent_at ?? activity.created_at)} · {formatTime(activity.sent_at ?? activity.created_at)}</span>
          <span className="inline-flex items-center gap-1.5"><Users size={13} /> Target: {targetLabel(activity)}</span>
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {statChips.map((chip) => (
          <div key={chip.label} className="rounded-2xl border border-slate-100 bg-white px-3 py-3 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className={`text-xl font-extrabold ${chip.color}`}>{chip.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{chip.label}</p>
          </div>
        ))}
      </div>

      {/* Role distribution — each role expands to a lazy recipient list */}
      {by_role.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Distribusi Penerima per Role</p>
          {by_role.map((row) => (
            <div key={row.role} className="rounded-2xl border border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOpenRole(openRole === row.role ? null : row.role)}
                aria-expanded={openRole === row.role}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left"
              >
                <span className="text-sm font-extrabold capitalize text-slate-900 dark:text-slate-100">{ROLE_LABEL[row.role] ?? row.role}</span>
                <span className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <span>{row.total} User</span>
                  <span className="text-emerald-600">{row.read_count} dibaca</span>
                  {openRole === row.role ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {openRole === row.role ? <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800"><RecipientList activityId={activityId} role={row.role} /></div> : null}
            </div>
          ))}
        </div>
      ) : activity.status === 'draft' ? (
        <p className="text-sm font-semibold text-slate-500">Draft — belum ada penerima. Kirim untuk mulai distribusi.</p>
      ) : null}
    </div>
  );
}

// ----------------------------- Main page -----------------------------

export function NotificationCenterPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState({ page: 1, search: '', filter: '', date: '' });
  const [draftSearch, setDraftSearch] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [editing, setEditing] = useState<ComposeState | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ['notification-activities', filter],
    queryFn: () => adminApi.notificationActivities({
      page: filter.page,
      search: filter.search || undefined,
      filter: filter.filter || undefined,
      date: filter.date || undefined,
    }),
    placeholderData: keepPreviousData,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notification-activities'] });

  const deleteMutation = useMutation({
    mutationFn: adminApi.notificationActivityDelete,
    onSuccess: () => { toast('Draft dihapus.', 'success'); setDeleting(null); refresh(); },
    onError: (error) => { setDeleting(null); toast(extractApiError(error, 'Gagal menghapus draft.'), 'error'); },
  });

  const sendMutation = useMutation({
    mutationFn: adminApi.notificationActivitySend,
    onSuccess: () => { toast('Draft berhasil dikirim.', 'success'); refresh(); },
    onError: (error) => toast(extractApiError(error, 'Gagal mengirim draft.'), 'error'),
  });

  const meta = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Center"
        description="Pusat seluruh aktivitas notifikasi: kirim broadcast/personal, kelola draft, dan pantau statistik pengiriman per aktivitas."
        actions={
          <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}>
            <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
          </ActionButton>
        }
      />

      <ComposeCard key={editing?.id ?? 'new'} editing={editing} onDone={() => setEditing(null)} />

      {/* Search + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-md"
          onSubmit={(e) => { e.preventDefault(); setFilter((f) => ({ ...f, search: draftSearch, page: 1 })); }}
        >
          <label className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)} placeholder="Cari judul, isi, pengirim, target, role…" className={`${inputClass} pl-10`} />
          </label>
          <button type="submit" className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-extrabold text-white transition hover:bg-slate-800 dark:bg-slate-800">Cari</button>
        </form>
        <select value={filter.filter} onChange={(e) => setFilter((f) => ({ ...f, filter: e.target.value, page: 1 }))} aria-label="Filter aktivitas" className={selectClass}>
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <label className="inline-flex items-center gap-2">
          <CalendarDays size={16} className="text-slate-400" />
          <input type="date" value={filter.date} onChange={(e) => setFilter((f) => ({ ...f, date: e.target.value, page: 1 }))} aria-label="Filter tanggal" className={selectClass} />
          {filter.date ? <button onClick={() => setFilter((f) => ({ ...f, date: '', page: 1 }))} aria-label="Hapus filter tanggal" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"><X size={13} /></button> : null}
        </label>
      </div>

      {/* Activity cards — one per send activity */}
      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat aktivitas" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (meta?.data.length ?? 0) === 0 ? (
        <EmptyState title="Belum ada aktivitas notifikasi" description="Kirim broadcast atau pesan personal pertama melalui form di atas." />
      ) : (
        <div className="space-y-4">
          {meta!.data.map((a) => {
            const open = openId === a.id;
            const isDraft = a.status === 'draft';
            return (
              <AppCard key={a.id} className="overflow-hidden !p-0">
                <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : a.id)}
                    aria-expanded={open}
                    className="flex min-w-0 flex-1 flex-col gap-3 text-left sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Megaphone size={18} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base font-extrabold text-slate-900 dark:text-slate-100">{a.title}</span>
                        <Badge tone={isDraft ? 'warning' : a.status === 'failed' ? 'danger' : 'success'}>{isDraft ? 'Draft' : a.status === 'failed' ? 'Gagal' : 'Terkirim'}</Badge>
                        <Badge tone="neutral">{a.kind === 'personal' ? 'Personal' : 'Broadcast'}</Badge>
                      </span>
                      <span className="mt-1 block text-xs font-bold text-slate-500">
                        Dikirim oleh {a.sender ? `${ROLE_LABEL[a.sender.role] ?? a.sender.role} — ${a.sender.name}` : 'Sistem'} · {formatDateID(a.sent_at ?? a.created_at)} {a.sent_at ? `· ${formatTime(a.sent_at)}` : ''}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                      <span className="text-center">
                        <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100">{targetLabel(a)}</span>
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Target</span>
                      </span>
                      {!isDraft ? (
                        <>
                          <span className="text-center">
                            <span className="block text-sm font-extrabold text-slate-900 dark:text-slate-100">{a.recipients_count ?? a.sent_count}</span>
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Penerima</span>
                          </span>
                          <span className="text-center">
                            <span className="block text-sm font-extrabold text-emerald-600">{a.read_count ?? 0}</span>
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Dibaca</span>
                          </span>
                          <span className="text-center">
                            <span className="block text-sm font-extrabold text-amber-600">{a.unread_count ?? 0}</span>
                            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Belum</span>
                          </span>
                        </>
                      ) : null}
                      <span className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-extrabold text-primary">
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {open ? 'Tutup' : 'Lihat Detail'}
                      </span>
                    </span>
                  </button>

                  {/* Draft actions: edit / send / delete */}
                  {isDraft ? (
                    <span className="flex flex-wrap items-center gap-1.5 sm:shrink-0">
                      <button onClick={() => setEditing({ id: a.id, kind: a.kind, role: a.target_role ?? 'all', email: a.target_user ? undefined : '', title: a.title, body: a.body })} className={smallBtn}><Pencil size={13} /> Edit</button>
                      <button onClick={() => sendMutation.mutate(a.id)} disabled={sendMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-extrabold text-white hover:bg-primary/90 disabled:opacity-60">
                        {sendMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Kirim
                      </button>
                      {deleting === a.id ? (
                        <span className="inline-flex gap-1.5">
                          <button onClick={() => deleteMutation.mutate(a.id)} disabled={deleteMutation.isPending} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-60">
                            {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />} Ya, hapus
                          </button>
                          <button onClick={() => setDeleting(null)} aria-label="Batal" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"><X size={13} /></button>
                        </span>
                      ) : (
                        <button onClick={() => setDeleting(a.id)} className={dangerBtn}><Trash2 size={13} /> Hapus</button>
                      )}
                    </span>
                  ) : null}
                </div>

                {open ? <div className="border-t border-slate-100 px-5 py-5 dark:border-slate-800"><ActivityDetail activityId={a.id} /></div> : null}
              </AppCard>
            );
          })}

          {meta && meta.last_page > 1 ? (
            <nav className="flex items-center justify-between gap-3" aria-label="Paginasi aktivitas">
              <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page} dari {meta.last_page} · {meta.total} aktivitas</p>
              <div className="flex gap-2">
                <button disabled={meta.current_page <= 1} onClick={() => { setOpenId(null); setFilter((f) => ({ ...f, page: f.page - 1 })); }} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={16} /></button>
                <button disabled={meta.current_page >= meta.last_page} onClick={() => { setOpenId(null); setFilter((f) => ({ ...f, page: f.page + 1 })); }} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={16} /></button>
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}
