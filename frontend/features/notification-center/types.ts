export type NotificationRole = 'customer' | 'driver' | 'admin' | 'owner';

/**
 * Notification categories mirror the backend `notifications.type` values
 * (booking_*, payment_*, ticket_*, …). Preferences let a user mute categories
 * locally; the authoritative data always comes from GET /notifications.
 */
export type NotificationCategory =
  | 'booking'
  | 'payment'
  | 'ticket'
  | 'driver'
  | 'trip'
  | 'promo'
  | 'membership'
  | 'system';

export type NotificationPreference = {
  key: NotificationCategory;
  label: string;
  enabled: boolean;
};
