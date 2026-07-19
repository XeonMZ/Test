import type { NotificationCategory, NotificationPreference } from './types';

/**
 * Client-side notification category preferences. These mute categories in the
 * notification list UI for this browser; server data is never mutated.
 * Persisted in localStorage so the choice survives reloads.
 */
const PREFERENCES_KEY = 'stms.notification.preferences';

export const defaultNotificationPreferences: NotificationPreference[] = [
  { key: 'booking', label: 'Booking', enabled: true },
  { key: 'payment', label: 'Payment', enabled: true },
  { key: 'ticket', label: 'Ticket', enabled: true },
  { key: 'driver', label: 'Driver', enabled: true },
  { key: 'trip', label: 'Trip', enabled: true },
  { key: 'promo', label: 'Promo', enabled: true },
  { key: 'membership', label: 'Membership', enabled: true },
  { key: 'system', label: 'System', enabled: true },
];

export function loadNotificationPreferences(): NotificationPreference[] {
  if (typeof window === 'undefined') return defaultNotificationPreferences;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return defaultNotificationPreferences;
    const stored = JSON.parse(raw) as Partial<Record<NotificationCategory, boolean>>;
    return defaultNotificationPreferences.map((preference) => ({
      ...preference,
      enabled: stored[preference.key] ?? preference.enabled,
    }));
  } catch {
    return defaultNotificationPreferences;
  }
}

export function saveNotificationPreferences(preferences: NotificationPreference[]) {
  if (typeof window === 'undefined') return;
  try {
    const compact = Object.fromEntries(preferences.map((p) => [p.key, p.enabled]));
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(compact));
  } catch {
    /* ignore storage failures (e.g. private mode) */
  }
}

/** Maps a backend notification `type` (e.g. "payment_reminder") to a category. */
export function categoryOfType(type: string): NotificationCategory {
  const head = type.toLowerCase();
  const categories: NotificationCategory[] = ['booking', 'payment', 'ticket', 'driver', 'trip', 'promo', 'membership'];
  return categories.find((category) => head.startsWith(category)) ?? 'system';
}
