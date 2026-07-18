import { http } from '@/services/http';

/**
 * Typed STMS API layer. Every function talks to a real backend endpoint
 * and returns strongly typed data for the UI.
 */

export type ApiEnvelope<T> = { success: boolean; message: string; data: T };

// ---------- Catalog ----------

export type CatalogRoute = {
  id: number;
  uuid: string;
  code: string;
  origin: string;
  destination: string;
  distance_km: number;
  duration_minutes: number;
  pickup_points: Array<{ name: string; address: string }>;
  drop_points: Array<{ name: string; address: string }>;
};

export type CatalogSchedule = {
  id: number;
  uuid: string;
  departure_at: string;
  arrival_at: string;
  base_fare: number;
  status: string;
  route: { id: number; code: string; origin: string; destination: string; duration_minutes: number } | null;
  vehicle: { code: string; brand: string; layout: string | null } | null;
  capacity: number;
  seats_available: number;
};

export type CatalogSeat = { id: number; seat_number: string; class: string; available: boolean };

export type SeatMapResponse = {
  schedule: {
    id: number;
    uuid: string;
    departure_at: string;
    arrival_at: string;
    base_fare: number;
    route: { code: string; origin: string; destination: string } | null;
    vehicle: { code: string; brand: string; layout: string | null } | null;
  };
  seats: CatalogSeat[];
  seats_available: number;
  capacity: number;
};

export type PublicSettings = {
  company_name?: string | null;
  whatsapp_number?: string | null;
  cs_whatsapp?: string | null;
  jastip_whatsapp?: string | null;
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_facebook?: string | null;
  welcome_notice?: string | null;
};

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const res = await http.get<{ data: PublicSettings }>('/catalog/settings');
  return res.data.data ?? {};
}

export async function fetchRoutes(): Promise<CatalogRoute[]> {
  const res = await http.get<ApiEnvelope<CatalogRoute[]>>('/catalog/routes');
  return res.data.data;
}

export async function fetchSchedules(filters: { origin?: string; destination?: string; date?: string; route_id?: number }): Promise<CatalogSchedule[]> {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const res = await http.get<ApiEnvelope<CatalogSchedule[]>>('/catalog/schedules', { params });
  return res.data.data;
}

export async function fetchSeatMap(scheduleUuid: string): Promise<SeatMapResponse> {
  const res = await http.get<ApiEnvelope<SeatMapResponse>>(`/catalog/schedules/${scheduleUuid}/seats`);
  return res.data.data;
}

// ---------- Booking ----------

export type PassengerInput = { name: string; identity_number?: string };

export type Booking = {
  id: number;
  uuid: string;
  code: string;
  status: string;
  amount: string | number;
  expires_at?: string | null;
  created_at?: string;
  schedule?: {
    departure_at?: string;
    arrival_at?: string;
    base_fare?: string | number;
    route?: { origin?: string; destination?: string; code?: string } | null;
    vehicle?: { code?: string; brand?: string } | null;
  } | null;
  passengers?: Array<{ id: number; name: string; identity_number: string }>;
  [key: string]: unknown;
};

export async function validatePromo(payload: { code: string; amount: number }): Promise<{ valid: boolean; code?: string; discount?: number; final_amount?: number }> {
  const res = await http.post<{ data: { valid: boolean; code?: string; discount?: number; final_amount?: number } }>('/customer/promos/validate', payload);
  return res.data.data;
}

/** Resend the email-verification message (auth required, rate-limited server-side). */
export async function resendVerificationEmail(): Promise<{ message: string; verified: boolean }> {
  const res = await http.post<ApiEnvelope<{ verified: boolean }>>('/email/verification-notification');
  return { message: res.data.message, verified: res.data.data.verified };
}

export async function createBooking(payload: {
  schedule_id: number;
  seat_ids: number[];
  passengers: PassengerInput[];
  promo_code?: string;
  pickup_label?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  drop_label?: string;
  drop_lat?: number;
  drop_lng?: number;
  pickup_note?: string;
  direction?: 'berangkat' | 'pulang';
}): Promise<Booking> {
  const res = await http.post<ApiEnvelope<Booking>>('/booking', payload);
  return res.data.data;
}

export async function fetchBooking(uuid: string): Promise<Booking> {
  const res = await http.get<ApiEnvelope<Booking>>(`/booking/${uuid}`);
  return res.data.data;
}

export async function cancelBooking(bookingUuid: string): Promise<Booking> {
  const res = await http.post<ApiEnvelope<Booking>>('/booking/cancel', { booking_uuid: bookingUuid });
  return res.data.data;
}

