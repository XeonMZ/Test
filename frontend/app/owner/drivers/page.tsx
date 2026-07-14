import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export const metadata = { title: 'Owner — Drivers — SJT' };

// The admin driver endpoint is shared with the owner role on the backend
// (role:admin,owner), so this page reads live data from the admin API.
export default function Page() {
  return <IntegratedResourcePage title="Drivers" description="Data driver live dari API admin (akses owner diizinkan backend)." endpoint="/admin/drivers" queryKey="owner-drivers" currentRole="owner" allowedRoles={['owner']} realtimeTopic="driver events" columns={[{ key: 'id', label: 'ID' }, { key: 'license_number', label: 'SIM' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Terdaftar' }]} />;
}
