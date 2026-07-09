import { http } from '@/services/http';

export type DashboardScope = 'admin' | 'owner';

export async function fetchBookingDetail(id: string) { return (await http.get(`/booking/${id}`)).data; }
export async function fetchCustomerBookings() { return (await http.get('/customer/bookings')).data; }
export async function fetchPaymentDetail(id: string) { return (await http.get(`/v1/payments/${id}`)).data; }
export async function fetchTickets() { return (await http.get('/v1/tickets')).data; }
export async function fetchTicketDetail(id: string) { return (await http.get(`/v1/tickets/${id}`)).data; }
export async function fetchTicketQr(id: string) { return (await http.get(`/v1/tickets/${id}/qr`)).data; }
export async function fetchDriverDashboard() { return (await http.get('/v1/driver/dashboard')).data; }
export async function fetchDriverTrips() { return (await http.get('/v1/driver/trips')).data; }
export async function fetchDriverHistory() { return (await http.get('/v1/driver/history')).data; }
export async function fetchDriverEarnings() { return (await http.get('/v1/driver/earnings')).data; }
export async function fetchDriverTimeline() { return (await http.get('/v1/driver/timeline')).data; }

export const existingAdminOwnerEndpoints = [
  'GET /customer/bookings', 'GET /booking/{id}', 'POST /booking/cancel', 'POST /booking',
  'GET /v1/payments/{payment}', 'POST /v1/payments', 'GET /v1/tickets', 'GET /v1/tickets/{ticket}',
  'GET /v1/tickets/{ticket}/qr', 'POST /v1/tickets/verify', 'POST /v1/check-in', 'POST /v1/check-in/board',
  'GET /v1/trips/{trip}/passengers', 'GET /v1/driver/dashboard', 'GET /v1/driver/trips', 'GET /v1/driver/history',
  'GET /v1/driver/earnings', 'GET /v1/driver/timeline', 'POST /v1/driver/location',
];

export const plannedReadOnlyInterfaces = [
  'TODO GET /admin/dashboard-summary', 'TODO GET /admin/reports/preview', 'TODO GET /admin/notifications',
  'TODO GET /owner/dashboard-summary', 'TODO GET /owner/reports/preview', 'TODO GET /owner/notifications',
];
