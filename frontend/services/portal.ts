import { http } from '@/services/http';
import type { ApiEnvelope } from '@/services/stms';

// =====================================================================
// Customer portal: promos, membership, notifications, tracking
// =====================================================================

export type Promo = {
  id: number;
  uuid: string;
  code: string;
  name: string;
  amount: string | number;
  starts_at: string;
  ends_at: string;
  vouchers?: Array<{ id: number; code: string; is_active: boolean }>;
};

export async function fetchPromos(): Promise<Promo[]> {
  const res = await http.get<ApiEnvelope<Promo[]>>('/customer/promos');
  return res.data.data;
}

export async function fetchPromo(idOrCode: string): Promise<Promo> {
  const res = await http.get<ApiEnvelope<Promo>>(`/customer/promos/${idOrCode}`);
  return res.data.data;
}

export type MembershipInfo = {
  membership: { uuid: string; level: string; points: number; created_at: string };
  completed_trips: number;
};

export async function fetchMembership(): Promise<MembershipInfo> {
  const res = await http.get<ApiEnvelope<MembershipInfo>>('/customer/membership');
  return res.data.data;
}

export type NotificationItem = {
  id: number;
  uuid: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export async function fetchNotifications(): Promise<{ items: NotificationItem[]; unread: number }> {
  const res = await http.get<ApiEnvelope<{ items: NotificationItem[]; unread: number }>>('/notifications');
  return res.data.data;
}

export async function markNotificationRead(uuid: string): Promise<void> {
  await http.post(`/notifications/${uuid}/read`);
}

export async function markNotificationUnread(uuid: string): Promise<void> {
  await http.post(`/notifications/${uuid}/unread`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await http.post('/notifications/read-all');
}

export async function deleteNotification(uuid: string): Promise<void> {
  await http.delete(`/notifications/${uuid}`);
}

export type BookingTracking = {
  booking: { uuid: string; code: string; status: string; pickup_label?: string | null; drop_label?: string | null };
  driver: {
    name: string | null;
    phone: string | null;
    photo_url: string | null;
    vehicle_name: string | null;
    vehicle_plate: string | null;
    rating_avg: number;
    rating_count: number;
  } | null;
  eta_minutes: number | null;
  schedule: {
    departure_at: string | null;
    arrival_at: string | null;
    route: { code: string; origin: string; destination: string } | null;
    vehicle: { code: string; brand: string } | null;
  };
  trip: { uuid: string; status: string } | null;
  location: { latitude: number; longitude: number; speed: number | null; heading: number | null; recorded_at: string } | null;
};

export async function rateDriver(bookingUuid: string, payload: { stars: number; comment?: string }): Promise<unknown> {
  const res = await http.post<ApiEnvelope<unknown>>(`/customer/bookings/${bookingUuid}/rate-driver`, payload);
  return res.data.data;
}

export async function fetchBookingTracking(bookingUuid: string): Promise<BookingTracking> {
  const res = await http.get<ApiEnvelope<BookingTracking>>(`/customer/bookings/${bookingUuid}/tracking`);
  return res.data.data;
}

// =====================================================================
// Driver: dashboard, shift, trips, check-in console
// =====================================================================

export type DriverTrip = {
  id: number;
  uuid: string;
  status: string;
  schedule_id: number;
  created_at?: string;
  [key: string]: unknown;
};

export type DriverDashboard = {
  shift: Record<string, unknown> | null;
  today_trips: number;
  earnings_today: number;
  active_trip: DriverTrip | null;
};

export async function fetchDriverDashboard(): Promise<DriverDashboard> {
  const res = await http.get<{ data: DriverDashboard }>('/v1/driver/dashboard');
  return res.data.data;
}

export async function fetchDriverTrips(): Promise<DriverTrip[]> {
  const res = await http.get<{ data: DriverTrip[] }>('/v1/driver/trips');
  return res.data.data;
}

export type DriverEarnings = {
  total_trip: number;
  total_kilometer: number;
  trip_hari_ini: number;
  pendapatan_hari_ini: number;
  pendapatan_bulan_ini: number;
  completion_rate: number;
  rating: number;
  no_show: number;
  cancellation_rate: number;
};

export async function fetchDriverEarnings(): Promise<DriverEarnings> {
  const res = await http.get<{ data: DriverEarnings }>('/v1/driver/earnings');
  return res.data.data;
}

export async function driverShiftAction(action: 'start-shift' | 'end-shift' | 'break' | 'resume'): Promise<unknown> {
  const res = await http.post(`/v1/driver/${action}`);
  return res.data;
}

export async function driverTripAction(action: 'start-trip' | 'finish-trip', tripId: number): Promise<unknown> {
  const res = await http.post(`/v1/driver/${action}`, { trip_id: tripId });
  return res.data;
}

export type VerifiedTicket = { uuid?: string; ticket_number?: string; status?: string; [key: string]: unknown };

export async function verifyTicket(qrPayload: string): Promise<VerifiedTicket> {
  const res = await http.post<ApiEnvelope<{ ticket: VerifiedTicket }>>('/v1/tickets/verify', { qr_payload: qrPayload });
  return res.data.data.ticket;
}

export async function checkInPassenger(qrPayload: string): Promise<unknown> {
  const res = await http.post<ApiEnvelope<unknown>>('/v1/check-in', { qr_payload: qrPayload });
  return res.data.data;
}

export async function checkInByCode(ticketNumber: string): Promise<unknown> {
  const res = await http.post<ApiEnvelope<unknown>>('/v1/check-in/by-code', { ticket_number: ticketNumber });
  return res.data.data;
}

export async function boardPassenger(ticketUuid: string): Promise<unknown> {
  const res = await http.post<ApiEnvelope<unknown>>('/v1/check-in/board', { ticket_uuid: ticketUuid });
  return res.data.data;
}

export async function markNoShow(ticketUuid: string): Promise<unknown> {
  const res = await http.post<ApiEnvelope<unknown>>('/v1/check-in/no-show', { ticket_uuid: ticketUuid });
  return res.data.data;
}

export type TripPassenger = {
  id?: number;
  uuid?: string;
  ticket_number?: string;
  status?: string;
  passenger?: { name?: string } | null;
  booking?: { code?: string } | null;
  [key: string]: unknown;
};

export async function fetchTripPassengers(tripUuid: string): Promise<TripPassenger[]> {
  const res = await http.get<ApiEnvelope<TripPassenger[]>>(`/v1/trips/${tripUuid}/passengers`);
  const data = res.data.data;
  return Array.isArray(data) ? data : [];
}

// =====================================================================
// Admin: paginated lists + mutations
// =====================================================================

export type Paginated<T> = { data: T[]; current_page: number; last_page: number; total: number; per_page: number };

async function adminList<T>(path: string, params: Record<string, string | number | undefined>): Promise<Paginated<T>> {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'));
  const res = await http.get<{ data: Paginated<T> }>(path, { params: clean });
  return res.data.data;
}

export type AdminBooking = {
  id: number;
  uuid: string;
  code: string;
  status: string;
  amount: string | number;
  created_at: string;
  customer?: { user?: { name?: string; email?: string } };
  schedule?: { route?: { origin?: string; destination?: string } };
};

export const adminApi = {
  bookings: (params: { page?: number; search?: string; status?: string }) => adminList<AdminBooking>('/admin/bookings', params),
  bookingCancel: async (id: number) => (await http.post(`/admin/bookings/${id}/cancel`)).data,

  payments: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; uuid: string; reference: string; amount: string | number; status: string; method?: string; created_at: string; booking?: { code?: string; customer?: { user?: { name?: string } } } }>('/admin/payments', params),
  paymentMarkFailed: async (id: number) => (await http.post(`/admin/payments/${id}/mark-failed`)).data,

  customers: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; phone?: string; user?: { name?: string; email?: string; is_active?: boolean; created_at?: string }; membership?: { level?: string; points?: number } }>('/admin/customers', params),
  customerUpdate: async (id: number, payload: { is_active?: boolean; phone?: string }) => (await http.patch(`/admin/customers/${id}`, payload)).data,

  drivers: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; license_number?: string; status?: string; user?: { name?: string; email?: string; is_active?: boolean } }>('/admin/drivers', params),

  vehicles: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; code?: string; brand?: string; plate_number?: string; status?: string; layout?: { name?: string; capacity?: number } }>('/admin/vehicles', params),
  vehicleUpdate: async (id: number, payload: { status?: string; brand?: string }) => (await http.patch(`/admin/vehicles/${id}`, payload)).data,

  notifications: (params: { page?: number }) =>
    adminList<{ id: number; type: string; title: string; body?: string; created_at: string; user?: { name?: string; role?: string } }>('/admin/notifications', params),
  notificationBroadcast: async (payload: { title: string; body: string; role: string; type?: string }) => (await http.post('/admin/notifications/broadcast', payload)).data,

  settings: async () => (await http.get<{ data: Array<{ id: number; key: string; value: unknown; is_public?: boolean; updated_at?: string }> }>('/admin/settings')).data.data,
  settingsUpdate: async (payload: { key: string; value: unknown; is_public?: boolean }) => (await http.put('/admin/settings', payload)).data,

  // ----- Operational management -----
  formOptions: async () => (await http.get<{ data: { routes: Array<{ id: number; code: string; origin: string; destination: string }>; vehicles: Array<{ id: number; code: string; brand: string }>; drivers: Array<{ id: number; name: string }> } }>('/admin/manage/form-options')).data.data,

  routesList: (params: { page?: number; search?: string }) =>
    adminList<{ id: number; code: string; origin: string; destination: string; distance_km: number; duration_minutes: number; schedules_count?: number }>('/admin/manage/routes', params),
  routeCreate: async (payload: { code: string; origin: string; destination: string; distance_km: number; duration_minutes: number }) => (await http.post('/admin/manage/routes', payload)).data,
  routeUpdate: async (id: number, payload: Record<string, unknown>) => (await http.patch(`/admin/manage/routes/${id}`, payload)).data,

  schedulesList: (params: { page?: number; status?: string; route_id?: number }) =>
    adminList<{ id: number; uuid: string; departure_at: string; arrival_at: string; base_fare: string | number; status: string; bookings_count?: number; route?: { code?: string; origin?: string; destination?: string }; vehicle?: { code?: string; brand?: string }; driver?: { user?: { name?: string } } }>('/admin/manage/schedules', params),
  scheduleCreate: async (payload: { route_id: number; vehicle_id: number; driver_id: number; departure_at: string; arrival_at: string; base_fare: number }) => (await http.post('/admin/manage/schedules', payload)).data,
  scheduleUpdate: async (id: number, payload: Record<string, unknown>) => (await http.patch(`/admin/manage/schedules/${id}`, payload)).data,
  scheduleCancel: async (id: number) => (await http.post(`/admin/manage/schedules/${id}/cancel`)).data,

  pricingList: (params: { page?: number; route_id?: number }) =>
    adminList<{ id: number; name: string; amount: string | number; route?: { code?: string; origin?: string; destination?: string } }>('/admin/manage/pricing', params),
  pricingCreate: async (payload: { route_id: number; name: string; amount: number }) => (await http.post('/admin/manage/pricing', payload)).data,
  pricingUpdate: async (id: number, payload: { name?: string; amount?: number }) => (await http.patch(`/admin/manage/pricing/${id}`, payload)).data,
  pricingDelete: async (id: number) => (await http.delete(`/admin/manage/pricing/${id}`)).data,


  // Fleet + full-custom seat layout builder (#1)
  vehiclesList: (params: { page?: number; search?: string }) =>
    adminList<{ id: number; code: string; brand: string; plate_number: string; status: string; seats_count?: number; layout?: { name?: string } }>('/admin/manage/vehicles', params),
  vehicleCreate: async (payload: { code: string; plate_number: string; brand: string; status?: string }) => (await http.post('/admin/manage/vehicles', payload)).data,
  vehicleLayout: async (vehicleId: number) => (await http.get<{ data: SeatCell[] }>(`/admin/manage/vehicles/${vehicleId}/layout`)).data.data,
  vehicleLayoutSave: async (vehicleId: number, cells: SeatCell[]) => (await http.put(`/admin/manage/vehicles/${vehicleId}/layout`, { cells })).data,

  // Staff & driver management (#1)
  adminsList: (params: { page?: number }) => adminList<{ id: number; name: string; email: string; role: string; created_at: string }>('/admin/manage/admins', params),
  adminCreate: async (payload: { name: string; email: string; password: string; password_confirmation: string }) => (await http.post('/admin/manage/admins', payload)).data,
  adminDelete: async (id: number) => (await http.delete(`/admin/manage/admins/${id}`)).data,
  driversList: (params: { page?: number }) => adminList<{ id: number; license_number: string; status: string; user?: { name?: string; email?: string } }>('/admin/manage/drivers', params),
  driverCreate: async (payload: { name: string; email: string; password: string; password_confirmation: string; license_number: string }) => (await http.post('/admin/manage/drivers', payload)).data,
  driverUpdate: async (id: number, payload: { status?: string; license_number?: string; phone?: string; vehicle_name?: string; vehicle_plate?: string; name?: string }) => (await http.patch(`/admin/manage/drivers/${id}`, payload)).data,
  driverRatings: async (id: number) => (await http.get<{ data: { summary: { rating_avg: number; rating_count: number }; ratings: { data: Array<{ id: number; stars: number; comment?: string; customer?: { user?: { name?: string } } }> } } }>(`/admin/manage/drivers/${id}/ratings`)).data.data,

  // Jastip (package delivery) — admin/owner (#10)
  jastipList: (params: { page?: number; status?: string }) => adminList<{ id: number; code: string; item_name: string; status: string; fee: string | number; pickup_label?: string; drop_label?: string; driver?: { user?: { name?: string } } }>('/admin/manage/jastip', params),
  jastipCreate: async (payload: Record<string, unknown>) => (await http.post('/admin/manage/jastip', payload)).data,
  jastipUpdate: async (id: number, payload: Record<string, unknown>) => (await http.patch(`/admin/manage/jastip/${id}`, payload)).data,
  jastipDelete: async (id: number) => (await http.delete(`/admin/manage/jastip/${id}`)).data,
};

export type SeatCell = {
  id?: number;
  seat_number: string;
  row_index: number;
  column_index: number;
  cell_type: 'seat' | 'aisle' | 'driver' | 'door' | 'empty';
  label?: string | null;
  class?: string;
  is_active?: boolean;
};
