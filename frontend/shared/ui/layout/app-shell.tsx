'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Menu, Moon, Radio, Sun, User as UserIcon, UserCircle, X } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useConnection } from '@/shared/hooks/use-connection';
import { useAuth } from '@/shared/providers/auth-provider';
import { fetchNotifications } from '@/services/portal';
import { NotificationBadge } from '@/features/notification-center';
import { LEGAL_NAV } from '@/features/legal/legal-config';
import { Chevrons, ChevronMark } from '@/shared/ui/design/chevron';
import { getMenuForRole, getRoleFromPath } from '../navigation';
import type { AppRole } from '../navigation/types';
import { AppCard, FloatingButton, ReconnectState } from '../components';
import { SiteFooter } from './site-footer';
import { WelcomePopup } from '@/features/cms/welcome-popup';
import { useTheme } from '../theme/theme-provider';

export function GuestLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="guest">{children}</AppShell>; }
export function CustomerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="customer">{children}</AppShell>; }
export function DriverLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="driver">{children}</AppShell>; }
export function AdminLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="admin">{children}</AppShell>; }
export function OwnerLayout({ children }: { children: ReactNode }) { return <AppShell forcedRole="owner">{children}</AppShell>; }

const PUBLIC_PATHS = [
  '/', '/login', '/register', '/forgot-password', '/reset-password', '/install', '/forbidden', '/unauthorized', '/jadwal', '/tentang',
  // Legal pages are public by definition — they must be readable (and
  // crawlable) without an account.
  ...LEGAL_NAV.map((item) => item.href),
];
const roleHome: Record<AppRole, string> = { guest: '/', customer: '/customer', driver: '/driver', admin: '/admin', owner: '/owner' };
// Primary "quick action" the floating (+) button jumps to for each role.
const roleQuickAction: Record<AppRole, { href: string; label: string }> = {
  guest: { href: '/jadwal', label: 'Lihat jadwal' },
  customer: { href: '/customer/bookings', label: 'New booking' },
  driver: { href: '/driver/check-in', label: 'Check-in passenger' },
  admin: { href: '/admin/bookings', label: 'New booking' },
  owner: { href: '/owner/notifications', label: 'New broadcast' },
};

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/payment') || pathname.startsWith('/ticket/qr');
}

/** Header control button — 44px hit area, 4px radius, ink-on-hover. */
const chromeButton =
  'inline-flex h-11 w-11 items-center justify-center rounded-md text-charcoal transition-colors hover:bg-cloud hover:text-ink dark:text-slate-300 dark:hover:bg-ink-soft dark:hover:text-white';

