import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export const metadata = { title: 'Owner — Activity Logs — SJT' };

export default function Page() {
  return <IntegratedResourcePage title="Activity Logs" description="Jejak audit sistem dari API activity logs (akses owner diizinkan backend)." endpoint="/admin/reports/activity-logs" queryKey="owner-logs" currentRole="owner" allowedRoles={['owner']} realtimeTopic="audit events" columns={[{ key: 'id', label: 'ID' }, { key: 'action', label: 'Aksi' }, { key: 'subject_type', label: 'Objek' }, { key: 'created_at', label: 'Waktu' }]} />;
}
