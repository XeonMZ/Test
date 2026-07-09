import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Booking Management"
      description="Monitor all customer bookings across routes and schedules."
      endpoint="/admin/bookings"
      queryKey="admin-bookings"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'code', label: 'Code' },
        { key: 'customer.user.name', label: 'Customer' },
        { key: 'schedule.route.origin', label: 'Origin' },
        { key: 'schedule.route.destination', label: 'Destination' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
      ]}
    />
  );
}
