import { diagnoseNetworkFailure } from '@/services/api-config';
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

export type SeatCellType = 'seat' | 'aisle' | 'driver' | 'door' | 'empty' | 'luggage' | 'toilet' | 'stairs';

/** One square of the grid an operator drew in the vehicle-layout editor. */
export type LayoutCell = {
  /** Only real, bookable seats carry an id; furniture is display-only. */
  seat_id: number | null;
  seat_number: string | null;
  row_index: number;
  column_index: number;
  cell_type: SeatCellType;
  label?: string | null;
  available: boolean;
};

export type SeatLayout = {
  has_layout: boolean;
  rows: number;
  columns: number;
  cells: LayoutCell[];
};

export type CatalogSeat = {
  id: number;
  seat_number: string;
  class: string;
  available: boolean;
  /** Grid coordinates from the operator's vehicle layout. */
  row_index?: number;
  column_index?: number;
  cell_type?: SeatCellType;
};

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
  /**
   * The full grid the operator drew — seats plus furniture (driver, door,
   * aisle, toilet). `has_layout: false` for legacy vehicles whose seats have
   * no coordinates; the client falls back to an auto 2-2 grid then.
   */
  layout?: SeatLayout;
  seats_available: number;
  capacity: number;
};

/**
 * Whitelisted public settings from GET /catalog/settings.
 *
 * MUST stay in step with the `$keys` array in
 * CatalogController::publicSettings(). Adding a key on the backend without
 * adding it here does not fail at runtime — it fails the production type
 * check, which is exactly how the welcome pop-up broke the build.
 *
 * Every value is typed `string | null` to match the eight keys that were here
 * originally and the call sites built around them. The underlying column is
 * JSON, so a toggle saved as a real boolean or a percentage saved as a number
 * can arrive as a non-string; consumers therefore coerce defensively
 * (`String(...)`, `Number(...)`, or helpers taking `unknown`) rather than
 * trusting this annotation blindly.
 */
export type PublicSettings = {
  // Company / contact
  company_name?: string | null;
  company_address?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_hours?: string | null;
  company_maps_embed?: string | null;
  whatsapp_number?: string | null;
  cs_whatsapp?: string | null;
  jastip_whatsapp?: string | null;

  // Social links rendered in the footer
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_facebook?: string | null;
  social_youtube?: string | null;
  social_x?: string | null;

  // Down payment — tour packages only
  package_dp_enabled?: string | null;
  package_dp_percent?: string | null;

  // Welcome pop-up (the inbox notification keys are NOT public)
  welcome_popup_enabled?: string | null;
  welcome_popup_title?: string | null;
  welcome_popup_body?: string | null;
  welcome_popup_image?: string | null;

  /** Legacy announcement banner; still used as the pop-up body fallback. */
  welcome_notice?: string | null;
};

export async function fetchPublicSettings(): Promise<PublicSettings> {
  const res = await http.get<{ data: PublicSettings }>('/catalog/settings');
  return res.data.data ?? {};
}

/**
 * Editable company profile for client components (footer, etc).
 * Server components should use `fetchCompanyProfile` from services/company.
 */
