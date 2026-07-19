'use client';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { Fragment, useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, type ActivityLogItem } from '@/services/portal';
import { extractApiError, formatDateTime } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, Skeleton } from '@/shared/ui/components';

const th = 'py-3 pr-4 font-extrabold';
const td = 'py-3 pr-4 align-top';
const pagerBtn = 'grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40 dark:border-slate-800 dark:text-slate-300';

type LogFilter = { page: number; search: string; action: string; from: string; to: string; sort: string; dir: 'asc' | 'desc' };

const ACTION_GROUPS = ['', 'route.', 'schedule.', 'vehicle.', 'driver.', 'admin.', 'booking.', 'payment.', 'notification.', 'setting.', 'jastip.', 'trip.'];

export function AuditLogsPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<LogFilter>({ page: 1, search: '', action: '', from: '', to: '', sort: 'id', dir: 'desc' });
  const [draft, setDraft] = useState('');
  const [openRow, setOpenRow] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = useQuery({
    queryKey: ['audit-logs', filter],
    queryFn: () => adminApi.activityLogs({
      page: filter.page,
      search: filter.search || undefined,
      action: filter.action || undefined,
      from: filter.from || undefined,
      to: filter.to || undefined,
      sort: filter.sort,
      dir: filter.dir,
    }),
    placeholderData: keepPreviousData,
  });
  const meta = query.data;

  function toggleSort(column: string) {
    setFilter((f) => ({ ...f, page: 1, sort: column, dir: f.sort === column && f.dir === 'desc' ? 'asc' : 'desc' }));
  }

  async function exportCsv() {
    setExporting(true);
    try {
      await adminApi.downloadFile('/admin/reports/activity-logs/export', 'stms-audit-log.csv', {
        ...(filter.search ? { search: filter.search } : {}),
        ...(filter.action ? { action: filter.action } : {}),
        ...(filter.from ? { from: filter.from } : {}),
        ...(filter.to ? { to: filter.to } : {}),
        sort: filter.sort,
        dir: filter.dir,
      });
      toast('Audit log berhasil diekspor.', 'success');
    } catch (error) {
      toast(extractApiError(error, 'Ekspor gagal.'), 'error');
    } finally {
      setExporting(false);
    }
  }

  function SortHeader({ column, children }: { column: string; children: ReactNode }) {
    const active = filter.sort === column;
    return (
      <button onClick={() => toggleSort(column)} className="inline-flex items-center gap-1 font-extrabold uppercase tracking-wide hover:text-primary">
        {children} {active ? (filter.dir === 'desc' ? <ChevronDown size={12} /> : <ChevronUp size={12} />) : null}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Jejak audit seluruh aksi sistem: siapa, apa, dari mana, dan perubahan sebelum/sesudah."
        actions={
          <div className="flex gap-2">
            <ActionButton onClick={() => query.refetch()} disabled={query.isFetching}>
              <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
            </ActionButton>
            <ActionButton onClick={exportCsv} disabled={exporting}>
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Export CSV
            </ActionButton>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-sm"
          onSubmit={(e) => { e.preventDefault(); setFilter((f) => ({ ...f, page: 1, search: draft })); }}
        >
          <label className="relative min-w-0 flex-1">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Cari aksi, objek, user…" className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950" />
          </label>
          <button type="submit" className="min-h-11 rounded-2xl bg-slate-900 px-4 text-sm font-extrabold text-white transition hover:bg-slate-800 dark:bg-slate-800">Cari</button>
        </form>

        <select
          value={filter.action}
          onChange={(e) => setFilter((f) => ({ ...f, page: 1, action: e.target.value }))}
          aria-label="Filter jenis aksi"
          className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950"
        >
          {ACTION_GROUPS.map((a) => <option key={a} value={a}>{a === '' ? 'Semua aksi' : a.replace('.', '')}</option>)}
        </select>
        <input type="date" value={filter.from} onChange={(e) => setFilter((f) => ({ ...f, page: 1, from: e.target.value }))} aria-label="Dari tanggal" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950" />
        <input type="date" value={filter.to} onChange={(e) => setFilter((f) => ({ ...f, page: 1, to: e.target.value }))} aria-label="Sampai tanggal" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold dark:border-slate-800 dark:bg-slate-950" />
      </div>

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat audit log" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : (meta?.data.length ?? 0) === 0 ? (
        <EmptyState title="Tidak ada data" description="Ubah kata kunci atau rentang tanggal." />
      ) : (
        <AppCard className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className={th}><SortHeader column="id">ID</SortHeader></th>
                <th className={th}>User</th>
                <th className={th}>Role</th>
                <th className={th}><SortHeader column="action">Aksi</SortHeader></th>
                <th className={th}><SortHeader column="subject_type">Objek</SortHeader></th>
                <th className={th}>IP</th>
                <th className={th}>Perangkat</th>
                <th className={th}><SortHeader column="created_at">Waktu</SortHeader></th>
                <th className="py-3 text-right font-extrabold">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {meta!.data.map((row: ActivityLogItem) => {
                const m = row.metadata ?? {};
                const hasDiff = Boolean(m.before || m.after);
                return (
                  <Fragment key={row.id}>
                    <tr>
                      <td className={`${td} font-mono text-xs font-extrabold`}>{row.id}</td>
                      <td className={`${td} font-bold text-slate-900 dark:text-slate-100`}>{m.actor?.name ?? '—'}</td>
                      <td className={td}>{m.actor?.role ? <Badge tone="neutral"><span className="capitalize">{m.actor.role}</span></Badge> : '—'}</td>
                      <td className={`${td} font-mono text-xs`}>{row.action}</td>
                      <td className={td}>{row.subject_type?.split('\\').pop() ?? '—'}{row.subject_id ? ` #${row.subject_id}` : ''}</td>
                      <td className={`${td} font-mono text-xs`}>{m.ip ?? '—'}</td>
                      <td className={`${td} text-xs`}>{m.device ?? '—'}{m.browser ? ` · ${m.browser}` : ''}</td>
                      <td className={`${td} text-slate-500`}>{formatDateTime(row.created_at)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setOpenRow(openRow === row.id ? null : row.id)}
                          aria-expanded={openRow === row.id}
                          className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300"
                        >
                          {openRow === row.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {hasDiff ? 'Before/After' : 'Metadata'}
                        </button>
                      </td>
                    </tr>
                    {openRow === row.id ? (
                      <tr>
                        <td colSpan={9} className="bg-slate-50 px-4 py-4 dark:bg-slate-950/60">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Sebelum</p>
                              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-amber-300">{m.before ? JSON.stringify(m.before, null, 2) : '—'}</pre>
                            </div>
                            <div>
                              <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Sesudah</p>
                              <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-emerald-300">{m.after ? JSON.stringify(m.after, null, 2) : JSON.stringify(Object.fromEntries(Object.entries(m).filter(([k]) => !['actor', 'ip', 'device', 'browser', 'user_agent', 'before', 'after'].includes(k))), null, 2)}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
          {meta && meta.last_page > 1 ? (
            <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Paginasi audit log">
              <p className="text-xs font-bold text-slate-500">Hal. {meta.current_page} dari {meta.last_page} · {meta.total} entri</p>
              <div className="flex gap-2">
                <button disabled={meta.current_page <= 1} onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))} className={pagerBtn} aria-label="Sebelumnya"><ChevronLeft size={15} /></button>
                <button disabled={meta.current_page >= meta.last_page} onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))} className={pagerBtn} aria-label="Berikutnya"><ChevronRight size={15} /></button>
              </div>
            </nav>
          ) : null}
        </AppCard>
      )}
    </div>
  );
}
