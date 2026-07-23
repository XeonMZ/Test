import type { ReactNode } from 'react';
import type { AppRole } from '../navigation/types';

export function RoleGuard({ role, allowed, children }: { role: AppRole; allowed: AppRole[]; children: ReactNode }) { return allowed.includes(role) ? children : null; }
export function PermissionGuard({ hasPermission = true, children }: { hasPermission?: boolean; children: ReactNode }) { return hasPermission ? children : null; }
export function RouteGuard({ allowed = true, children }: { allowed?: boolean; children: ReactNode }) { return allowed ? children : null; }