export async function fetchCustomerBookings(): Promise<Booking[]> {
  const res = await http.get<ApiEnvelope<Booking[] | { data: Booking[] }>>('/customer/bookings');
  const data = res.data.data;
  return Array.isArray(data) ? data : (data?.data ?? []);
}

// ---------- Payments ----------

export type Payment = {
  uuid: string;
  bookingUuid?: string;
  booking_uuid?: string;
  amount: number;
  method: string;
  status: string;
  expiresAt?: string | null;
  expires_at?: string | null;
  [key: string]: unknown;
};

export async function createPayment(payload: { booking_uuid: string; amount: number; method: string }): Promise<{ payment: Payment } & Record<string, unknown>> {
  const res = await http.post<ApiEnvelope<{ payment: Payment }>>('/v1/payments', {
    ...payload,
    idempotency_key: `pay-${payload.booking_uuid}-${payload.method}`,
  });
  return res.data.data;
}

export async function fetchPayment(uuid: string): Promise<Payment> {
  const res = await http.get<ApiEnvelope<{ payment: Payment }>>(`/v1/payments/${uuid}`);
  return res.data.data.payment;
}

// ---------- Tickets ----------

export type Ticket = {
  id: number;
  uuid: string;
  ticket_number: string;
  status: string;
  booking_id: number;
  created_at?: string;
  booking?: Booking | null;
  [key: string]: unknown;
};

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await http.get<ApiEnvelope<Ticket[]>>('/v1/tickets');
  return res.data.data;
}

export async function fetchTicket(idOrUuid: string): Promise<Ticket> {
  const res = await http.get<ApiEnvelope<Ticket>>(`/v1/tickets/${idOrUuid}`);
  return res.data.data;
}

export async function fetchTicketQr(idOrUuid: string): Promise<string> {
  const res = await http.get<ApiEnvelope<{ qr_payload: string }>>(`/v1/tickets/${idOrUuid}/qr`);
  return res.data.data.qr_payload;
}

// ---------- Owner analytics ----------

export type OwnerAnalytics = {
  kpis: {
    total_revenue: number;
    revenue_this_month: number;
    total_bookings: number;
    paid_bookings: number;
    total_customers: number;
    total_drivers: number;
    active_vehicles: number;
    upcoming_schedules: number;
    tickets_issued: number;
  };
  period?: {
    from: string;
    to: string;
    bookings: number;
    revenue: number;
    cancelled: number;
    cancel_rate: number;
    occupancy_rate: number;
    schedules: number;
    jastip_orders: number;
  };
  fleet?: { active: number; maintenance: number; inactive: number; on_trip: number };
  drivers?: { available: number; offline: number; suspended: number };
  bookings_by_status: Record<string, number>;
  daily_bookings: Array<{ date: string; total: number }>;
  top_routes: Array<{ code: string; origin: string; destination: string; bookings: number; revenue: number }>;
};

export type OwnerRevenuePeriodSummary = { revenue: number; bookings: number; growth_pct: number; schedules: number };

export type OwnerRevenue = {
  range_days: number;
  total: number;
  summary?: { today: OwnerRevenuePeriodSummary; week: OwnerRevenuePeriodSummary; month: OwnerRevenuePeriodSummary };
  resources?: { active_drivers: number; active_vehicles: number; routes: number };
  daily: Array<{ date: string; total: number }>;
  by_route: Array<{ code: string; origin: string; destination: string; revenue: number; bookings: number }>;
  by_payment_status: Array<{ status: string; total: number; amount: number }>;
};

export async function fetchOwnerAnalytics(period?: string): Promise<OwnerAnalytics> {
  const res = await http.get<ApiEnvelope<OwnerAnalytics>>('/owner/analytics', { params: period ? { period } : undefined });
  return res.data.data;
}

export async function fetchOwnerRevenue(days = 30): Promise<OwnerRevenue> {
  const res = await http.get<ApiEnvelope<OwnerRevenue>>('/owner/revenue', { params: { days } });
  return res.data.data;
}

// ---------- Helpers ----------

export function formatIDR(value: number | string | null | undefined): string {
  const amount = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (!Number.isFinite(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export function extractApiError(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  if (response?.data?.errors) {
    const first = Object.values(response.data.errors)[0];
    if (Array.isArray(first) && first.length > 0) return first[0];
  }
  return response?.data?.message ?? (error instanceof Error ? error.message : fallback);
}
