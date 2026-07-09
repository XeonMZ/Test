import type { PortalCard, PortalMetric, PortalTimelineItem } from './api';

export const dashboardMetrics: PortalMetric[] = [
  { label: 'Upcoming trip', value: '1', helper: 'Next itinerary from BookingService data.' },
  { label: 'Waiting payment', value: '1', helper: 'Midtrans payment window monitored by PaymentService.' },
  { label: 'Active ticket', value: '2', helper: 'TicketService QR and boarding status.' },
  { label: 'Membership points', value: '12.450', helper: 'Gold level upgrade progress.' },
];

export const bookingCards: PortalCard[] = [
  { id: 'BK-2407-001', title: 'Jakarta → Bandung', description: 'Passenger, seat 4A, invoice, and timeline are available from the existing booking endpoint.', status: 'active', meta: 'Today 14:30', href: '/customer/bookings/BK-2407-001' },
  { id: 'BK-2407-002', title: 'Semarang → Yogyakarta', description: 'Awaiting Midtrans settlement before ticket generation.', status: 'waiting', meta: 'Payment expires in 24:00', href: '/customer/payment' },
  { id: 'BK-2406-112', title: 'Surabaya → Malang', description: 'Completed trip with receipt, invoice, rating, and review.', status: 'completed', meta: 'Last trip', href: '/customer/trip-history' },
];

export const paymentCards: PortalCard[] = [
  { id: 'PAY-001', title: 'Waiting Payment', description: 'Countdown and polling call the existing PaymentService and Midtrans gateway.', status: 'waiting', meta: 'Retry enabled' },
  { id: 'PAY-002', title: 'Success', description: 'Successful callback keeps booking and ticket status synchronized.', status: 'success', meta: 'Webhook verified' },
  { id: 'PAY-003', title: 'Failed / Expired', description: 'Failed and expired states reuse payment state machine transitions.', status: 'expired', meta: 'No new engine' },
];

export const ticketCards: PortalCard[] = [
  { id: 'TCK-001', title: 'QR Ticket', description: 'QR, PDF download, trip detail, check-in, and boarding status.', status: 'active', meta: 'Boarding opens 30 minutes before departure', href: '/customer/tickets/TCK-001' },
  { id: 'TCK-002', title: 'Boarded Ticket', description: 'Historical ticket with completed boarding status.', status: 'completed', meta: 'Receipt available', href: '/customer/trip-history' },
];

export const promoCards: PortalCard[] = [
  { id: 'PRM-001', title: 'Weekend Saver', description: 'Promo detail for active booking campaigns.', status: 'active', meta: 'Valid this month', href: '/customer/promo/PRM-001' },
  { id: 'VCR-001', title: 'Gold Member Voucher', description: 'Voucher detail and redemption history.', status: 'info', meta: '1 voucher available', href: '/customer/promo/PRM-001' },
];

export const timelineItems: PortalTimelineItem[] = [
  { label: 'Booking created', description: 'BookingService accepted the order', state: 'done' },
  { label: 'Seat locked', description: 'Seat reservation is active', state: 'done' },
  { label: 'Waiting payment', description: 'PaymentService awaits Midtrans settlement', state: 'current' },
  { label: 'Ticket generated', description: 'TicketService issues QR after payment success', state: 'next' },
  { label: 'Check in / boarding', description: 'Existing check-in and boarding state machines update status', state: 'next' },
];

export const notifications = ['Payment reminder for BK-2407-002', 'Ticket QR is ready for BK-2407-001', 'Gold membership benefit unlocked'];
