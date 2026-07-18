'use client';

import { Bell, BellOff, CheckCheck, RefreshCw, Trash2, Undo2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  type NotificationItem,
} from '@/services/portal';
import { extractApiError, formatDateTime } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, Skeleton } from '@/shared/ui/components';
import { categoryOfType } from './api';
import { useNotificationPreferences } from './hooks';

/**
 * Real per-user notification center backed by GET /notifications, with
 * read/unread/delete actions and per-browser category preferences.
 */
export function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useNotificationPreferences();

  const query = useQuery({ queryKey: ['user-notifications'], queryFn: fetchNotifications, refetchInterval: 30_000 });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] });

  const readMutation = useMutation({
    mutationFn: (uuid: string) => markNotificationRead(uuid),
    onSuccess: invalidate,
    onError: (error) => toast(extractApiError(error, 'Gagal menandai notifikasi.'), 'error'),
  });

  const unreadMutation = useMutation({
    mutationFn: (uuid: string) => markNotificationUnread(uuid),
    onSuccess: invalidate,
    onError: (error) => toast(extractApiError(error, 'Gagal menandai notifikasi.'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => deleteNotification(uuid),
    onSuccess: () => {
      toast('Notifikasi dihapus.', 'success');
      invalidate();
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menghapus notifikasi.'), 'error'),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast('Semua notifikasi ditandai dibaca.', 'success');
      invalidate();
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menandai semua notifikasi.'), 'error'),
  });

  const allItems = query.data?.items ?? [];
  const mutedCategories = useMemo(
    () => new Set(preferences.filter((preference) => !preference.enabled).map((preference) => preference.key)),
    [preferences],
  );
  const items = allItems.filter((item) => !mutedCategories.has(categoryOfType(item.type)));
  const hiddenCount = allItems.length - items.length;
  const unread = query.data?.unread ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        description={unread > 0 ? `${unread} notifikasi belum dibaca.` : 'Semua notifikasi sudah dibaca.'}
        actions={
          <>
            {unread > 0 ? (
              <ActionButton onClick={() => readAllMutation.mutate()} disabled={readAllMutation.isPending}>
                <CheckCheck size={16} /> Tandai semua dibaca
              </ActionButton>
            ) : null}
            <ActionButton onClick={() => query.refetch()} disabled={query.isFetching} className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800">
              <RefreshCw size={16} className={query.isFetching ? 'animate-spin' : ''} /> Refresh
            </ActionButton>
          </>
        }
      />

      {hiddenCount > 0 ? (
        <p className="text-xs font-semibold text-slate-400">
          {hiddenCount} notifikasi disembunyikan oleh preferensi kategori di perangkat ini.
        </p>
      ) : null}

      {query.isLoading ? (
        <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" /></div>
      ) : query.isError ? (
        <EmptyState title="Gagal memuat notifikasi" description={extractApiError(query.error, 'Terjadi kesalahan.')} />
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada notifikasi" description="Notifikasi pembayaran, tiket, dan pengumuman akan muncul di sini." />
      ) : (
        <AppCard>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <NotificationRow
                key={item.uuid}
                item={item}
                busy={readMutation.isPending || unreadMutation.isPending || deleteMutation.isPending}
                onRead={() => readMutation.mutate(item.uuid)}
                onUnread={() => unreadMutation.mutate(item.uuid)}
                onDelete={() => deleteMutation.mutate(item.uuid)}
              />
            ))}
          </ul>
        </AppCard>
      )}
    </div>
  );
}

function NotificationRow({ item, busy, onRead, onUnread, onDelete }: { item: NotificationItem; busy: boolean; onRead: () => void; onUnread: () => void; onDelete: () => void }) {
  const isUnread = item.read_at === null;

  return (
    <li className={clsx('flex gap-4 py-4', isUnread ? '' : 'opacity-70')}>
      <span className={clsx('mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl', isUnread ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400 dark:bg-slate-800')}>
        {isUnread ? <Bell size={18} /> : <BellOff size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-extrabold text-slate-900 dark:text-slate-100">{item.title}</p>
          <Badge tone={isUnread ? 'warning' : 'neutral'}>{item.type.replaceAll('_', ' ')}</Badge>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
        <p className="mt-1.5 text-xs font-semibold text-slate-400">{formatDateTime(item.created_at)}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end justify-center gap-2 sm:flex-row sm:items-center">
        {isUnread ? (
          <button onClick={onRead} disabled={busy} className={rowActionClass}>
            Tandai dibaca
          </button>
        ) : (
          <button onClick={onUnread} disabled={busy} className={rowActionClass}>
            <Undo2 size={13} className="mr-1 inline" /> Belum dibaca
          </button>
        )}
        <button onClick={onDelete} disabled={busy} className="rounded-2xl border border-rose-200 px-3 py-1.5 text-xs font-extrabold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:hover:bg-rose-950/40">
          <Trash2 size={13} className="mr-1 inline" /> Hapus
        </button>
      </div>
    </li>
  );
}

const rowActionClass = 'rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-300';
