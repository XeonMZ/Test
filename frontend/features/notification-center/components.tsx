'use client';

import { Badge } from '@/shared/ui/components';
import { AppCard, PageHeader } from '@/shared/ui/components';
import { useNotificationPreferences } from './hooks';

export function NotificationBadge({ unread }: { unread: number }) {
  return <Badge tone={unread ? 'danger' : 'success'}>{unread ? `Unread ${unread}` : 'All read'}</Badge>;
}

/**
 * Per-browser category preferences. Muted categories are hidden from the
 * notification list on this device; server data is untouched.
 */
export function NotificationPreference() {
  const { preferences, toggle } = useNotificationPreferences();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Settings"
        description="Pilih kategori notifikasi yang ditampilkan di perangkat ini. Preferensi disimpan di browser."
      />
      <AppCard className="divide-y divide-slate-100 dark:divide-slate-800">
        {preferences.map((preference) => (
          <label key={preference.key} className="flex items-center justify-between gap-4 py-4">
            <span className="font-bold">{preference.label}</span>
            <input type="checkbox" checked={preference.enabled} onChange={() => toggle(preference.key)} className="h-5 w-5" />
          </label>
        ))}
      </AppCard>
    </div>
  );
}
