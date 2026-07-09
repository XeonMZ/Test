import { BarChart3, Bell, Bus, Flag, LayoutDashboard, ListChecks, Megaphone, Receipt, Settings, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import type { MenuItem } from './types';

export const ownerMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/owner', icon: LayoutDashboard },
  { label: 'Revenue', href: '/owner/reports', icon: Receipt },
  { label: 'Reports', href: '/owner/reports', icon: BarChart3 },
  { label: 'Driver Performance', href: '/owner/drivers', icon: Users },
  { label: 'Vehicle Performance', href: '/owner/fleet', icon: Bus },
  { label: 'Customer Analytics', href: '/owner/reports', icon: TrendingUp },
  { label: 'Membership', href: '/owner/reports', icon: ShieldCheck },
  { label: 'Promo Performance', href: '/owner/reports', icon: Megaphone },
  { label: 'Notification Center', href: '/owner/notifications', icon: Bell },
  { label: 'Settings', href: '/owner/settings', icon: Settings },
  { label: 'Audit Logs', href: '/owner/logs', icon: ListChecks },
  { label: 'Feature Flags', href: '/owner/feature-flags', icon: Flag },
];
