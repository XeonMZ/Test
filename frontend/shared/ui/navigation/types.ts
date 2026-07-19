import type { LucideIcon } from 'lucide-react';

export type AppRole = 'guest' | 'customer' | 'driver' | 'admin' | 'owner';

export type MenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
};
