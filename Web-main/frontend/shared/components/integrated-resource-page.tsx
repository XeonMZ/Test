'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { http } from '@/services/http';
import { ActionButton, AppCard, Badge, DataTable, EmptyState, FilterBar, Loading, PageHeader, SearchBar, SectionHeader } from '@/shared/ui/components';
import { PermissionGuard, RoleGuard } from '@/shared/ui/guards/guards';
import type { AppRole } from '@/shared/ui/navigation/types';

export type ResourceColumn = { key: string; label: string };

type IntegratedResourcePageProps = {
  title: string;
  description: string;
  endpoint?: string;
  queryKey: string;
  columns?: ResourceColumn[];
  allowedRoles: AppRole[];
  currentRole: AppRole;
  realtimeTopic?: string;
  todoEndpoint?: string;
};

function getValue(row: Record<string, unknown>, key: string) {
  const value = key.split('.').reduce<unknown>((carry, part) => (carry && typeof carry === 'object' ? (carry as Record<string, unknown>)[part] : undefined), row);
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function normalizeRows(payload: unknown): Record<string, unknown>[] {
  const data = payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: unknown }).data : payload;
  if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) return ((data as { data: unknown }).data as unknown[]).filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  if (Array.isArray(data)) return data.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item));
  if (data && typeof data === 'object') return [data as Record<string, unknown>];
  return [];
}

export function IntegratedResourcePage({ title, description, endpoint, queryKey, columns = [{ key: 'id', label: 'ID' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Created' }], allowedRoles, currentRole, realtimeTopic, todoEndpoint }: IntegratedResourcePageProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? 'id');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const hasEndpoint = Boolean(endpoint);
  const query = useQuery({
    queryKey: [queryKey, endpoint],
    enabled: hasEndpoint,
    queryFn: async () => (await http.get(endpoint as string)).data,
  });

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return normalizeRows(query.data)
      .filter((row) => (status === 'all' ? true : getValue(row, 'status').toLowerCase() === status.toLowerCase()))
      .filter((row) => (q ? JSON.stringify(row).toLowerCase().includes(q) : true))
      .sort((a, b) => getValue(a, sortKey).localeCompare(getValue(b, sortKey)));
  }, [query.data, search, sortKey, status]);

  const statuses = Array.from(new Set(normalizeRows(query.data).map((row) => getValue(row, 'status')).filter((value) => value !== '—')));
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const tableRows = pagedRows.map((row) => columns.map((column) => column.key === 'status' ? <Badge key={column.key}>{getValue(row, column.key)}</Badge> : getValue(row, column.key)));

  return <RoleGuard role={currentRole} allowed={allowedRoles}><PermissionGuard><div className="space-y-6 sm:space-y-8">
    <PageHeader title={title} description={description} actions={<ActionButton onClick={() => query.refetch()} disabled={!hasEndpoint || query.isFetching}><RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh</ActionButton>} />
    <FilterBar><div onChange={(event) => { setSearch((event.target as HTMLInputElement).value); setPage(1); }}><SearchBar placeholder={`Search ${title}`} /></div><select aria-label="Filter by status" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item}</option>)}</select><select aria-label="Sort records" className="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200" value={sortKey} onChange={(event) => setSortKey(event.target.value)}>{columns.map((column) => <option key={column.key} value={column.key}>Sort by {column.label}</option>)}</select>{realtimeTopic ? <Badge tone="success">Realtime: {realtimeTopic}</Badge> : <Badge>View only</Badge>}</FilterBar>
    {!hasEndpoint ? <EmptyState title="Backend endpoint pending" description={todoEndpoint ?? 'Typed readonly TODO interface only; no backend endpoint was created.'} /> : query.isLoading ? <Loading /> : query.isError ? <AppCard><SectionHeader title="Unable to load data" description={(query.error as Error).message} /><ActionButton className="mt-4" onClick={() => query.refetch()}>Retry</ActionButton></AppCard> : rows.length === 0 ? <EmptyState title="No records found" description="Try clearing search or filters, then refresh." /> : <DataTable columns={columns.map((column) => column.label)} rows={tableRows} />}
    <nav aria-label="Pagination" className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-3 text-sm font-bold shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between"><span className="text-slate-500 dark:text-slate-400">Page {page} • {rows.length} records</span><div className="flex gap-2"><button className="min-h-10 rounded-2xl border border-slate-200 px-4 py-2 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button className="min-h-10 rounded-2xl border border-slate-200 px-4 py-2 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800" disabled={page * pageSize >= rows.length} onClick={() => setPage((value) => value + 1)}>Next</button></div></nav>
  </div></PermissionGuard></RoleGuard>;
}
