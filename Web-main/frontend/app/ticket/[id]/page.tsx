import { BoardingStatus } from '../../../components/ticket/boarding-status';
import { TicketDetail } from '../../../components/ticket/ticket-detail';
export default function TicketDetailPage() { return <main className="min-h-screen bg-secondary px-4 py-12"><section className="mx-auto max-w-4xl space-y-6"><BoardingStatus /><TicketDetail /></section></main>; }
