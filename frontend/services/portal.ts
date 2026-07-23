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
  customer?: { phone?: string; user?: { name?: string; email?: string } };
  schedule?: { departure_at?: string; route?: { origin?: string; destination?: string } };
  payment?: { id: number; status?: string; amount?: string | number; method?: string; paid_at?: string | null } | null;
  seat_reservations?: Array<{ id: number; vehicle_seat?: { seat_number?: string } | null }>;
  passengers?: Array<{ id: number; name: string; identity_number?: string }>;
  ticket?: { ticket_number?: string; status?: string } | null;
};

export type AdminPayment = {
  id: number;
  uuid: string;
  reference: string;
  amount: string | number;
  status: string;
  method?: string;
  provider?: string;
  paid_at?: string | null;
  created_at: string;
  booking?: { id?: number; code?: string; customer?: { phone?: string; user?: { name?: string } }; schedule?: { departure_at?: string; route?: { origin?: string; destination?: string } } };
};

/** One departure row on the schedule-first Booking/Payment overview. */
export type ScheduleOverview = {
  id: number;
  uuid: string;
  departure_at: string;
  arrival_at: string;
  status: string;
  trip_status?: string | null;
  capacity?: number;
  bookings_count?: number;
  // Booking view aggregates
  seats_taken?: number;
  // Payment view aggregates
  paid_count?: number;
  pending_count?: number;
  total_paid?: string | number;
  route?: { code?: string; origin?: string; destination?: string } | null;
  driver?: { user?: { name?: string } } | null;
  vehicle?: { code?: string; brand?: string; plate_number?: string } | null;
};

