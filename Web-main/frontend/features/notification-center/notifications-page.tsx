'use client';

import { Bell, BellOff, CheckCheck, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/services/portal';
import { extractApiError, formatDateTime } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, Badge, EmptyState, PageHeader, Skeleton } from '@/shared/ui/components';

/**
 * Real per-user notification center backed by GET /notifications.
 * Replaces the previous seed-data NotificationCenter for every role.
 */
export function NotificationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['user-notifications'], queryFn: fetchNotifications, refetchInterval: 30_000 });

  const readMutation = useMutation({
    mutationFn: (uuid: string) => markNotificationRead(uuid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications'] }),
    onError: (error) => toast(extractApiError(error, 'Gagal menandai notifikasi.'), 'error'),
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast('Semua notifikasi ditandai dibaca.', 'success');
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menandai semua notifikasi.'), 'error'),
  });

  const items = query.data?.items ?? [];
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
              <NotificationRow key={item.uuid} item={item} onRead={() => readMutation.mutate(item.uuid)} />
            ))}
          </ul>
        </AppCard>
      )}
    </div>
  );
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: () => void }) {
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
      {isUnread ? (
        <button onClick={onRead} className="shrink-0 self-center rounded-2xl border border-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-300">
          Tandai dibaca
        </button>
      ) : null}
    </li>
  );
}
