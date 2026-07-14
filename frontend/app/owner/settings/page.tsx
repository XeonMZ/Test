import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export const metadata = { title: 'Owner — Settings — SJT' };

export default function Page() {
  return <IntegratedResourcePage title="System Settings" description="Konfigurasi sistem dari API admin settings (akses owner diizinkan backend, tampilan baca-saja)." endpoint="/admin/settings" queryKey="owner-settings" currentRole="owner" allowedRoles={['owner']} realtimeTopic="settings events" columns={[{ key: 'key', label: 'Kunci' }, { key: 'group', label: 'Grup' }, { key: 'updated_at', label: 'Diubah' }]} />;
}
