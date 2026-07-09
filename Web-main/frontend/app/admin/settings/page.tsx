import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="System Settings"
      description="Key/value platform configuration, editable via the settings API."
      endpoint="/admin/settings"
      queryKey="admin-settings"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'key', label: 'Key' },
        { key: 'value', label: 'Value' },
        { key: 'is_public', label: 'Public' },
        { key: 'updated_at', label: 'Updated' },
      ]}
    />
  );
}