export function AppShell({ children, forcedRole }: { children: ReactNode; forcedRole?: AppRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, isAuthenticated, logout } = useAuth();
  // Role priority: explicit layout role → signed-in user's real role → path guess.
  // Owner is a super-role that may browse any area.
  const role: AppRole = forcedRole ?? (isAuthenticated && user ? (user.role as AppRole) : getRoleFromPath(pathname));
  const menu = getMenuForRole(role);
  const { online, realtimeConnected, realtimeEnabled } = useConnection();
  const { setTheme, resolvedTheme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const crumbs = useMemo(() => pathname.split('/').filter(Boolean), [pathname]);
  const isGuestHome = role === 'guest' && pathname === '/';
  const needsAuth = !isPublicPath(pathname);

  useEffect(() => {
    if (status === 'loading') return;
    if (needsAuth && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (isAuthenticated && user && needsAuth && user.role !== 'owner' && role !== 'guest' && user.role !== role) {
      router.replace(roleHome[user.role] ?? '/');
    }
  }, [status, isAuthenticated, needsAuth, pathname, role, router, user]);

  // Close the nav drawer automatically whenever the route changes.
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // Close the nav drawer with Escape for keyboard users.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  if (needsAuth && (status === 'loading' || !isAuthenticated)) {
    return (
      <div className="grid min-h-screen place-items-center bg-cloud dark:bg-ink-deep">
        <div className="flex flex-col items-center gap-4">
          <Chevrons side="left" size="sm" />
          <p className="text-xs font-semibold uppercase tracking-button text-graphite">Memuat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cloud text-ink dark:bg-ink-deep dark:text-slate-100">
      {!online ? (
        <div className="fixed inset-x-0 top-0 z-[60] bg-bloom-deep px-4 py-2 text-center text-xs font-semibold uppercase tracking-button text-white">
          Mode offline aktif — perubahan mungkin tertunda
        </div>
      ) : null}
      {realtimeEnabled && !realtimeConnected ? (
        <div className="fixed inset-x-0 top-0 z-[55] px-4 pt-3"><div className="mx-auto max-w-4xl"><ReconnectState /></div></div>
      ) : null}

      {/* ── Navigation drawer — ink slab, chevron header (DESIGN.md) ── */}
      {sidebarOpen ? (
        <button aria-label="Tutup menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-ink/50" />
      ) : null}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] -translate-x-full flex-col bg-ink text-on-ink transition-transform duration-200 ease-out ${sidebarOpen ? 'translate-x-0' : ''}`}
      >
        <div className="relative flex items-center justify-between border-b border-ink-soft px-5 py-5">
          <Chevrons side="left" className="absolute left-0 top-0 h-full opacity-80" size="sm" />
          <div className="pl-8"><Logo onNavigate={() => setSidebarOpen(false)} /></div>
          <button onClick={() => setSidebarOpen(false)} className="grid h-10 w-10 place-items-center rounded-md text-slate-400 transition-colors hover:bg-ink-soft hover:text-white" aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <p className="px-5 pt-6 text-xs font-semibold uppercase tracking-button text-slate-500">{role}</p>
        <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-6" aria-label={`Navigasi ${role}`}>
          {menu.map((item) => <NavItem key={item.href} item={item} active={pathname === item.href} onNavigate={() => setSidebarOpen(false)} />)}
        </nav>
      </aside>

      {/* ── Header — solid canvas, hairline rule, sharp controls ── */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-canvas dark:border-ink-soft dark:bg-ink">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className={chromeButton}
            aria-label={sidebarOpen ? 'Tutup menu' : 'Buka menu'}
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu size={20} />
          </button>
          <Logo compact />
          <div className="flex-1" />

          {/* Connection status — uppercase micro-labels, sharp chips */}
          <span className="hidden items-center gap-1.5 rounded-md bg-cloud px-3 py-1.5 text-[11px] font-semibold uppercase tracking-button text-charcoal md:inline-flex dark:bg-ink-soft dark:text-slate-300">
            <Radio size={12} className={realtimeConnected ? 'text-storm-deep' : 'text-bloom-coral'} aria-hidden="true" />
            {realtimeConnected ? 'Realtime' : 'Connecting'}
          </span>
          <span className="hidden rounded-md bg-cloud px-3 py-1.5 text-[11px] font-semibold uppercase tracking-button text-charcoal md:inline-flex dark:bg-ink-soft dark:text-slate-300">
            {online ? 'Online' : 'Offline'}
          </span>

          <button onClick={() => setPanelOpen((v) => !v)} className={chromeButton} aria-label="Notifikasi" aria-expanded={panelOpen}><Bell size={20} /></button>
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className={chromeButton}
            aria-label={resolvedTheme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            title={resolvedTheme === 'dark' ? 'Mode terang' : 'Mode gelap'}
          >
            {resolvedTheme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="flex h-11 items-center gap-2 rounded-md border border-steel px-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-ink-soft dark:text-slate-100"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
            >
              <UserCircle size={18} /> <span className="hidden max-w-[10rem] truncate sm:inline">{user ? user.name : role}</span><ChevronDown size={14} />
            </button>
            {accountOpen ? (
              <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-hairline bg-canvas p-2 shadow-float dark:border-ink-soft dark:bg-ink">
                {user ? (
                  <div className="border-b border-hairline px-3 pb-3 pt-2 dark:border-ink-soft">
                    <p className="truncate text-sm font-semibold text-ink dark:text-white">{user.name}</p>
                    <p className="truncate text-xs text-graphite dark:text-slate-400">{user.email}</p>
                  </div>
                ) : null}
                <Link href={`/${role === 'guest' ? 'customer' : role}/profile`} onClick={() => setAccountOpen(false)} className="mt-1 flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-cloud hover:text-ink dark:text-slate-300 dark:hover:bg-ink-soft"><UserIcon size={16} /> Profil</Link>
                {isAuthenticated ? (
                  <button onClick={() => logout()} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium text-bloom-deep transition-colors hover:bg-bloom-rose dark:text-bloom-coral dark:hover:bg-ink-soft"><LogOut size={16} /> Keluar</button>
                ) : (
                  <Link href="/login" onClick={() => setAccountOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"><LogOut size={16} /> Masuk</Link>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4">
        {!isGuestHome ? <div className="pt-5"><Breadcrumb crumbs={crumbs} /></div> : null}
        <main className={isGuestHome ? '' : 'py-6'}>{children}</main>
      </div>

      <NotificationPanel open={panelOpen} role={role} />
      <FloatingButton aria-label={roleQuickAction[role].label} title={roleQuickAction[role].label} onClick={() => router.push(roleQuickAction[role].href)} />
      <SiteFooter />
      {/* Renders only when enabled in Settings and not yet seen this session. */}
      <WelcomePopup />
      <div id="loading-overlay" className="pointer-events-none fixed inset-0 z-[70] hidden place-items-center bg-canvas/70 text-xs font-semibold uppercase tracking-button text-graphite">Memuat</div>
    </div>
  );
}

function Logo({ compact, onNavigate }: { compact?: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-2">
      <Image src="/sjt-logo.png" alt="SJT Tour & Travel" width={compact ? 44 : 132} height={compact ? 30 : 88} className={compact ? 'h-8 w-auto' : 'h-10 w-auto'} priority />
      <span className="sr-only">SJT Tour &amp; Travel</span>
    </Link>
  );
}

/** Drawer nav row — sharp 4px, primary fill when active, on the ink slab. */
function NavItem({ item, active, onNavigate }: { item: ReturnType<typeof getMenuForRole>[number]; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-md px-4 text-sm font-medium transition-colors ${
        active ? 'bg-primary text-white' : 'text-slate-300 hover:bg-ink-soft hover:text-white'
      }`}
    >
      <item.icon size={18} aria-hidden="true" />{item.label}
    </Link>
  );
}

