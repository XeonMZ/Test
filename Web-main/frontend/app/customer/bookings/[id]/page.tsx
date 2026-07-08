import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IntegratedResourcePage title={`Booking Detail ${id}`} description="Booking detail from existing Booking API." endpoint={`/booking/${id}`} queryKey={`booking-${id}`} currentRole="customer" allowedRoles={['customer','admin','owner']} realtimeTopic="booking events" columns={[{key:'id',label:'Booking'},{key:'status',label:'Status'},{key:'payment_status',label:'Payment'},{key:'created_at',label:'Created'}]} />;
}
