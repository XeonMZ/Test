'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, Menu, Moon, Radio, UserCircle } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { useConnection } from '@/shared/hooks/use-connection';
import { NotificationBadge } from '@/features/notification-center';
import { getMenuForRole, getRoleFromPath } from '../navigation';
import type { AppRole } from '../navigation/types';
import { AppCard, FloatingButton, ReconnectState, SearchBar } from '../components';
import { useTheme } from '../theme/theme-provider';

export function GuestLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="guest">{children}</AppShell>; }
export function CustomerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="customer">{children}</AppShell>; }
export function DriverLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="driver">{children}</AppShell>; }
export function AdminLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="admin">{children}</AppShell>; }
export function OwnerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="owner">{children}</AppShell>; }

export function AppShell({ children, forcedRole }: { children: ReactNode; forcedRole?: AppRole }) {
  const pathname = usePathname();
  const role = forcedRole ?? getRoleFromPath(pathname);
  const menu = getMenuForRole(role);
  const { online, realtimeConnected, realtimeEnabled } = useConnection();
  const { theme, setTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const crumbs = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const isGuestHome = role === 'guest' && pathname === '/';

  return (
    <div className="min-h-screen bg-secondary text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      {!online ? <div className="fixed inset-x-0 top-0 z-[60] bg-danger px-4 py-2 text-center text-sm font-bold text-white">Offline mode active. Changes may be delayed.</div> : null}
      {realtimeEnabled && !realtimeConnected ? <div className="fixed inset-x-0 top-0 z-[55] px-4 pt-3"><div className="mx-auto max-w-4xl"><ReconnectState /></div></div> : null}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white/90 p-4 backdrop-blur xl:block dark:border-slate-800 dark:bg-slate-950/90">
        <Logo />
        <nav className="mt-8 space-y-1" aria-label={`${role} navigation`}>{menu.map((item) => <NavItem key={item.href} item={item} active={pathname === item.href} />)}</nav>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur xl:pl-72 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3 xl:max-w-none">
          <button className="rounded-xl p-2 xl:hidden" aria-label="Open menu"><Menu /></button>
          <Logo compact />
          <SearchBar className="hidden flex-1 md:flex" />
          <span className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold md:inline-flex dark:bg-slate-800"><Radio size={14} className={realtimeConnected ? 'text-success' : 'text-warning'} /> {realtimeConnected ? 'Realtime' : 'Connecting'}</span>
          <span className="hidden rounded-full bg-slate-100 px-3 py-2 text-xs font-bold md:inline-flex dark:bg-slate-800">{online ? 'Online' : 'Offline'}</span>
          <button onClick={() => setPanelOpen((v) => !v)} className="relative rounded-xl p-2" aria-label="Notifications"><Bell /></button>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-xl p-2" aria-label="Switch theme"><Moon /></button>
          <button className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold dark:border-slate-800"><UserCircle size={20} /> <span className="hidden sm:inline capitalize">{role}</span><ChevronDown size={14} /></button>
        </div>
      </header>

      <div className="xl:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {!isGuestHome ? <Breadcrumb crumbs={crumbs} /> : null}
          <main className={isGuestHome ? '' : 'py-4'}>{children}</main>
        </div>
      </div>

      <NotificationPanel open={panelOpen} role={role} />
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white p-2 md:hidden dark:border-slate-800 dark:bg-slate-950">{menu.slice(0, 4).map((item) => <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-[11px] font-bold"><item.icon size={18} />{item.label}</a>)}</nav>
      <FloatingButton aria-label="Primary action" />
      <footer className="border-t border-slate-200 px-4 py-8 text-center text-sm text-slate-500 xl:ml-72 dark:border-slate-800">© 2026 STMS UI Foundation</footer>
      <div id="loading-overlay" className="pointer-events-none fixed inset-0 z-[70] hidden place-items-center bg-white/60 backdrop-blur">Loading...</div>
    </div>
  );
}

function Logo({ compact }: { compact?: boolean }) { return <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white">S</span>{compact ? null : <span>STMS</span>}</Link>; }
function NavItem({ item, active }: { item: ReturnType<typeof getMenuForRole>[number]; active: boolean }) { return <a href={item.href} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${active ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'}`}><item.icon size={18} />{item.label}</a>; }
function Breadcrumb({ crumbs }: { crumbs: string[] }) { return <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"><Link href="/">Home</Link>{crumbs.map((crumb, index) => <span key={crumb} className="flex items-center gap-2"><span>/</span><span className="capitalize text-slate-700 dark:text-slate-200">{crumb.replaceAll('-', ' ')}</span></span>)}</div>; }
function NotificationPanel({ open, role }: { open: boolean; role: AppRole }) { const href = role === 'guest' ? '/customer/notifications' : `/${role}/notifications`; return open ? <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))]"><AppCard><div className="flex items-center justify-between"><h2 className="font-display text-xl font-bold">Notifications</h2><Link href={href} className="rounded-2xl bg-primary px-4 py-2 text-sm font-bold text-white">Open center</Link></div><div className="mt-4"><NotificationBadge unread={0} /></div><p className="mt-6 text-sm text-slate-500">Use the shared notification center for inbox, filters, actions, settings, and realtime updates.</p></AppCard></div> : null; }
