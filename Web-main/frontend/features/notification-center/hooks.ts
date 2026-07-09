'use client';

import { useEffect, useMemo, useState } from 'react';
import { echoManager } from '@/shared/realtime/echo-manager';
import { useRealtime } from '@/shared/hooks/use-realtime';
import {
  defaultNotificationPreferences,
  notificationSeeds,
  resolveAuthenticatedNotificationUserId,
} from './api';
import type {
  NotificationCategory,
  NotificationFilterValue,
  NotificationPreference,
  NotificationRecord,
  NotificationRole,
} from './types';

const categories: NotificationCategory[] = [
  'booking',
  'payment',
  'ticket',
  'driver',
  'trip',
  'promo',
  'membership',
  'system',
];

export function useNotificationCenter(role: NotificationRole) {
  const realtime = useRealtime();
  const [items, setItems] = useState<NotificationRecord[]>(
    notificationSeeds[role],
  );
  const [selected, setSelected] = useState<NotificationRecord | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<NotificationFilterValue>('all');
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    if (!realtime.enabled) return;
    const echo = echoManager.connect();
    const userId = resolveAuthenticatedNotificationUserId();
    const channelName = userId
      ? `user.${userId}`
      : role === 'admin' || role === 'owner'
        ? role
        : null;
    if (!channelName) return;
    const channel = echo?.private(channelName);
    channel?.listen(
      '.notification.created',
      (event: { title?: string; message?: string }) => {
        const now = new Date().toISOString();
        setItems((current) => [
          {
            id: `realtime-${now}`,
            title: event.title ?? 'New notification',
            message: event.message ?? 'A realtime notification was received.',
            timestamp: now,
            status: 'unread',
            category: 'system',
          },
          ...current,
        ]);
      },
    );
    return () => {
      echo?.leave(channelName);
    };
  }, [realtime.enabled, role]);

  const filtered = useMemo(
    () =>
      items
        .filter(
          (item) =>
            filter === 'all' ||
            item.status === filter ||
            item.category === filter,
        )
        .filter((item) =>
          `${item.title} ${item.message} ${item.relatedEntity?.label ?? ''}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
    [filter, items, query],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const unread = items.filter((item) => item.status === 'unread').length;
  const counts = Object.fromEntries(
    categories.map((category) => [
      category,
      items.filter((item) => item.category === category).length,
    ]),
  ) as Record<NotificationCategory, number>;

  const updateStatus = (id: string, status: 'read' | 'unread') =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  const deleteOne = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setSelected((current) => (current?.id === id ? null : current));
  };

  return {
    items,
    filtered,
    paged,
    selected,
    setSelected,
    query,
    setQuery,
    filter,
    setFilter: (value: NotificationFilterValue) => {
      setFilter(value);
      setPage(1);
    },
    page,
    pageCount,
    setPage,
    unread,
    counts,
    realtime,
    markRead: (id: string) => updateStatus(id, 'read'),
    markUnread: (id: string) => updateStatus(id, 'unread'),
    markAllRead: () =>
      setItems((current) =>
        current.map((item) => ({ ...item, status: 'read' })),
      ),
    deleteOne,
    bulkDelete: (ids: string[]) =>
      setItems((current) => current.filter((item) => !ids.includes(item.id))),
  };
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(
    defaultNotificationPreferences,
  );
  return {
    preferences,
    toggle: (key: NotificationPreference['key']) =>
      setPreferences((current) =>
        current.map((item) =>
          item.key === key ? { ...item, enabled: !item.enabled } : item,
        ),
      ),
  };
}
