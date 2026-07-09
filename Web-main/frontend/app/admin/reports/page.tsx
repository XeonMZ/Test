import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Reports & Activity Logs"
      description="Audit trail of admin actions across the platform."
      endpoint="/admin/reports/activity-logs"
      queryKey="admin-activity-logs"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'action', label: 'Action' },
        { key: 'subject_type', label: 'Subject' },
        { key: 'subject_id', label: 'Subject ID' },
        { key: 'created_at', label: 'When' },
      ]}
    />
  );
}
