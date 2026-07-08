import { http } from '@/services/http';

export type PortalStatus = 'active' | 'waiting' | 'success' | 'failed' | 'expired' | 'cancelled' | 'completed' | 'info';

export type PortalCard = {
  id: string;
  title: string;
  description: string;
  status: PortalStatus;
  meta?: string;
  href?: string;
};

export type PortalMetric = {
  label: string;
  value: string;
  helper: string;
};

export type PortalTimelineItem = {
  label: string;
  description: string;
  state: 'done' | 'current' | 'next';
};

export async function fetchCustomerBookings() {
  const response = await http.get('/customer/bookings');
  return response.data;
}

export async function fetchBookingDetail(id: string) {
  const response = await http.get(`/booking/${id}`);
  return response.data;
}

export async function fetchPaymentDetail(id: string) {
  const response = await http.get(`/v1/payments/${id}`);
  return response.data;
}

export async function fetchTickets() {
  const response = await http.get('/v1/tickets');
  return response.data;
}

export async function fetchTicketDetail(id: string) {
  const response = await http.get(`/v1/tickets/${id}`);
  return response.data;
}

export const customerEndpoints = [
  'GET /customer/bookings',
  'GET /booking/{id}',
  'POST /booking/cancel',
  'GET /v1/payments/{payment}',
  'GET /v1/tickets',
  'GET /v1/tickets/{ticket}',
  'GET /v1/tickets/{ticket}/qr',
  'GET /profile',
  'PUT /profile',
  'PUT /change-password',
];
