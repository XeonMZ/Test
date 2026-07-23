'use client';

import { Loader2, Pause, Play, RotateCcw, Shuffle, Square } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LiveMap } from '@/features/live-trip/live-map';
import { useMapConfig } from '@/features/map/registry';
import { betaMapProvider } from '@/features/map/providers/beta';
import type { LatLng, MapPoint } from '@/features/map/types';
import { adminApi } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

// =====================================================================
// BETA SIMULATOR — Development / QA / Demo / Testing / UAT.
//
// Entirely in-memory: factories generate drivers, vehicles, customers,
// bookings, schedules, manifests and jastip; the driver animates along a
// simulated route; statuses transition automatically; ETA is simulated.
// NOTHING here touches the database — start/stop only ping the audited
// backend toggle. Available exclusively to the super admin while Beta
// Mode is active (server-enforced).
// =====================================================================

const CENTER: LatLng = { lat: -7.2575, lng: 112.7521 };

// ------------------------------ Factories ------------------------------

const FIRST = ['Andi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Intan', 'Joko'];
const LAST = ['Santoso', 'Wijaya', 'Pratama', 'Lestari', 'Saputra', 'Utami', 'Ramadhan', 'Kusuma'];
const CITIES = ['Sumenep', 'Pamekasan', 'Sampang', 'Bangkalan', 'Surabaya', 'Sidoarjo', 'Gresik'];
const VEHICLES = ['Hiace Premio', 'Hiace Commuter', 'Elf Long', 'Avanza', 'Innova Reborn'];
const ITEMS = ['Dokumen', 'Oleh-oleh', 'Sparepart', 'Paket Baju', 'Elektronik'];

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]): T => arr[rand(arr.length)];
const name = () => `${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `08${String(100000000 + rand(899999999)).slice(0, 10)}`;
const near = (base: LatLng, spread = 0.05): LatLng => ({ lat: base.lat + (Math.random() - 0.5) * spread, lng: base.lng + (Math.random() - 0.5) * spread });

type SimCustomer = { id: number; name: string; phone: string; seat: string; pickup: LatLng; drop: LatLng; status: 'waiting' | 'picked_up' | 'dropped_off' };
type SimJastip = { id: number; code: string; item: string; sender: string; receiver: string; pickup: LatLng; drop: LatLng; status: 'assigned' | 'picked_up' | 'delivered' };

type SimState = {
  driver: { name: string; vehicle: string; plate: string };
  schedule: { code: string; origin: string; destination: string; departure: string };
  booking: { code: string; amount: number };
  customers: SimCustomer[];
  jastip: SimJastip[];
  route: LatLng[];
  progress: number; // 0..1 along route
  etaMinutes: number;
  status: 'idle' | 'running' | 'paused' | 'finished';
};

function makeCustomers(count: number, route: LatLng[]): SimCustomer[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: name(),
    phone: phone(),
    seat: `${String.fromCharCode(65 + (i % 4))}${1 + Math.floor(i / 4)}`,
    pickup: near(route[Math.min(i + 1, Math.floor(route.length / 2))], 0.008),
    drop: near(route[route.length - 1 - (i % 3)], 0.008),
    status: 'waiting',
  }));
}

function makeJastip(count: number, route: LatLng[]): SimJastip[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    code: `JT-SIM-${1000 + rand(9000)}`,
    item: pick(ITEMS),
    sender: name(),
    receiver: name(),
    pickup: near(route[1], 0.01),
    drop: near(route[route.length - 2], 0.01),
    status: 'assigned',
  }));
}

async function makeRoute(): Promise<{ route: LatLng[]; origin: string; destination: string }> {
  const from = near(CENTER, 0.09);
  const to = near(CENTER, 0.09);
  return { route: await betaMapProvider.route(from, to), origin: pick(CITIES), destination: pick(CITIES) };
}

async function freshState(): Promise<SimState> {
  const { route, origin, destination } = await makeRoute();
  return {
    driver: { name: name(), vehicle: pick(VEHICLES), plate: `M ${1000 + rand(9000)} ${String.fromCharCode(65 + rand(26))}${String.fromCharCode(65 + rand(26))}` },
    schedule: { code: `SCH-SIM-${100 + rand(900)}`, origin, destination, departure: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) },
    booking: { code: `BK-SIM-${10000 + rand(90000)}`, amount: 75000 + rand(6) * 25000 },
    customers: makeCustomers(3 + rand(4), route),
    jastip: makeJastip(1 + rand(3), route),
    route,
    progress: 0,
    etaMinutes: 25 + rand(30),
    status: 'idle',
  };
}

// ------------------------------ Simulator ------------------------------

const TICK_MS = 1000;
const STEP = 0.008; // route fraction per tick

export function MapSimulatorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: config, isLoading: configLoading } = useMapConfig();
  const [state, setState] = useState<SimState | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    void freshState().then(setState);
    return stopTimer;
  }, [stopTimer]);

  // Auto status transitions as the driver advances along the route.
  const tick = useCallback(() => {
    setState((s) => {
      if (!s || s.status !== 'running') return s;
      const progress = Math.min(1, s.progress + STEP);
      const customers = s.customers.map((c, i) => {
        const pickupAt = 0.15 + i * 0.1;
        const dropAt = 0.65 + i * 0.08;
        if (c.status === 'waiting' && progress >= pickupAt) return { ...c, status: 'picked_up' as const };
        if (c.status === 'picked_up' && progress >= dropAt) return { ...c, status: 'dropped_off' as const };
        return c;
      });
      const jastip = s.jastip.map((j, i) => {
        if (j.status === 'assigned' && progress >= 0.2 + i * 0.1) return { ...j, status: 'picked_up' as const };
        if (j.status === 'picked_up' && progress >= 0.8) return { ...j, status: 'delivered' as const };
        return j;
      });
      const finished = progress >= 1;
      return {
        ...s,
        progress,
        customers,
        jastip,
        etaMinutes: Math.max(0, Math.round(s.etaMinutes * (1 - progress))),
        status: finished ? 'finished' : s.status,
      };
    });
  }, []);

  const backendToggle = useMutation({
    mutationFn: adminApi.mapSimulator,
    onError: (error) => toast(extractApiError(error, 'Gagal memperbarui status simulator.'), 'error'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['map-settings'] }),
  });

  const controls = {
    start: () => {
      setState((s) => (s ? { ...s, status: 'running' } : s));
      stopTimer();
      timerRef.current = setInterval(tick, TICK_MS);
      backendToggle.mutate('start');
    },
    pause: () => { setState((s) => (s ? { ...s, status: 'paused' } : s)); stopTimer(); },
    resume: () => {
      setState((s) => (s ? { ...s, status: 'running' } : s));
      stopTimer();
      timerRef.current = setInterval(tick, TICK_MS);
    },
    reset: async () => {
      stopTimer();
      setState(await freshState());
      backendToggle.mutate('stop');
    },
  };

  // Randomizers — each regenerates one entity family in place.
  const randomize = {
    route: async () => { const { route, origin, destination } = await makeRoute(); setState((s) => (s ? { ...s, route, progress: 0, schedule: { ...s.schedule, origin, destination }, customers: makeCustomers(s.customers.length, route), jastip: makeJastip(s.jastip.length, route) } : s)); },
    driver: () => setState((s) => (s ? { ...s, driver: { ...s.driver, name: name() } } : s)),
    vehicle: () => setState((s) => (s ? { ...s, driver: { ...s.driver, vehicle: pick(VEHICLES), plate: `M ${1000 + rand(9000)} X${String.fromCharCode(65 + rand(26))}` } } : s)),
    customer: () => setState((s) => (s ? { ...s, customers: makeCustomers(3 + rand(4), s.route) } : s)),
    booking: () => setState((s) => (s ? { ...s, booking: { code: `BK-SIM-${10000 + rand(90000)}`, amount: 75000 + rand(6) * 25000 } } : s)),
    schedule: () => setState((s) => (s ? { ...s, schedule: { ...s.schedule, code: `SCH-SIM-${100 + rand(900)}`, departure: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) } } : s)),
    manifest: () => setState((s) => (s ? { ...s, customers: makeCustomers(3 + rand(4), s.route), jastip: makeJastip(1 + rand(3), s.route) } : s)),
    jastip: () => setState((s) => (s ? { ...s, jastip: makeJastip(1 + rand(3), s.route) } : s)),
    gps: () => setState((s) => (s ? { ...s, progress: Math.random() * 0.9 } : s)),
    eta: () => setState((s) => (s ? { ...s, etaMinutes: 5 + rand(55) } : s)),
  };

  const mapData = useMemo(() => {
    if (!state) return { points: [] as MapPoint[], path: [] as LatLng[] };
    const idx = Math.min(state.route.length - 1, Math.floor(state.progress * (state.route.length - 1)));
    const driverPos = state.route[idx];
    const points: MapPoint[] = [{ ...driverPos, kind: 'driver', label: state.driver.name }];
    for (const c of state.customers) {
      points.push({ ...c.pickup, kind: 'pickup', label: `Jemput: ${c.name}`, done: c.status !== 'waiting' });
      points.push({ ...c.drop, kind: 'drop', label: `Tujuan: ${c.name}`, done: c.status === 'dropped_off' });
    }
    for (const j of state.jastip) {
      points.push({ ...j.pickup, kind: 'jastip', label: `Ambil: ${j.code}`, done: j.status !== 'assigned' });
      points.push({ ...j.drop, kind: 'jastip', label: `Antar: ${j.code}`, done: j.status === 'delivered' });
    }
    return { points, path: state.route.slice(0, idx + 1) };
  }, [state]);

  if (configLoading || !state) return <div className="space-y-4"><Skeleton className="h-72" /><Skeleton className="h-40" /></div>;

  // Server rule mirrored client-side: beta must be the ACTIVE provider.
  if (config?.provider !== 'beta') {
    return (
      <EmptyState
        title="Simulator tidak tersedia"
        description={config?.beta_blocked ? config.message ?? 'Beta Mode sedang dinonaktifkan.' : 'Simulator hanya tersedia saat Map Provider = beta dan FEATURE_MAP_BETA aktif. Atur melalui halaman Map Provider.'}
      />
    );
  }

  const ctlBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-300';
  const running = state.status === 'running';

  return (
    <div className="space-y-5">
      <PageHeader
        title="Map Simulator (Beta Mode)"
        description="Seluruh data di halaman ini dibangkitkan in-memory oleh factory — tidak ada satu baris pun yang ditulis ke database. Untuk Development, QA, Demo, dan UAT tanpa biaya API."
      />

      <div className="flex flex-wrap items-center gap-2">
        {state.status === 'idle' || state.status === 'finished' ? (
          <button onClick={controls.start} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-emerald-600 px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-emerald-700"><Play size={15} /> Start Simulation</button>
        ) : null}
        {running ? <button onClick={controls.pause} className={ctlBtn}><Pause size={13} /> Pause</button> : null}
        {state.status === 'paused' ? <button onClick={controls.resume} className={ctlBtn}><Play size={13} /> Resume</button> : null}
        <button onClick={() => void controls.reset()} className={ctlBtn}><RotateCcw size={13} /> Reset</button>
        {running || state.status === 'paused' ? (
          <button onClick={() => { stopTimer(); setState((s) => (s ? { ...s, status: 'finished', progress: 1 } : s)); backendToggle.mutate('stop'); }} className={ctlBtn}><Square size={13} /> Stop</button>
        ) : null}
        <Badge tone={running ? 'success' : state.status === 'finished' ? 'neutral' : 'warning'}>
          {running ? '🟢 Berjalan' : state.status === 'paused' ? 'Jeda' : state.status === 'finished' ? 'Selesai' : 'Siap'}
        </Badge>
        <Badge tone="neutral">ETA ± {state.etaMinutes} mnt</Badge>
        {backendToggle.isPending ? <Loader2 size={14} className="animate-spin text-slate-400" /> : null}
      </div>

      <LiveMap points={mapData.points} path={mapData.path} center={mapData.points[0] ?? null} className="h-[46vh] min-h-72 w-full" />

      <AppCard>
        <SectionHeader title="Random Generator" description="Regenerasi entitas simulasi satu per satu — semuanya in-memory." />
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ['Random Route', randomize.route],
            ['Random Driver', randomize.driver],
            ['Random Vehicle', randomize.vehicle],
            ['Random Customer', randomize.customer],
            ['Random Booking', randomize.booking],
            ['Random Schedule', randomize.schedule],
            ['Random Manifest', randomize.manifest],
            ['Random Jastip', randomize.jastip],
            ['Random GPS', randomize.gps],
            ['Random ETA', randomize.eta],
          ] as Array<[string, () => void | Promise<void>]>).map(([label, fn]) => (
            <button key={label} onClick={() => void fn()} className={ctlBtn}><Shuffle size={12} /> {label}</button>
          ))}
        </div>
      </AppCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <AppCard>
          <SectionHeader title={`Manifest Simulasi — ${state.schedule.origin} → ${state.schedule.destination}`} description={`${state.schedule.code} · berangkat ${state.schedule.departure} · Driver ${state.driver.name} · ${state.driver.vehicle} ${state.driver.plate} · Booking ${state.booking.code}`} />
          <ul className="mt-4 space-y-2">
            {state.customers.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 dark:bg-slate-950/60">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{c.name} <span className="font-mono text-xs text-slate-400">({c.seat} · {c.phone})</span></span>
                <Badge tone={c.status === 'dropped_off' ? 'success' : c.status === 'picked_up' ? 'warning' : 'neutral'}>
                  {c.status === 'dropped_off' ? 'Diantar' : c.status === 'picked_up' ? 'Dijemput' : 'Menunggu'}
                </Badge>
              </li>
            ))}
          </ul>
        </AppCard>
        <AppCard>
          <SectionHeader title="Paket Jastip Simulasi" />
          <ul className="mt-4 space-y-2">
            {state.jastip.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-amber-50/60 px-4 py-2.5 dark:bg-amber-950/20">
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{j.item} <span className="font-mono text-xs text-slate-400">({j.code}) · {j.sender} → {j.receiver}</span></span>
                <Badge tone={j.status === 'delivered' ? 'success' : j.status === 'picked_up' ? 'warning' : 'neutral'}>
                  {j.status === 'delivered' ? 'Diantar' : j.status === 'picked_up' ? 'Diambil' : 'Menunggu'}
                </Badge>
              </li>
            ))}
          </ul>
        </AppCard>
      </div>
    </div>
  );
}
