import { Banknote, Bell, Clock3, Gauge, History, LayoutDashboard, MapPinned, Route, UserCheck } from 'lucide-react';
import type { MenuItem } from './types';

export const driverMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/driver', icon: LayoutDashboard },
  { label: 'Shift', href: '/driver/dashboard', icon: Clock3 },
  { label: 'Trips', href: '/driver/trips', icon: Route },
  { label: 'Passengers', href: '/driver/passengers', icon: UserCheck },
  { label: 'Timeline', href: '/driver/timeline', icon: Gauge },
  { label: 'GPS', href: '/customer/tracking', icon: MapPinned },
  { label: 'History', href: '/driver/history', icon: History },
  { label: 'Earnings', href: '/driver/earnings', icon: Banknote },
  { label: 'Notifications', href: '/driver/notifications', icon: Bell },
];
