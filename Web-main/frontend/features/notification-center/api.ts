import type {
  NotificationPreference,
  NotificationRecord,
  NotificationRole,
} from './types';

export const existingNotificationEndpointsUsed = [
  'Private Reverb channel user.{userId} event notification.created',
  'Private Reverb channel notification.{userId} event notification.created',
  'Private Reverb channel admin event notification.created',
  'Private Reverb channel owner event notification.created',
  'Private Reverb channel system event notification.created',
] as const;

export type ReadonlyNotificationApiTodo = Readonly<{
  listNotifications: `TODO GET /${NotificationRole}/notifications scoped to authenticated user`;
  detail: 'TODO GET existing notification detail endpoint scoped by authenticated user';
  markRead: 'TODO PATCH existing notification read endpoint scoped by authenticated user';
  markUnread: 'TODO PATCH existing notification unread endpoint scoped by authenticated user';
  markAllRead: 'TODO PATCH existing notification mark-all-read endpoint scoped by authenticated user';
  deleteNotification: 'TODO DELETE existing notification endpoint scoped by authenticated user';
  bulkDelete: 'TODO DELETE existing notification bulk endpoint scoped by authenticated user';
  preferences: 'TODO GET/PUT existing notification preferences endpoint scoped by authenticated user';
}>;

export const notificationApiTodo: ReadonlyNotificationApiTodo = {
  listNotifications:
    'TODO GET /customer/notifications scoped to authenticated user',
  detail:
    'TODO GET existing notification detail endpoint scoped by authenticated user',
  markRead:
    'TODO PATCH existing notification read endpoint scoped by authenticated user',
  markUnread:
    'TODO PATCH existing notification unread endpoint scoped by authenticated user',
  markAllRead:
    'TODO PATCH existing notification mark-all-read endpoint scoped by authenticated user',
  deleteNotification:
    'TODO DELETE existing notification endpoint scoped by authenticated user',
  bulkDelete:
    'TODO DELETE existing notification bulk endpoint scoped by authenticated user',
  preferences:
    'TODO GET/PUT existing notification preferences endpoint scoped by authenticated user',
};

export function resolveAuthenticatedNotificationUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const explicit =
    window.localStorage.getItem('stms:user_id') ??
    window.sessionStorage.getItem('stms:user_id');
  if (explicit) return explicit;

  const rawUser =
    window.localStorage.getItem('stms:user') ??
    window.sessionStorage.getItem('stms:user');
  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as { id?: string | number };
    return user.id === undefined ? null : String(user.id);
  } catch {
    return null;
  }
}

export const notificationSeeds: Record<NotificationRole, NotificationRecord[]> =
  {
    customer: [
      {
        id: 'customer-payment',
        title: 'Payment reminder',
        message: 'Complete payment for booking BK-2407-002.',
        timestamp: '2026-07-07T08:30:00.000Z',
        status: 'unread',
        category: 'payment',
        relatedEntity: { label: 'BK-2407-002', href: '/customer/payment' },
        action: { label: 'Open payment', href: '/customer/payment' },
      },
      {
        id: 'customer-ticket',
        title: 'Ticket QR is ready',
        message: 'Your ticket QR is available for boarding.',
        timestamp: '2026-07-07T07:45:00.000Z',
        status: 'read',
        category: 'ticket',
        relatedEntity: { label: 'Ticket QR', href: '/customer/tickets' },
        action: { label: 'View ticket', href: '/customer/tickets' },
      },
    ],
    driver: [
      {
        id: 'driver-trip',
        title: 'Upcoming trip assignment',
        message: 'You have a scheduled trip ready for review.',
        timestamp: '2026-07-07T08:10:00.000Z',
        status: 'unread',
        category: 'trip',
        relatedEntity: { label: 'Trip board', href: '/driver/trips' },
        action: { label: 'View trip', href: '/driver/trips' },
      },
    ],
    admin: [
      {
        id: 'admin-system',
        title: 'Operations notification',
        message: 'Realtime operations notifications will appear here.',
        timestamp: '2026-07-07T07:30:00.000Z',
        status: 'unread',
        category: 'system',
        relatedEntity: { label: 'Operations', href: '/admin/operations' },
        action: { label: 'Open operations', href: '/admin/operations' },
      },
    ],
    owner: [
      {
        id: 'owner-membership',
        title: 'Membership activity',
        message: 'A membership notification was received.',
        timestamp: '2026-07-07T07:15:00.000Z',
        status: 'read',
        category: 'membership',
        relatedEntity: { label: 'Reports', href: '/owner/reports' },
        action: { label: 'View reports', href: '/owner/reports' },
      },
    ],
  };

export const defaultNotificationPreferences: NotificationPreference[] = [
  { key: 'booking', label: 'Booking', enabled: true },
  { key: 'payment', label: 'Payment', enabled: true },
  { key: 'ticket', label: 'Ticket', enabled: true },
  { key: 'driver', label: 'Driver', enabled: true },
  { key: 'promo', label: 'Promo', enabled: true },
  { key: 'membership', label: 'Membership', enabled: true },
  { key: 'system', label: 'System', enabled: true },
  { key: 'realtime', label: 'Realtime', enabled: true },
  { key: 'email', label: 'Email', enabled: false, placeholder: true },
  {
    key: 'push',
    label: 'Push Notification',
    enabled: false,
    placeholder: true,
  },
  { key: 'sound', label: 'Sound', enabled: false, placeholder: true },
];
