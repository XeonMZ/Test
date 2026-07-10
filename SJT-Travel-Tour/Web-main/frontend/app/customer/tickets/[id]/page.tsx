import { TicketDetail } from '@/features/customer-portal/ticket-detail';

export const metadata = { title: 'E-Ticket — SJT' };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetail id={id} />;
}
