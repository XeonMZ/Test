import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export const metadata = { title: 'Trip & Route Scheduling — SJT' };
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Trip & Route Scheduling"
      description="Manage schedules, assigned drivers and vehicles per route."
      endpoint="/admin/operations"
      queryKey="owner-operations"
      currentRole="owner"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'route.origin', label: 'Origin' },
        { key: 'route.destination', label: 'Destination' },
        { key: 'driver.user.name', label: 'Driver' },
        { key: 'vehicle.plate_number', label: 'Vehicle' },
        { key: 'departure_at', label: 'Departure' },
        { key: 'status', label: 'Status' },
      ]}
    />
  );
}
