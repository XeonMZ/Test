import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Customer Management"
      description="Search, review, and activate/suspend customer accounts."
      endpoint="/admin/customers"
      queryKey="admin-customers"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'user.name', label: 'Name' },
        { key: 'user.email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'membership.level', label: 'Membership' },
        { key: 'user.is_active', label: 'Active' },
        { key: 'created_at', label: 'Joined' },
      ]}
    />
  );
}
