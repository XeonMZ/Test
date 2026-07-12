import { adminMenu } from './menu.admin';
import { customerMenu } from './menu.customer';
import { driverMenu } from './menu.driver';
import { guestMenu } from './menu.guest';
import { ownerMenu } from './menu.owner';
import type { AppRole, MenuItem } from './types';

export const roleMenus: Record<AppRole, MenuItem[]> = { guest: guestMenu, customer: customerMenu, driver: driverMenu, admin: adminMenu, owner: ownerMenu };

export function getRoleFromPath(pathname: string): AppRole {
  if (pathname.startsWith('/owner')) return 'owner';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/driver')) return 'driver';
  if (pathname.startsWith('/customer') || pathname.startsWith('/booking') || pathname.startsWith('/ticket') || pathname.startsWith('/payment')) return 'customer';
  return 'guest';
}

export function getMenuForRole(role: AppRole): MenuItem[] { return roleMenus[role]; }