export async function fetchCompanyProfilePublic(): Promise<Record<string, unknown>> {
  const res = await http.get<{ data: { payload?: Record<string, unknown> } }>('/catalog/site-content/company-profile');
  return res.data.data?.payload ?? {};
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
export type PackageBookingSummary = {
  id: number; uuid: string; code: string; travel_date: string; pax: number; amount: number; status: string;
  /** DP fields — tour packages only. Computed server-side; never recompute here. */
  payment_type?: 'full' | 'dp';
  dp_percent?: number | null;
  dp_amount?: number | null;
  paid_amount?: number;
  outstanding_amount?: number;
  is_settled?: boolean;
  is_dp?: boolean;
  settlement_claimed_at?: string | null;
  settled_at?: string | null;
  tour_package?: { id: number; name: string; destination?: string | null; cover_path?: string | null; duration_days?: number } | null;
};

export async function createPackageBooking(payload: {
  tour_package_id: number; travel_date: string; pax: number; contact_phone?: string; notes?: string;
  /** Omit or 'full' to pay everything now; 'dp' pays the down payment first. */
  payment_type?: 'full' | 'dp';
}): Promise<{ booking: PackageBookingSummary; payment_instructions: string; amount_due_now: number }> {
  const res = await http.post<ApiEnvelope<{ booking: PackageBookingSummary; payment_instructions: string; amount_due_now: number }>>('/package-bookings', payload);
  return res.data.data;
}
export async function fetchMyPackageBookings(): Promise<PackageBookingSummary[]> {
  const res = await http.get<ApiEnvelope<{ data: PackageBookingSummary[] }>>('/package-bookings');
  return res.data.data.data;
}
export async function confirmPackageTransfer(uuid: string): Promise<void> {
  await http.post(`/package-bookings/${uuid}/confirm-transfer`);
}
export async function payPackageBooking(uuid: string, method: 'snap' | 'qris' | 'bank_transfer'): Promise<{ uuid: string; method: string; reference: string | null; expires_at: string | null; payload: Record<string, unknown> }> {
  const res = await http.post<ApiEnvelope<{ payment: { uuid: string; method: string; reference: string | null; expires_at: string | null; payload: Record<string, unknown> } }>>(`/package-bookings/${uuid}/pay`, { method });
  return res.data.data.payment;
}
export async function cancelPackageBooking(uuid: string): Promise<void> {
  await http.post(`/package-bookings/${uuid}/cancel`);
}

/** Pay the remaining balance of a DP booking through the gateway. */
export async function settlePackageBooking(uuid: string, method: 'snap' | 'qris' | 'bank_transfer'): Promise<{ uuid: string; method: string; reference: string | null; expires_at: string | null; payload: Record<string, unknown>; amount: number }> {
  const res = await http.post<ApiEnvelope<{ payment: { uuid: string; method: string; reference: string | null; expires_at: string | null; payload: Record<string, unknown>; amount: number } }>>(`/package-bookings/${uuid}/settle`, { method });
  return res.data.data.payment;
}

/** Declare that the remaining balance was transferred manually. */
export async function confirmPackageSettlement(uuid: string): Promise<void> {
  await http.post(`/package-bookings/${uuid}/confirm-settlement`);
}

/** A card in the customer dashboard recommendation rail, authored in the CMS. */
export type Recommendation = {
  id: number;
  title: string | null;
  body: string | null;
  image_path: string | null;
  /** Already sanitised server-side: http(s) or site-relative, else null. */
  link: string | null;
  badge: string | null;
};

export async function fetchRecommendations(): Promise<Recommendation[]> {
  const res = await http.get<ApiEnvelope<Recommendation[]>>('/catalog/recommendations');
  return res.data.data ?? [];
}

/** One slide of the CMS-authored hero carousel. */
export type HeroSlideRow = {
  id: number;
  title: string | null;
  body: string | null;
  image_path: string | null;
  link: string | null;
  cta_label: string | null;
};

export async function fetchHeroSlides(): Promise<HeroSlideRow[]> {
  const res = await http.get<ApiEnvelope<HeroSlideRow[]>>('/catalog/hero-slides');
  return res.data.data ?? [];
}

export type PackageReview = {
  id: number;
  stars: number;
  comment: string | null;
  name: string;
  created_at: string | null;
};

export type PackageRatingSummary = {
  average: number;
  total: number;
  distribution: Record<string, number>;
  reviews: PackageReview[];
};

export async function fetchPackageRatings(slug: string): Promise<PackageRatingSummary> {
  const res = await http.get<ApiEnvelope<PackageRatingSummary>>(`/catalog/tour-packages/${slug}/ratings`);
  return res.data.data;
}

/** Bookings this customer has travelled on and not yet rated. */
export type RatableBooking = {
  id: number;
  uuid: string;
  code: string;
  tour_package_id: number;
  travel_date: string;
  status: string;
  package?: { id: number; name: string; slug: string; cover_path: string | null } | null;
};

export async function fetchRatableBookings(): Promise<RatableBooking[]> {
  const res = await http.get<{ data: RatableBooking[] }>('/package-ratings/eligibility');
  return res.data.data ?? [];
}

export async function submitPackageRating(payload: {
  package_booking_id: number;
  stars: number;
  comment?: string;
}): Promise<{ message: string }> {
  const res = await http.post<ApiEnvelope<unknown>>('/package-ratings', payload);
  return { message: res.data.message };
}

/** Mints a fresh 6-digit verification passcode and emails it. */
export async function sendVerificationCode(): Promise<{ message: string; verified: boolean; expiresInMinutes: number }> {
  const res = await http.post<ApiEnvelope<{ verified: boolean; expires_in_minutes?: number }>>('/email/verification-notification');
  return {
    message: res.data.message,
    verified: res.data.data.verified,
    expiresInMinutes: res.data.data.expires_in_minutes ?? 10,
  };
}

/** Redeems the passcode. The backend answers one generic error on any failure. */
export async function confirmVerificationCode(code: string): Promise<{ message: string; verified: boolean }> {
  const res = await http.post<ApiEnvelope<{ verified: boolean }>>('/email/verify-otp', { code });
  return { message: res.data.message, verified: res.data.data.verified };
}

/** @deprecated Verification moved to passcodes — use sendVerificationCode(). */
export const resendVerificationEmail = sendVerificationCode;

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
  // A network-level failure carries no response. axios reports it as the
  // opaque string "Network Error"; replace that with a diagnosis naming the
  // URL that was attempted and the most likely cause.
  const diagnosis = diagnoseNetworkFailure(error);
  if (diagnosis) return diagnosis;

  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  if (response?.data?.errors) {
    const first = Object.values(response.data.errors)[0];
    if (Array.isArray(first) && first.length > 0) return first[0];
  }
  return response?.data?.message ?? (error instanceof Error ? error.message : fallback);
}
