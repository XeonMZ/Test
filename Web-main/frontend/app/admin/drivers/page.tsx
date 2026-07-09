import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Driver Management"
      description="Review driver license status and update availability status."
      endpoint="/admin/drivers"
      queryKey="admin-drivers"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'user.name', label: 'Name' },
        { key: 'license_number', label: 'License No.' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Joined' },
      ]}
    />
  );
}
