import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Vehicle Management"
      description="Track fleet vehicles, plate numbers, and maintenance status."
      endpoint="/admin/vehicles"
      queryKey="admin-vehicles"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'plate_number', label: 'Plate No.' },
        { key: 'code', label: 'Code' },
        { key: 'brand', label: 'Brand' },
        { key: 'status', label: 'Status' },
        { key: 'layout.name', label: 'Layout' },
      ]}
    />
  );
}
