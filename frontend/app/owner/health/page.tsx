import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export const metadata = { title: 'Owner — System Health — SJT' };

export default function Page() {
  return <IntegratedResourcePage title="System Health" description="Status kesehatan sistem live dari endpoint production readiness." endpoint="/owner/production-readiness/health" queryKey="owner-health" currentRole="owner" allowedRoles={['owner']} realtimeTopic="system events" columns={[{ key: 'status', label: 'Status' }, { key: 'checks.database.status', label: 'Database' }, { key: 'checks.cache.status', label: 'Cache' }]} />;
}
