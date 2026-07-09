import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Notification Center"
      description="Review sent notifications. Use the broadcast tool inside the shared notification center to send new ones."
      endpoint="/admin/notifications"
      queryKey="admin-notifications"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'user.name', label: 'Recipient' },
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title' },
        { key: 'read_at', label: 'Read At' },
        { key: 'created_at', label: 'Sent' },
      ]}
    />
  );
}
