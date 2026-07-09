export type NotificationRole = 'customer' | 'driver' | 'admin' | 'owner';
export type NotificationStatus = 'read' | 'unread';
export type NotificationCategory = 'booking' | 'payment' | 'ticket' | 'driver' | 'trip' | 'promo' | 'membership' | 'system';

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  status: NotificationStatus;
  category: NotificationCategory;
  relatedEntity?: { label: string; href?: string };
  action?: { label: string; href?: string };
};

export type NotificationPreferenceKey = NotificationCategory | 'realtime' | 'email' | 'push' | 'sound';
export type NotificationPreference = { key: NotificationPreferenceKey; label: string; enabled: boolean; placeholder?: boolean };
export type NotificationFilterValue = NotificationCategory | 'all' | NotificationStatus;
