import { AppCard, Badge, DataTable, EmptyState, FilterBar, PageHeader, SearchBar, SectionHeader, Skeleton, StatsCard, Timeline } from '@/shared/ui/components';
import { existingAdminOwnerEndpoints, plannedReadOnlyInterfaces } from './api';
import { adminMetrics, management, ownerMetrics, reportFilters, reports } from './data';

type Tone = 'neutral' | 'success' | 'warning' | 'danger';
export function DashboardCard(props: { label: string; value?: string; helper?: string }) { return <StatsCard label={props.label} value={props.value ?? '--'} helper={props.helper ?? 'Existing endpoint integration ready'} />; }
export function MetricCard(props: { label: string }) { return <DashboardCard label={props.label} />; }
export function SummaryCard({ title, items }: { title: string; items: string[] }) { return <AppCard><SectionHeader title={title} description="UI-only summary, no new backend contract." /><div className="mt-4 flex flex-wrap gap-2">{items.map((item, i) => <Badge key={item} tone={(i % 3 === 0 ? 'success' : i % 3 === 1 ? 'warning' : 'neutral') as Tone}>{item}</Badge>)}</div></AppCard>; }
export function RevenueCard() { return <AppCard><SectionHeader title="Revenue" description="Revenue today/month preview from existing payment flows." /><p className="mt-4 font-display text-3xl font-bold">--</p></AppCard>; }
export function ChartCard({ title }: { title: string }) { return <AppCard><SectionHeader title={title} description="Commercial analytics visual with consistent spacing and responsive rhythm." /><div className="mt-5 grid h-44 grid-cols-8 items-end gap-2 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/60">{[35,70,45,90,55,75,50,84].map((h, i) => <span key={i} className="rounded-t-2xl bg-gradient-to-t from-primary to-sky-300 shadow-sm transition hover:opacity-80" style={{ height: `${h}%` }} />)}</div></AppCard>; }
export function RecentActivityCard() { return <AppCard><SectionHeader title="Aktivitas Terbaru" /><div className="mt-4"><Timeline items={['Booking created','Payment waiting','Driver assigned','Ticket generated']} /></div></AppCard>; }
export function NotificationPanel() { return <AppCard><SectionHeader title="Notification Center" description="Unread/read notification states with compact commercial table styling." /><DataTable columns={['Notification','State']} rows={[[<span key="n">Payment reminder</span>, <Badge key="b" tone="warning">Unread</Badge>], ['Trip update', <Badge key="r" tone="success">Read</Badge>]]} /></AppCard>; }
export function StatusBadge({ status }: { status: string }) { return <Badge tone={status.includes('Paid') || status.includes('Active') ? 'success' : status.includes('Failed') ? 'danger' : 'warning'}>{status}</Badge>; }
export function ReportCard({ name }: { name: string }) { return <AppCard><SectionHeader title={name} description="Export preview only; no export backend created." /><Skeleton className="mt-4 h-20" /></AppCard>; }
export function ExportDialog() { return <AppCard><SectionHeader title="Export Preview" description="Accessible export confirmation preview for guarded actions." /></AppCard>; }
export function ConfirmationDialog() { return <AppCard><SectionHeader title="Confirmation Dialog" description="Shared confirmation pattern for guarded actions." /></AppCard>; }
export function LoadingSkeleton() { return <Skeleton />; }
export function ErrorState() { return <EmptyState title="Unable to load" description="Check existing endpoint availability and permissions." />; }
export function Pagination() { return <div className="flex justify-end gap-2 text-sm font-bold"><button className="min-h-10 rounded-2xl border border-slate-200 px-4 py-2 transition hover:border-primary hover:text-primary dark:border-slate-800">Previous</button><button className="min-h-10 rounded-2xl border border-slate-200 px-4 py-2 transition hover:border-primary hover:text-primary dark:border-slate-800">Next</button></div>; }
export const SearchBox = SearchBar;

