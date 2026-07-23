'use client';

import { clsx } from 'clsx';
import { ArrowLeft, ArrowRight, BusFront, CalendarDays, Check, Clock, Loader2, MapPin, RefreshCw, Search, Ticket, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { SeatMap } from '@/features/booking/seat-map';
import { LegalConsent, LegalLink } from '@/features/legal/legal-consent';
import { PickupPicker } from '@/features/live-trip/pickup-picker';
import {
  createBooking,
  validatePromo,
  extractApiError,
  fetchRoutes,
  fetchSchedules,
  fetchSeatMap,
  formatIDR,
  formatTime,
  type CatalogSchedule,
  type CatalogSeat,
} from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { AppCard, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

const STEPS = ['Jadwal', 'Kursi', 'Penumpang', 'Konfirmasi'] as const;

type PassengerDraft = { name: string; identity_number: string };

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function BookingWizard() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [origin, setOrigin] = useState(params.get('origin') ?? '');
  const [destination, setDestination] = useState(params.get('destination') ?? '');
  const [date, setDate] = useState(params.get('date') ?? todayISO());
  const [searchSubmitted, setSearchSubmitted] = useState(Boolean(params.get('origin') || params.get('destination') || params.get('date')));
  const [schedule, setSchedule] = useState<CatalogSchedule | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<CatalogSeat[]>([]);
  const [passengers, setPassengers] = useState<PassengerDraft[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  // #7 promo, #6 pickup/drop points + direction
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState<string | null>(null);
  const [pickup, setPickup] = useState({ label: '', lat: '', lng: '' });
  const [drop, setDrop] = useState({ label: '', lat: '', lng: '' });
  const [direction, setDirection] = useState<'berangkat' | 'pulang'>('berangkat');
  const [pickupNote, setPickupNote] = useState('');
  // Checkout consent — payment stays disabled until this is accepted.
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);

  const routesQuery = useQuery({ queryKey: ['catalog-routes'], queryFn: fetchRoutes, staleTime: 5 * 60_000 });

  const schedulesQuery = useQuery({
    queryKey: ['catalog-schedules', origin, destination, date],
    queryFn: () => fetchSchedules({ origin, destination, date }),
    enabled: searchSubmitted,
  });

  const seatsQuery = useQuery({
    queryKey: ['catalog-seats', schedule?.uuid],
    queryFn: () => fetchSeatMap(schedule!.uuid),
    enabled: Boolean(schedule?.uuid) && step >= 1,
    refetchInterval: step === 1 ? 15_000 : false,
  });

  const totalAmount = useMemo(() => (schedule ? Math.max(0, schedule.base_fare * selectedSeats.length - promoDiscount) : 0), [schedule, selectedSeats.length, promoDiscount]);

  const applyPromo = async () => {
    if (!promoCode.trim() || !schedule) return;
    try {
      const res = await validatePromo({ code: promoCode.trim(), amount: schedule.base_fare * selectedSeats.length });
      if (res.valid) {
        setPromoDiscount(res.discount ?? 0);
        setPromoMsg(`Promo diterapkan: -${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(res.discount ?? 0)}`);
      } else {
        setPromoDiscount(0);
        setPromoMsg('Kode promo tidak valid atau kedaluwarsa.');
      }
    } catch {
      setPromoDiscount(0);
      setPromoMsg('Gagal memeriksa promo.');
    }
  };

  const origins = useMemo(() => Array.from(new Set((routesQuery.data ?? []).map((r) => r.origin))).sort(), [routesQuery.data]);
  const destinations = useMemo(
    () =>
      Array.from(
        new Set(
          (routesQuery.data ?? [])
            .filter((r) => (origin ? r.origin === origin : true))
            .map((r) => r.destination),
        ),
      ).sort(),
    [routesQuery.data, origin],
  );

  const bookingMutation = useMutation({
    mutationFn: () =>
      createBooking({
        schedule_id: schedule!.id,
        seat_ids: selectedSeats.map((seat) => seat.id),
        passengers: passengers.map((p) => ({ name: p.name.trim(), ...(p.identity_number.trim() ? { identity_number: p.identity_number.trim() } : {}) })),
        ...(promoCode.trim() ? { promo_code: promoCode.trim() } : {}),
        ...(pickup.label ? { pickup_label: pickup.label } : {}),
        ...(pickup.lat ? { pickup_lat: Number(pickup.lat) } : {}),
        ...(pickup.lng ? { pickup_lng: Number(pickup.lng) } : {}),
        ...(drop.label ? { drop_label: drop.label } : {}),
        ...(drop.lat ? { drop_lat: Number(drop.lat) } : {}),
        ...(drop.lng ? { drop_lng: Number(drop.lng) } : {}),
        ...(pickupNote.trim() ? { pickup_note: pickupNote.trim() } : {}),
        direction,
      }),
    onSuccess: (booking) => {
      toast('Booking berhasil dibuat. Lanjutkan ke pembayaran.', 'success');
      router.push(`/payment?booking=${booking.uuid}`);
    },
    onError: (error) => {
      const message = extractApiError(error, 'Booking gagal dibuat. Silakan coba lagi.');
      setFormError(message);
      toast(message, 'error');
      // Seat contention is the most common failure: refresh availability.
      seatsQuery.refetch();
    },
  });

  function pickSchedule(item: CatalogSchedule) {
    setSchedule(item);
    setSelectedSeats([]);
    setPassengers([]);
    setFormError(null);
    setStep(1);
  }

  function toggleSeat(seat: CatalogSeat) {
    setSelectedSeats((current) => {
      const exists = current.some((s) => s.id === seat.id);
      const next = exists ? current.filter((s) => s.id !== seat.id) : [...current, seat];
      setPassengers((people) => {
        const copy = [...people];
        while (copy.length < next.length) copy.push({ name: '', identity_number: '' });
        return copy.slice(0, next.length);
      });
      return next;
    });
  }

  function goToPassengers() {
    if (selectedSeats.length === 0) {
      setFormError('Pilih minimal satu kursi terlebih dahulu.');
      return;
    }
    setFormError(null);
    setStep(2);
  }

  function goToReview() {
    const invalid = passengers.findIndex((p) => p.name.trim().length < 2);
    if (invalid !== -1) {
      setFormError(`Nama penumpang untuk kursi ${selectedSeats[invalid]?.seat_number ?? invalid + 1} wajib diisi (minimal 2 huruf).`);
      return;
    }
    setFormError(null);
    setStep(3);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Pesan Perjalanan" description="Cari jadwal, pilih kursi, isi data penumpang, dan bayar — semuanya terhubung langsung ke sistem." />

      {/* Stepper */}
      <ol className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/90 p-3 dark:border-slate-800 dark:bg-slate-900/90" aria-label="Langkah pemesanan">
        {STEPS.map((label, index) => {
          const state = index < step ? 'done' : index === step ? 'active' : 'todo';
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={clsx(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-extrabold transition',
                  state === 'done' && 'bg-emerald-500 text-white',
                  state === 'active' && 'bg-primary text-white shadow-md',
                  state === 'todo' && 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                )}
                aria-hidden="true"
              >
                {state === 'done' ? <Check size={14} /> : index + 1}
              </span>
              <span className={clsx('truncate text-xs font-extrabold sm:text-sm', state === 'active' ? 'text-slate-950 dark:text-white' : 'text-slate-400')}>{label}</span>
              {index < STEPS.length - 1 ? <span className="mx-1 hidden h-px flex-1 bg-slate-200 dark:bg-slate-800 sm:block" aria-hidden="true" /> : null}
            </li>
          );
        })}
      </ol>

      {formError ? (
        <p role="alert" className="rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900">
          {formError}
        </p>
      ) : null}

      {/* STEP 0 — Search & schedule list */}
      {step === 0 ? (
        <div className="space-y-6">
          <AppCard>
            <SectionHeader title="Cari jadwal" description="Filter berdasarkan kota asal, tujuan, dan tanggal keberangkatan." />
            <form
              className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                setSearchSubmitted(true);
                schedulesQuery.refetch();
              }}
            >
              <Field label="Kota asal" icon={<MapPin size={15} />}>
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputClass} aria-label="Kota asal">
                  <option value="">Semua kota asal</option>
                  {origins.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </Field>
              <Field label="Kota tujuan" icon={<MapPin size={15} />}>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass} aria-label="Kota tujuan">
                  <option value="">Semua tujuan</option>
                  {destinations.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tanggal" icon={<CalendarDays size={15} />}>
                <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} aria-label="Tanggal keberangkatan" />
              </Field>
              <button type="submit" className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep">
                <Search size={16} /> Cari
              </button>
            </form>
          </AppCard>

          {!searchSubmitted ? (
            <EmptyState title="Mulai pencarian" description="Pilih kota asal, tujuan, dan tanggal untuk melihat jadwal yang tersedia." />
          ) : schedulesQuery.isLoading ? (
            <div className="space-y-3"><Skeleton /><Skeleton /><Skeleton /></div>
          ) : schedulesQuery.isError ? (
            <AppCard>
              <SectionHeader title="Gagal memuat jadwal" description={extractApiError(schedulesQuery.error, 'Terjadi kesalahan saat memuat jadwal.')} />
              <button onClick={() => schedulesQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-button text-white"><RefreshCw size={14} /> Coba lagi</button>
            </AppCard>
          ) : (schedulesQuery.data?.length ?? 0) === 0 ? (
            <EmptyState title="Jadwal tidak ditemukan" description="Coba ubah tanggal atau rute pencarian. Jadwal baru ditambahkan oleh admin secara berkala." />
          ) : (
            <ul className="space-y-3">
              {schedulesQuery.data!.map((item) => (
                <li key={item.uuid}>
                  <button
                    type="button"
                    onClick={() => pickSchedule(item)}
                    disabled={item.seats_available === 0}
                    className="group w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-display text-lg font-medium text-slate-950 dark:text-white">
                          {item.route?.origin} <ArrowRight size={16} className="text-primary" aria-hidden="true" /> {item.route?.destination}
                          <span className="rounded-md bg-cloud px-2.5 py-1 text-[11px] font-semibold uppercase tracking-button text-graphite dark:bg-ink-soft dark:text-slate-300">{item.route?.code}</span>
                        </p>
                        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5"><Clock size={14} /> {formatTime(item.departure_at)} – {formatTime(item.arrival_at)}</span>
                          <span className="inline-flex items-center gap-1.5"><BusFront size={14} /> {item.vehicle?.brand} · {item.vehicle?.code}</span>
                          <span className="inline-flex items-center gap-1.5"><Users size={14} /> {item.seats_available} kursi tersisa</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-left sm:text-right">
                        <p className="font-display text-xl font-medium text-primary">{formatIDR(item.base_fare)}</p>
                        <p className="text-xs font-bold text-slate-400">per kursi</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-primary opacity-0 transition group-hover:opacity-100">
                          Pilih jadwal <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* STEP 1 — Seat selection */}
      {step === 1 && schedule ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <AppCard>
            <SectionHeader title="Pilih kursi" description="Denah kursi diperbarui otomatis setiap 15 detik dari data ketersediaan live." />
            <div className="mt-6">
              {seatsQuery.isLoading ? (
                <Skeleton className="h-72" />
              ) : seatsQuery.isError ? (
                <EmptyState title="Gagal memuat denah kursi" description={extractApiError(seatsQuery.error, 'Silakan coba lagi.')} />
              ) : (
                <SeatMap
                  seats={seatsQuery.data?.seats ?? []}
                  layout={seatsQuery.data?.layout ?? null}
                  selected={selectedSeats.map((s) => s.id)}
                  onToggle={toggleSeat}
                />
              )}
            </div>
          </AppCard>
          <SummaryPanel schedule={schedule} seats={selectedSeats} total={totalAmount}>
            <div className="flex gap-2">
              <BackButton onClick={() => setStep(0)} />
              <button type="button" onClick={goToPassengers} disabled={selectedSeats.length === 0} className={primaryButton}>
                Lanjut <ArrowRight size={15} />
              </button>
            </div>
          </SummaryPanel>
        </div>
      ) : null}

      {/* STEP 2 — Passengers */}
      {step === 2 && schedule ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <AppCard>
            <SectionHeader title="Data penumpang" description={`Isi nama penumpang untuk ${selectedSeats.length} kursi terpilih. Nomor identitas bersifat opsional.`} />
            <div className="mt-6 space-y-4">
              {selectedSeats.map((seat, index) => (
                <fieldset key={seat.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <legend className="px-2 text-xs font-extrabold uppercase tracking-buttonst text-primary">Kursi {seat.seat_number}</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Nama lengkap</span>
                      <input
                        required
                        value={passengers[index]?.name ?? ''}
                        onChange={(e) => setPassengers((people) => people.map((p, i) => (i === index ? { ...p, name: e.target.value } : p)))}
                        placeholder="Nama sesuai identitas"
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">Nomor identitas <span className="font-medium text-slate-400">(opsional)</span></span>
                      <input
                        value={passengers[index]?.identity_number ?? ''}
                        onChange={(e) => setPassengers((people) => people.map((p, i) => (i === index ? { ...p, identity_number: e.target.value } : p)))}
                        placeholder="NIK / Paspor"
                        className={inputClass}
                      />
                    </label>
                  </div>
                </fieldset>
              ))}
            </div>

            {/* #6 Pickup & drop points (maps) + direction */}
            <div className="mt-6 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Titik Jemput & Turun</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Gunakan lokasi saat ini, pilih titik pada peta, atau cari alamat. Pastikan sesuai arah perjalanan.</p>
              <div className="mt-3 flex gap-2">
                {(['berangkat', 'pulang'] as const).map((d) => (
                  <button key={d} type="button" onClick={() => setDirection(d)} className={`min-h-10 rounded-xl px-4 text-xs font-extrabold capitalize transition ${direction === d ? 'bg-primary text-white' : 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}>Arus {d}</button>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PickupPicker title="📍 Titik jemput" value={pickup} onChange={setPickup} accent="pickup" />
                <PickupPicker title="🏁 Titik turun" value={drop} onChange={setDrop} accent="drop" />
              </div>
              <input value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} maxLength={500} placeholder="Catatan untuk driver (opsional) — patokan rumah, warna pagar, dsb." className={`${fieldInput} mt-3`} aria-label="Catatan untuk driver" />
            </div>

            {/* #7 Promo code */}
            <div className="mt-4 rounded-md border border-slate-200 p-5 dark:border-slate-800">
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Kode Promo</p>
              <div className="mt-3 flex gap-2">
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Contoh: WELCOME" className={fieldInput} />
                <button type="button" onClick={applyPromo} className="min-h-11 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep">Pakai</button>
              </div>
              {promoMsg ? <p className={`mt-2 text-xs font-bold ${promoDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{promoMsg}</p> : null}
            </div>
          </AppCard>
          <SummaryPanel schedule={schedule} seats={selectedSeats} total={totalAmount}>
            <div className="flex gap-2">
              <BackButton onClick={() => setStep(1)} />
              <button type="button" onClick={goToReview} className={primaryButton}>
                Review <ArrowRight size={15} />
              </button>
            </div>
          </SummaryPanel>
        </div>
      ) : null}

      {/* STEP 3 — Review & confirm */}
      {step === 3 && schedule ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <AppCard>
            <SectionHeader title="Konfirmasi pemesanan" description="Periksa kembali detail perjalanan. Setelah dikonfirmasi, kursi akan dikunci dan kamu diarahkan ke pembayaran." />
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <ReviewItem label="Rute" value={`${schedule.route?.origin} → ${schedule.route?.destination}`} />
              <ReviewItem label="Keberangkatan" value={`${formatTime(schedule.departure_at)} · ${new Date(schedule.departure_at).toLocaleDateString('id-ID', { dateStyle: 'full' })}`} />
              <ReviewItem label="Armada" value={`${schedule.vehicle?.brand ?? '—'} (${schedule.vehicle?.code ?? '—'})`} />
              <ReviewItem label="Kursi" value={selectedSeats.map((s) => s.seat_number).join(', ')} />
            </dl>
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-button text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr><th className="px-4 py-3 font-extrabold">Penumpang</th><th className="px-4 py-3 font-extrabold">Kursi</th><th className="px-4 py-3 text-right font-extrabold">Tarif</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedSeats.map((seat, index) => (
                    <tr key={seat.id}>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{passengers[index]?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{seat.seat_number}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">{formatIDR(schedule.base_fare)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AppCard>
          <SummaryPanel schedule={schedule} seats={selectedSeats} total={totalAmount}>
            <LegalConsent id="accept-policies" checked={acceptedPolicies} onChange={setAcceptedPolicies} describedBy="consent-help">
              Saya menyetujui <LegalLink href="/terms-and-conditions">Syarat &amp; Ketentuan</LegalLink>,{' '}
              <LegalLink href="/privacy-policy">Kebijakan Privasi</LegalLink>, dan{' '}
              <LegalLink href="/refund-policy">Kebijakan Refund</LegalLink>.
            </LegalConsent>
            <p id="consent-help" className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              Persetujuan diperlukan sebelum melanjutkan ke pembayaran.
            </p>
            <div className="mt-3 flex gap-2">
              <BackButton onClick={() => setStep(2)} disabled={bookingMutation.isPending} />
              <button type="button" onClick={() => bookingMutation.mutate()} disabled={bookingMutation.isPending || !acceptedPolicies} className={primaryButton}>
                {bookingMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Ticket size={15} />}
                {bookingMutation.isPending ? 'Memproses…' : 'Konfirmasi & bayar'}
              </button>
            </div>
          </SummaryPanel>
        </div>
      ) : null}
    </div>
  );
}

const inputClass =
  'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';

const fieldInput =
  'min-h-11 w-full rounded-md border border-steel bg-canvas px-4 text-sm text-ink outline-none transition-colors placeholder:text-graphite focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100';
const primaryButton =
  'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:cursor-not-allowed disabled:opacity-60';

function BackButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-primary hover:text-primary disabled:opacity-50 dark:border-slate-800 dark:text-slate-200">
      <ArrowLeft size={15} /> Kembali
    </button>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">{icon} {label}</span>
      {children}
    </label>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-950/60">
      <dt className="text-xs font-extrabold uppercase tracking-buttonst text-slate-400">{label}</dt>
      <dd className="mt-1 font-bold text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function SummaryPanel({ schedule, seats, total, children }: { schedule: CatalogSchedule; seats: CatalogSeat[]; total: number; children: React.ReactNode }) {
  return (
    <AppCard className="h-fit lg:sticky lg:top-24">
      <SectionHeader title="Ringkasan" />
      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex justify-between gap-3"><dt className="font-semibold text-slate-500">Rute</dt><dd className="text-right font-bold text-slate-900 dark:text-slate-100">{schedule.route?.origin} → {schedule.route?.destination}</dd></div>
        <div className="flex justify-between gap-3"><dt className="font-semibold text-slate-500">Berangkat</dt><dd className="text-right font-bold text-slate-900 dark:text-slate-100">{formatTime(schedule.departure_at)}</dd></div>
        <div className="flex justify-between gap-3"><dt className="font-semibold text-slate-500">Kursi</dt><dd className="text-right font-bold text-slate-900 dark:text-slate-100">{seats.length ? seats.map((s) => s.seat_number).join(', ') : '—'}</dd></div>
        <div className="flex justify-between gap-3 border-t border-dashed border-slate-200 pt-3 dark:border-slate-800"><dt className="font-extrabold text-slate-700 dark:text-slate-200">Total</dt><dd className="text-right font-display text-xl font-medium text-primary">{formatIDR(total)}</dd></div>
      </dl>
      <div className="mt-6">{children}</div>
    </AppCard>
  );
}
