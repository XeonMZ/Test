import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export const metadata = { title: 'Owner — Notifications — SJT' };

export default function Page() {
  return <IntegratedResourcePage title="Notifications" description="Notifikasi sistem dari API admin notifications (akses owner diizinkan backend)." endpoint="/admin/notifications" queryKey="owner-notifications" currentRole="owner" allowedRoles={['owner']} realtimeTopic="notification events" columns={[{ key: 'id', label: 'ID' }, { key: 'type', label: 'Tipe' }, { key: 'title', label: 'Judul' }, { key: 'created_at', label: 'Waktu' }]} />;
}