export function DashboardPage({ scope }: { scope: 'admin' | 'owner' }) {
  const metrics = scope === 'admin' ? adminMetrics : ownerMetrics;
  return <div className="space-y-6 sm:space-y-8"><PageHeader title={scope === 'admin' ? 'Admin Dashboard' : 'Owner Dashboard'} description="Sprint 6C UI + integration only; backend business logic and API contracts unchanged." />
    <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">{metrics.map((m) => <MetricCard key={m} label={m} />)}</div>
    <div className="grid gap-4 lg:grid-cols-2"><ChartCard title="Grafik Booking" /><ChartCard title="Grafik Revenue" /><RecentActivityCard /><NotificationPanel /></div>
    <SummaryCard title="Quick Actions" items={scope === 'admin' ? ['Manage bookings','Monitor payments','Review tickets','Open reports'] : ['Revenue reports','Driver performance','Vehicle utilization','Audit logs']} />
    <EndpointPanel />
  </div>;
}
export function ReportsPage({ scope }: { scope: 'admin' | 'owner' }) { return <div className="space-y-6 sm:space-y-8"><PageHeader title={`${scope === 'admin' ? 'Admin' : 'Owner'} Reports`} description="Report preview with date, route, driver, and vehicle filters." /><FilterBar>{reportFilters.map((f) => <Badge key={f}>{f}</Badge>)}</FilterBar><div className="grid gap-4 md:grid-cols-2">{reports.map((r) => <ReportCard key={r} name={r} />)}</div><ExportDialog /></div>; }
export function ManagementPage({ kind, title }: { kind: keyof typeof management; title: string }) { const items = management[kind]; return <div className="space-y-6 sm:space-y-8"><PageHeader title={title} description="Production-style management surface with shared search, status and pagination components." /><FilterBar><SearchBar placeholder={`Search ${title}`} />{items.slice(1,4).map((i) => <Badge key={i}>{i}</Badge>)}</FilterBar><DataTable columns={['Feature','Status','Integration']} rows={items.map((i) => [i, <StatusBadge key={i} status={i.includes('Failed') ? 'Failed preview' : 'Active preview'} />, i.includes('Generate Ticket') ? 'GET /v1/tickets + QR' : 'Shared typed interface'])} /><RecentActivityCard /><Pagination /></div>; }
export function EndpointPanel() { return <AppCard><SectionHeader title="Endpoint Existing yang digunakan" description="No new endpoint is introduced by Sprint 6C." /><div className="mt-4 grid gap-2 md:grid-cols-2">{existingAdminOwnerEndpoints.map((e) => <code key={e} className="rounded-xl bg-slate-100 px-3 py-2 text-xs dark:bg-slate-800">{e}</code>)}</div><SectionHeader title="Typed TODO interfaces" description="Documented interfaces displayed with consistent visual treatment." /><div className="mt-4 grid gap-2 md:grid-cols-2">{plannedReadOnlyInterfaces.map((e) => <code key={e} className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{e}</code>)}</div></AppCard>; }


const ownerSettingsSections = ['Company','Localization','Booking','Payment','Ticket','Realtime','Notification','Membership','Promo','Feature Flags','Backup','Health Check','Demo Data'];
const readinessRows = [
  ['Health Check', 'GET /api/owner/production-readiness/health', 'Healthy / Warning / Failed'],
  ['Demo Data', 'GET + DELETE /api/owner/production-readiness/demo-data', 'Owner confirmation + audit log'],
  ['Export', 'GET /api/owner/production-readiness/configuration/export', 'Existing SystemSetting + FeatureFlag only'],
  ['Import', 'POST /api/owner/production-readiness/configuration/import', 'Validated configuration payload'],
  ['Backup', 'POST /api/owner/production-readiness/configuration/backup', 'Filesystem backup of settings'],
  ['Restore', 'POST /api/owner/production-readiness/configuration/restore', 'Restore from backup path'],
];

export function OwnerSettingsPage() {
  return <div className="space-y-6 sm:space-y-8"><PageHeader title="Owner Settings" description="Extends the existing owner settings area for Sprint 7B production readiness without redesigning booking, payment, ticket, driver, GPS, notification, or realtime engines." />
    <AppCard><SectionHeader title="Settings Sections" description="All values persist through existing SystemSetting and FeatureFlag infrastructure." /><div className="mt-4 flex flex-wrap gap-2">{ownerSettingsSections.map((section) => <Badge key={section} tone={section.includes('Health') ? 'success' : section.includes('Demo') ? 'warning' : 'neutral'}>{section}</Badge>)}</div></AppCard>
    <AppCard><SectionHeader title="Production Readiness Tools" description="Owner-only endpoints for checks, demo data cleanup, and configuration backup/restore." /><DataTable columns={['Tool','Endpoint','Protection']} rows={readinessRows} /></AppCard>
    <ConfirmationDialog />
  </div>;
}
