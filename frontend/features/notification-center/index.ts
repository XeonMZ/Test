export {
  categoryOfType,
  defaultNotificationPreferences,
  loadNotificationPreferences,
  saveNotificationPreferences,
} from './api';
export { NotificationBadge, NotificationPreference } from './components';
export { useNotificationPreferences } from './hooks';
export type {
  NotificationCategory,
  NotificationPreference as NotificationPreferenceType,
  NotificationRole,
} from './types';
