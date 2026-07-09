import { Archive, BarChart3, Bell, Bus, Flag, HeartPulse, LayoutDashboard, ListChecks, Receipt, ShieldCheck, Settings, TrendingUp, Users } from 'lucide-react';
import type { MenuItem } from './types';

// Bottom mobile nav uses the first 4 items — keep the most-used owner actions there.
export const ownerMenu: MenuItem[] = [
  { label: 'Dashboard', href: '/owner', icon: LayoutDashboard },
  { label: 'Revenue', href: '/owner/revenue', icon: Receipt },
  { label: 'Reports', href: '/owner/reports', icon: BarChart3 },
  { label: 'Settings', href: '/owner/settings', icon: Settings },
  { label: 'Analytics', href: '/owner/analytics', icon: TrendingUp },
  { label: 'Fleet Performance', href: '/owner/fleet', icon: Bus },
  { label: 'Driver Performance', href: '/owner/drivers', icon: Users },
  { label: 'Notification Center', href: '/owner/notifications', icon: Bell },
  { label: 'Feature Flags', href: '/owner/feature-flags', icon: Flag },
  { label: 'System Health', href: '/owner/health', icon: HeartPulse },
  { label: 'Backup & Restore', href: '/owner/backup', icon: Archive },
  { label: 'Production Readiness', href: '/owner/production-readiness', icon: ShieldCheck },
  { label: 'Audit Logs', href: '/owner/logs', icon: ListChecks },
];
