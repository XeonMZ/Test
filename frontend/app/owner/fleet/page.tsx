import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export const metadata = { title: 'Owner — Fleet — SJT' };

export default function Page() {
  return <IntegratedResourcePage title="Fleet" description="Armada live dari API admin vehicles (akses owner diizinkan backend)." endpoint="/admin/vehicles" queryKey="owner-fleet" currentRole="owner" allowedRoles={['owner']} realtimeTopic="fleet events" columns={[{ key: 'code', label: 'Kode' }, { key: 'brand', label: 'Merek' }, { key: 'plate_number', label: 'Plat' }, { key: 'status', label: 'Status' }]} />;
}
