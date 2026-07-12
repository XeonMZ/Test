import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Ticket Monitoring"
      description="Track ticket check-in and boarding status across trips."
      endpoint="/admin/tickets"
      queryKey="admin-tickets"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'ticket_number', label: 'Ticket No.' },
        { key: 'booking.customer.user.name', label: 'Customer' },
        { key: 'status', label: 'Status' },
        { key: 'checked_in_at', label: 'Checked In' },
        { key: 'boarded_at', label: 'Boarded' },
      ]}
    />
  );
}
