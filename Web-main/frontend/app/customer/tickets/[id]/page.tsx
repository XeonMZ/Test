import { IntegratedResourcePage } from '@/shared/components/integrated-resource-page';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IntegratedResourcePage title={`Ticket ${id}`} description="Ticket detail from existing Ticket API." endpoint={`/v1/tickets/${id}`} queryKey={`ticket-${id}`} currentRole="customer" allowedRoles={['customer','admin','owner']} realtimeTopic="ticket events" columns={[{key:'id',label:'Ticket'},{key:'status',label:'Status'},{key:'booking_id',label:'Booking'},{key:'created_at',label:'Created'}]} />;
}