export const adminApi = {
  bookings: (params: { page?: number; search?: string; status?: string; schedule_id?: number; per_page?: number }) => adminList<AdminBooking>('/admin/bookings', params),
  bookingSchedules: (params: { page?: number; search?: string; status?: string; date?: string; from?: string; to?: string }) =>
    adminList<ScheduleOverview>('/admin/bookings/schedules', params),
  bookingShow: async (id: number) => (await http.get<{ data: AdminBooking }>(`/admin/bookings/${id}`)).data.data,
  bookingUpdate: async (id: number, payload: { passengers: Array<{ id: number; name: string }> }) => (await http.patch(`/admin/bookings/${id}`, payload)).data,
  bookingCancel: async (id: number) => (await http.post(`/admin/bookings/${id}/cancel`)).data,

  payments: (params: { page?: number; search?: string; status?: string; schedule_id?: number; per_page?: number }) =>
    adminList<AdminPayment>('/admin/payments', params),
  paymentSchedules: (params: { page?: number; search?: string; status?: string; date?: string; from?: string; to?: string }) =>
    adminList<ScheduleOverview>('/admin/payments/schedules', params),
  paymentShow: async (id: number) => (await http.get<{ data: AdminPayment }>(`/admin/payments/${id}`)).data.data,
  paymentMarkFailed: async (id: number) => (await http.post(`/admin/payments/${id}/mark-failed`)).data,
  paymentVerify: async (id: number) => (await http.post(`/admin/payments/${id}/verify`)).data,
  paymentRefund: async (id: number) => (await http.post(`/admin/payments/${id}/refund`)).data,

  customers: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; phone?: string; user?: { name?: string; email?: string; is_active?: boolean; created_at?: string }; membership?: { level?: string; points?: number } }>('/admin/customers', params),
  customerUpdate: async (id: number, payload: { is_active?: boolean; phone?: string }) => (await http.patch(`/admin/customers/${id}`, payload)).data,

  drivers: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; license_number?: string; status?: string; user?: { name?: string; email?: string; is_active?: boolean } }>('/admin/drivers', params),

  vehicles: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; code?: string; brand?: string; plate_number?: string; status?: string; on_trip?: boolean; layout?: { name?: string; capacity?: number } }>('/admin/vehicles', params),
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
  routeDelete: async (id: number) => (await http.delete(`/admin/manage/routes/${id}`)).data,

  schedulesList: (params: { page?: number; status?: string; route_id?: number }) =>
    adminList<{ id: number; uuid: string; departure_at: string; arrival_at: string; base_fare: string | number; status: string; bookings_count?: number; route?: { code?: string; origin?: string; destination?: string }; vehicle?: { code?: string; brand?: string }; driver?: { user?: { name?: string } }; latest_trip?: { id: number; status: string } | null }>('/admin/manage/schedules', params),
  scheduleCreate: async (payload: { route_id: number; vehicle_id: number; driver_id: number; departure_at: string; arrival_at: string; base_fare: number }) => (await http.post('/admin/manage/schedules', payload)).data,
  scheduleUpdate: async (id: number, payload: Record<string, unknown>) => (await http.patch(`/admin/manage/schedules/${id}`, payload)).data,
  scheduleCancel: async (id: number) => (await http.post(`/admin/manage/schedules/${id}/cancel`)).data,

  pricingList: (params: { page?: number; route_id?: number }) =>
    adminList<{ id: number; name: string; amount: string | number; route?: { code?: string; origin?: string; destination?: string } }>('/admin/manage/pricing', params),
  pricingCreate: async (payload: { route_id: number; name: string; amount: number }) => (await http.post('/admin/manage/pricing', payload)).data,
  pricingUpdate: async (id: number, payload: { name?: string; amount?: number }) => (await http.patch(`/admin/manage/pricing/${id}`, payload)).data,
  pricingDelete: async (id: number) => (await http.delete(`/admin/manage/pricing/${id}`)).data,


  // Fleet + full-custom seat layout builder (#1)
  vehiclesList: (params: { page?: number; search?: string; status?: string }) =>
    adminList<{ id: number; code: string; brand: string; plate_number: string; status: string; on_trip?: boolean; seats_count?: number; layout?: { name?: string } }>('/admin/manage/vehicles', params),
  vehicleCreate: async (payload: { code: string; plate_number: string; brand: string; status?: string }) => (await http.post('/admin/manage/vehicles', payload)).data,
  vehicleLayout: async (vehicleId: number) => (await http.get<{ data: SeatCell[] }>(`/admin/manage/vehicles/${vehicleId}/layout`)).data.data,
  vehicleLayoutSave: async (vehicleId: number, cells: SeatCell[]) => (await http.put(`/admin/manage/vehicles/${vehicleId}/layout`, { cells })).data,

  // Staff & driver management (#1)
  adminsList: (params: { page?: number }) => adminList<{ id: number; name: string; email: string; role: string; created_at: string }>('/admin/manage/admins', params),
  adminCreate: async (payload: { name: string; email: string; password: string; password_confirmation: string }) => (await http.post('/admin/manage/admins', payload)).data,
  adminDelete: async (id: number) => (await http.delete(`/admin/manage/admins/${id}`)).data,
  adminResetPassword: async (id: number, payload: { password: string; password_confirmation: string }) => (await http.post(`/admin/manage/admins/${id}/reset-password`, payload)).data,
  driversList: (params: { page?: number }) => adminList<{ id: number; license_number: string; status: string; user?: { name?: string; email?: string } }>('/admin/manage/drivers', params),
  driverCreate: async (payload: { name: string; email: string; password: string; password_confirmation: string; license_number: string }) => (await http.post('/admin/manage/drivers', payload)).data,
  driverUpdate: async (id: number, payload: { status?: string; license_number?: string; phone?: string; vehicle_name?: string; vehicle_plate?: string; name?: string }) => (await http.patch(`/admin/manage/drivers/${id}`, payload)).data,
  driverRatings: async (id: number) => (await http.get<{ data: { summary: { rating_avg: number; rating_count: number }; ratings: { data: Array<{ id: number; stars: number; comment?: string; customer?: { user?: { name?: string } } }> } } }>(`/admin/manage/drivers/${id}/ratings`)).data.data,

  // Jastip (package delivery) — admin/owner (#10)
  jastipList: (params: { page?: number; status?: string }) => adminList<{ id: number; code: string; item_name: string; status: string; fee: string | number; pickup_label?: string; drop_label?: string; driver?: { user?: { name?: string } } }>('/admin/manage/jastip', params),
  jastipCreate: async (payload: Record<string, unknown>) => (await http.post('/admin/manage/jastip', payload)).data,
  jastipUpdate: async (id: number, payload: Record<string, unknown>) => (await http.patch(`/admin/manage/jastip/${id}`, payload)).data,
  jastipDelete: async (id: number) => (await http.delete(`/admin/manage/jastip/${id}`)).data,

  // ----- Notification broadcast history (delivery status + time) -----
  broadcastHistory: (params: { page?: number }) =>
    adminList<BroadcastHistoryItem>('/admin/notifications/broadcasts', params),

  // ----- Notification Center: activity-grouped view -----
  notificationActivities: (params: { page?: number; search?: string; filter?: string; date?: string; from?: string; to?: string }) =>
    adminList<NotificationActivityItem>('/admin/notifications/activities', params),
  notificationActivityShow: async (id: number) =>
    (await http.get<{ data: NotificationActivityDetail }>(`/admin/notifications/activities/${id}`)).data.data,
  notificationActivityRecipients: (id: number, params: { page?: number; role?: string; per_page?: number }) =>
    adminList<NotificationRecipientItem>(`/admin/notifications/activities/${id}/recipients`, params),
  notificationActivityCreate: async (payload: NotificationActivityPayload & { send: boolean }) =>
    (await http.post<{ data: NotificationActivityItem }>('/admin/notifications/activities', payload)).data.data,
  notificationActivityUpdate: async (id: number, payload: NotificationActivityPayload & { send?: boolean }) =>
    (await http.patch<{ data: NotificationActivityItem }>(`/admin/notifications/activities/${id}`, payload)).data.data,
  notificationActivityDelete: async (id: number) => (await http.delete(`/admin/notifications/activities/${id}`)).data,
  notificationActivitySend: async (id: number) => (await http.post(`/admin/notifications/activities/${id}/send`)).data,

  // ----- Audit logs (search/filter/sort) -----
  activityLogs: (params: { page?: number; search?: string; action?: string; from?: string; to?: string; sort?: string; dir?: string; per_page?: number }) =>
    adminList<ActivityLogItem>('/admin/reports/activity-logs', params),

  // ----- File downloads (report export, audit export) -----
  downloadFile: async (path: string, filename: string, params?: Record<string, string>) => {
    const res = await http.get(path, { params, responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  // ----- Settings image upload (welcome notification banner, etc.) -----
  settingsUpload: async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return (await http.post<{ data: { path: string; url: string } }>('/admin/settings/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  },

  // ----- Live Trip Tracking -----
  liveSummary: async () => (await http.get<{ data: LiveSummary }>('/admin/live/summary')).data.data,
  scheduleLive: async (scheduleId: number) => (await http.get<{ data: LiveManifest }>(`/admin/live/schedules/${scheduleId}`)).data.data,

  // ----- Map Provider (super admin) -----
  mapSettings: async () => (await http.get<{ data: MapSettingsData }>('/owner/production-readiness/map-settings')).data.data,
  mapSettingsUpdate: async (payload: { provider?: 'google' | 'osm' | 'beta'; beta_enabled?: boolean }) =>
    (await http.put<{ data: MapSettingsData['resolution'] }>('/owner/production-readiness/map-settings', payload)).data.data,
  customerDelete: async (id: number) => (await http.delete<{ data: { deleted: boolean } }>(`/admin/customers/${id}`)).data.data,
  promos: async (params?: Record<string, string>) => (await http.get<{ data: Paginated<PromoRow> }>('/admin/promos', { params })).data.data,
  promoCreate: async (payload: Partial<PromoRow>) => (await http.post<{ data: PromoRow }>('/admin/promos', payload)).data.data,
  promoUpdate: async (id: number, payload: Partial<PromoRow>) => (await http.patch<{ data: PromoRow }>(`/admin/promos/${id}`, payload)).data.data,
  promoDelete: async (id: number) => (await http.delete<{ data: { deleted: boolean } }>(`/admin/promos/${id}`)).data.data,
  tourPackages: async (params?: Record<string, string>) => (await http.get<{ data: Paginated<TourPackageRow> }>('/admin/tour-packages', { params })).data.data,
  tourPackageCreate: async (payload: Partial<TourPackageRow>) => (await http.post<{ data: TourPackageRow }>('/admin/tour-packages', payload)).data.data,
  tourPackageUpdate: async (id: number, payload: Partial<TourPackageRow>) => (await http.patch<{ data: TourPackageRow }>(`/admin/tour-packages/${id}`, payload)).data.data,
  tourPackageDelete: async (id: number) => (await http.delete<{ data: { deleted: boolean } }>(`/admin/tour-packages/${id}`)).data.data,
  cmsSections: async (params?: Record<string, string>) => (await http.get<{ data: Paginated<CmsSectionRow> }>('/admin/cms-sections', { params })).data.data,
  cmsSectionCreate: async (payload: Partial<CmsSectionRow>) => (await http.post<{ data: CmsSectionRow }>('/admin/cms-sections', payload)).data.data,
  cmsSectionUpdate: async (id: number, payload: Partial<CmsSectionRow>) => (await http.patch<{ data: CmsSectionRow }>(`/admin/cms-sections/${id}`, payload)).data.data,
  cmsSectionDelete: async (id: number) => (await http.delete<{ data: { deleted: boolean } }>(`/admin/cms-sections/${id}`)).data.data,
  // Tour package booking (admin & owner)
  packageBookings: async (params?: Record<string, string>) => (await http.get<{ data: Paginated<PackageBookingRow> }>('/admin/package-bookings', { params })).data.data,
  packageBookingVerify: async (id: number) => (await http.post<{ data: PackageBookingRow }>(`/admin/package-bookings/${id}/verify`)).data.data,
  packageBookingVerifySettlement: async (id: number) => (await http.post<{ data: PackageBookingRow }>(`/admin/package-bookings/${id}/verify-settlement`)).data.data,
  packageBookingReject: async (id: number, admin_note: string) => (await http.post<{ data: PackageBookingRow }>(`/admin/package-bookings/${id}/reject`, { admin_note })).data.data,
  packageBookingTransition: async (id: number, action: 'complete' | 'cancel') => (await http.post<{ data: PackageBookingRow }>(`/admin/package-bookings/${id}/${action}`)).data.data,
  // Email template editor (admin & owner)
  emailTemplates: async () => (await http.get<{ data: EmailTemplateRow[] }>('/admin/email-templates')).data.data,
  emailTemplateUpdate: async (payload: { type: string; subject?: string; heading?: string; intro?: string }) => (await http.put<{ data: { saved: boolean } }>('/admin/email-templates', payload)).data.data,
  emailTemplatePreview: async (payload: { type: string; subject?: string; heading?: string; intro?: string }) => (await http.post<{ data: { subject: string; heading: string; intro: string } }>('/admin/email-templates/preview', payload)).data.data,
  // Centralized CMS
  cmsBranding: async () => (await http.get<{ data: CmsBranding }>('/admin/cms/branding')).data.data,
  cmsBrandingUpdate: async (payload: Partial<CmsBranding>) => (await http.put<{ data: CmsBranding }>('/admin/cms/branding', payload)).data.data,
  cmsVersions: async () => (await http.get<{ data: Paginated<CmsVersionRow> }>('/admin/cms/versions')).data.data,
  cmsSaveVersion: async (payload: { label?: string; status: 'draft' | 'published' }) => (await http.post<{ data: CmsVersionRow }>('/admin/cms/versions', payload)).data.data,
  cmsRestoreVersion: async (id: number) => (await http.post<{ data: { restored: boolean; sections: number } }>(`/admin/cms/versions/${id}/restore`)).data.data,
  // Company profile / structured site content
  siteContent: async (slug: string) => (await http.get<{ data: SiteContentRow }>(`/admin/site-content/${slug}`)).data.data,
  siteContentUpdate: async (slug: string, payload: Record<string, unknown>) =>
    (await http.put<{ data: SiteContentRow }>(`/admin/site-content/${slug}`, { payload })).data.data,
  // Legal pages CMS (privacy, terms, refund, contact, copyright)
  legalDocuments: async () => (await http.get<{ data: LegalDocumentRow[] }>('/admin/legal')).data.data,
  legalDocumentUpdate: async (slug: string, payload: Partial<Pick<LegalDocumentRow, 'title' | 'meta_description' | 'body' | 'is_published'>>) =>
    (await http.put<{ data: LegalDocumentRow }>(`/admin/legal/${slug}`, payload)).data.data,
  cmsUpload: async (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return (await http.post<{ data: { path: string; url: string } }>('/admin/cms/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data;
  },
  mapSimulator: async (action: 'start' | 'stop') =>
    (await http.post<{ data: { running: boolean } }>(`/owner/production-readiness/map-settings/simulator/${action}`)).data.data,
};

export type MapSettingsData = {
  resolution: { requested: string; provider: string; beta_enabled: boolean; beta_blocked: boolean; message: string | null };
  statuses: {
    active_provider: string;
    feature_map_beta: boolean;
    google_api: string;
    osm_tiles: string;
    osrm: string;
    websocket: string;
    simulator_running: boolean;
  };
};

export const liveTripApi = {
  driverManifest: async (tripId: number) => (await http.get<{ data: LiveManifest }>(`/driver/trips/${tripId}/manifest`)).data.data,
  driverPickup: async (tripId: number, bookingId: number) => (await http.post(`/driver/trips/${tripId}/bookings/${bookingId}/pickup`)).data,
  driverDropoff: async (tripId: number, bookingId: number) => (await http.post(`/driver/trips/${tripId}/bookings/${bookingId}/dropoff`)).data,
  driverSendLocation: async (payload: { trip_id: number; latitude: number; longitude: number; speed?: number; heading?: number; accuracy?: number }) =>
    (await http.post('/driver/location', payload)).data,
  driverJastipStatus: async (id: number, status: 'picked_up' | 'delivered') => (await http.post(`/driver/jastip/${id}/status`, { status })).data,
  customerTrack: async (bookingUuid: string) => (await http.get<{ data: CustomerTrackData }>(`/customer/bookings/${bookingUuid}/track-live`)).data.data,
};

export type LiveSummary = { active_trips: number; active_drivers: number; customers_in_transit: number; packages_in_transit: number };

export type LivePoint = { label?: string | null; lat: number | null; lng: number | null };

export type LiveBookingManifest = {
  id: number;
  code: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  seats: string[];
  pickup: LivePoint;
  drop: LivePoint;
  note?: string | null;
  picked_up_at?: string | null;
  dropped_off_at?: string | null;
  payment_status?: string | null;
  booking_status: string;
};

export type LiveJastipManifest = {
  id: number;
  code: string;
  item_name: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  pickup: LivePoint;
  drop: LivePoint;
  status: string;
  picked_up_at?: string | null;
  delivered_at?: string | null;
};

export type LiveManifest = {
  trip?: { id: number; uuid: string; status: string; active: boolean } | null;
  schedule?: { id: number; uuid: string; departure_at: string; status: string; route?: { code?: string; origin?: string; destination?: string } | null };
  route?: { code?: string; origin?: string; destination?: string } | null;
  driver?: { name?: string | null; phone?: string | null } | null;
  vehicle?: { code?: string; brand?: string; plate_number?: string } | null;
  bookings: LiveBookingManifest[];
  jastip: LiveJastipManifest[];
  location?: { lat: number; lng: number; recorded_at: string; speed?: number | null; heading?: number | null } | null;
  path: Array<{ lat: number; lng: number }>;
};

export type CustomerTrackData = {
  active: boolean;
  completed?: boolean;
  trip_status?: string | null;
  trip?: { id: number; uuid: string; status: string };
  driver?: { name?: string | null; photo?: string | null };
  vehicle?: { brand?: string | null; plate_number?: string | null; code?: string | null };
  route?: { origin?: string; destination?: string } | null;
  booking?: { code: string; picked_up_at?: string | null; dropped_off_at?: string | null; pickup: LivePoint; drop: LivePoint };
  location?: { lat: number; lng: number; recorded_at: string } | null;
  path?: Array<{ lat: number; lng: number }>;
  eta_minutes?: number | null;
};

export type BroadcastHistoryItem = {
  id: number;
  broadcast_id: string | null;
  title: string;
  body: string;
  role: string;
  sent_by?: string | null;
  delivered: number;
  read: number;
  status: string;
  sent_at: string | null;
};

export type NotificationActivityPayload = {
  kind: 'broadcast' | 'personal';
  role?: string;
  email?: string;
  title: string;
  body: string;
};

export type NotificationActivityItem = {
  id: number;
  uuid: string;
  kind: 'broadcast' | 'personal';
  target_role?: string | null;
  type: string;
  title: string;
  body: string;
  status: 'draft' | 'sent' | 'failed';
  sent_count: number;
  failed_count: number;
  sent_at?: string | null;
  created_at: string;
  sender?: { id: number; name: string; role: string } | null;
  target_user?: { id: number; name: string; role: string } | null;
  recipients_count?: number;
  read_count?: number;
  unread_count?: number;
};

export type NotificationActivityDetail = {
  activity: NotificationActivityItem;
  stats: { total: number; delivered: number; failed: number; read: number; unread: number };
  by_role: Array<{ role: string; total: number; read_count: number }>;
};

export type NotificationRecipientItem = {
  id: number;
  user?: { id: number; name: string; email: string; role: string } | null;
  delivered: boolean;
  read: boolean;
  read_at?: string | null;
};

export type ActivityLogItem = {
  id: number;
  action: string;
  subject_type: string;
  subject_id?: number | null;
  created_at: string;
  metadata?: {
    actor?: { id: number; name: string; role: string } | null;
    ip?: string | null;
    device?: string | null;
    browser?: string | null;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    [key: string]: unknown;
  } | null;
};

export type SeatCell = {
  id?: number;
  seat_number: string;
  row_index: number;
  column_index: number;
  cell_type: 'seat' | 'aisle' | 'driver' | 'door' | 'empty' | 'luggage' | 'toilet' | 'stairs';
  label?: string | null;
  class?: string;
  is_active?: boolean;
};

export type PromoRow = { id: number; code: string; name: string; amount: number; starts_at: string; ends_at: string };
export type TourPackageRow = {
  id: number; uuid: string; name: string; slug: string; description?: string | null; destination?: string | null;
  duration_days: number; facilities?: string[] | null; itinerary?: Array<{ day: number; title: string; detail?: string }> | null;
  price: number; capacity: number; cover_path?: string | null; gallery?: string[] | null; status: 'active' | 'inactive';
  badge?: string | null; is_featured: boolean; is_recommended: boolean; is_best_seller: boolean; is_promo: boolean; sort_order: number;
};
export type CmsSectionRow = {
  id: number; uuid: string; section_type: string; title?: string | null; body?: string | null; image_path?: string | null;
  link?: string | null; sort_order: number; is_active: boolean; publish_start?: string | null; publish_end?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type PackageBookingRow = {
  id: number; uuid: string; code: string; travel_date: string; pax: number; amount: number;
  status: 'waiting_payment' | 'waiting_verification' | 'paid' | 'completed' | 'cancelled';
  contact_phone?: string | null; notes?: string | null; admin_note?: string | null; paid_at?: string | null;
  // DP fields (tour packages only); all computed server-side.
  payment_type?: 'full' | 'dp'; dp_percent?: number | null; dp_amount?: number | null;
  paid_amount?: number; outstanding_amount?: number; is_settled?: boolean; is_dp?: boolean;
  settlement_claimed_at?: string | null; settled_at?: string | null;
  tour_package?: { id: number; name: string; destination?: string | null } | null;
  customer?: { id: number; user?: { id: number; name: string; email: string } | null } | null;
};
export type EmailTemplateRow = {
  type: string; label: string; placeholders: string[];
  default: { subject: string; heading: string; intro: string };
  override: { subject: string; heading: string; intro: string };
};

export type SiteContentRow = {
  id: number;
  slug: string;
  payload: Record<string, unknown>;
  updated_at: string;
  updated_by?: { id: number; name: string } | null;
};

export type LegalDocumentRow = {
  id: number;
  slug: string;
  title: string;
  meta_description: string | null;
  body: string;
  is_published: boolean;
  updated_at: string;
  updated_by?: { id: number; name: string } | null;
};

export type CmsBranding = {
  logo_path?: string | null; primary_color?: string | null; font_family?: string | null;
  company_name?: string | null; company_tagline?: string | null;
  social?: Record<string, string> | null; seo?: Record<string, string> | null;
};
export type CmsVersionRow = {
  id: number; uuid: string; label: string | null; status: 'draft' | 'published';
  published_at: string | null; created_at: string; created_by?: { id: number; name: string } | null;
};
