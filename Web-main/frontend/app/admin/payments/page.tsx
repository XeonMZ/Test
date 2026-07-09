import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';
export default function Page() {
  return (
    <IntegratedResourcePage
      title="Payment Monitoring"
      description="Track payment status and gateway references across all bookings."
      endpoint="/admin/payments"
      queryKey="admin-payments"
      currentRole="admin"
      allowedRoles={['admin', 'owner']}
      columns={[
        { key: 'reference', label: 'Reference' },
        { key: 'booking.customer.user.name', label: 'Customer' },
        { key: 'method', label: 'Method' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'paid_at', label: 'Paid At' },
      ]}
    />
  );
}