function Breadcrumb({ crumbs }: { crumbs: string[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-button text-graphite">
        <li className="flex items-center gap-2"><ChevronMark /><Link href="/" className="transition-colors hover:text-primary">Home</Link></li>
        {crumbs.map((crumb, index) => {
          const href = `/${crumbs.slice(0, index + 1).join('/')}`;
          const isLast = index === crumbs.length - 1;
          const label = crumb.replaceAll('-', ' ');
          return (
            <li key={href} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-steel">/</span>
              {isLast ? (
                <span aria-current="page" className="text-ink dark:text-slate-200">{label}</span>
              ) : (
                <Link href={href} className="transition-colors hover:text-primary">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function NotificationPanel({ open, role }: { open: boolean; role: AppRole }) {
  const { isAuthenticated } = useAuth();
  const href = role === 'guest' ? '/customer/notifications' : `/${role}/notifications`;
  const query = useQuery({ queryKey: ['user-notifications'], queryFn: fetchNotifications, enabled: open && isAuthenticated, staleTime: 15_000 });
  const unread = query.data?.unread ?? 0;
  const latest = (query.data?.items ?? []).slice(0, 3);

  if (!open) return null;

  return (
    <div className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))]">
      <AppCard>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl font-medium tracking-tight text-ink dark:text-white">Notifikasi</h2>
          <Link href={href} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-semibold uppercase tracking-button text-white transition-colors hover:bg-primary-deep">Buka</Link>
        </div>
        <div className="mt-4"><NotificationBadge unread={unread} /></div>
        {latest.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {latest.map((item) => (
              <li key={item.uuid} className="rounded-lg bg-cloud px-3 py-2.5 dark:bg-ink-soft">
                <p className="text-sm font-semibold text-ink dark:text-slate-100">{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-graphite dark:text-slate-400">{item.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-graphite dark:text-slate-400">{isAuthenticated ? 'Belum ada notifikasi.' : 'Masuk untuk melihat notifikasi kamu.'}</p>
        )}
      </AppCard>
    </div>
  );
}
