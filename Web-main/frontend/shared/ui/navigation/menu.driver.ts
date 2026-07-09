import { Banknote, Bell, CheckCircle2, Clock3, Gauge, History, LayoutDashboard, Route, UserCheck } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used on-shift driver actions there.
export const driverMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/driver', icon: LayoutDashboard },
  { label: 'Shift', href: '/driver/dashboard', icon: Clock3 },
  { label: 'Trips', href: '/driver/trips', icon: Route },
  { label: 'Check-in', href: '/driver/check-in', icon: CheckCircle2 },
  { label: 'Passengers', href: '/driver/passengers', icon: UserCheck },
  { label: 'Timeline & Live Tracking', href: '/driver/timeline', icon: Gauge },
  { label: 'History', href: '/driver/history', icon: History },
  { label: 'Earnings', href: '/driver/earnings', icon: Banknote },
  { label: 'Notifications', href: '/driver/notifications', icon: Bell },
];
