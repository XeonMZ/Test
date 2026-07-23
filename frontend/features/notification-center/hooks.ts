'use client';

import { useEffect, useState } from 'react';
import {
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from './api';
import type { NotificationPreference } from './types';

/**
 * Local (per-browser) category mute preferences applied to the notification
 * list. Hydrates from localStorage after mount to stay SSR-safe.
 */
export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultNotificationPreferences);

  useEffect(() => {
    setPreferences(loadNotificationPreferences());
  }, []);

  const toggle = (key: NotificationPreference['key']) =>
    setPreferences((current) => {
      const next = current.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item));
      saveNotificationPreferences(next);
      return next;
    });

  return { preferences, toggle };
}
