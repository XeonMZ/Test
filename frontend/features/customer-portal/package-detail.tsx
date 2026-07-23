'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, MapPin, Star, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  extractApiError,
  fetchPackageRatings,
  fetchRatableBookings,
  formatIDR,
  submitPackageRating,
  type RatableBooking,
} from '@/services/stms';
import type { TourPackageRow } from '@/services/portal';
import { useToast } from '@/shared/providers/toast-provider';
import { Badge, Skeleton } from '@/shared/ui/components';

/** Read-only star row. `value` may be fractional (an average). */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={clsx(
            // Half-stars would need clipping; rounding to the nearest whole
            // star is honest enough beside the printed numeric average.
            value >= n - 0.25 ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
          )}
        />
      ))}
    </span>
  );
}

/**
 * Full package detail, opened from a card in the rail.
 *
 * Everything shown here is CMS-authored: description, itinerary, facilities
 * and gallery all come from the tour_packages row, so an editor can enrich a
 * package without a deploy. Ratings are fetched separately and lazily — a
 * visitor browsing the rail should not pay for review queries on packages
 * they never open.
 */
export function PackageDetailModal({
  pkg,
  onClose,
  onBook,
}: {
  pkg: TourPackageRow;
  onClose: () => void;
  onBook: (p: TourPackageRow) => void;
}) {
  const ratings = useQuery({
    queryKey: ['package-ratings', pkg.slug],
    queryFn: () => fetchPackageRatings(pkg.slug),
    staleTime: 60_000,
  });

  // Escape closes; body scroll is locked so the page behind doesn't move.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const gallery = Array.isArray(pkg.gallery) ? pkg.gallery.filter(Boolean) : [];
  const itinerary = Array.isArray(pkg.itinerary) ? pkg.itinerary : [];
  const facilities = Array.isArray(pkg.facilities) ? pkg.facilities : [];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={pkg.name}
    >
      <div
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {pkg.cover_path ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pkg.cover_path} alt={pkg.name} className="h-44 w-full object-cover sm:h-56" />
          ) : (
            <div className="h-44 w-full bg-gradient-to-br from-primary/25 to-primary/5 sm:h-56" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
          >
            <X size={18} />
          </button>
          {pkg.badge ? (
            <span className="absolute left-3 top-3 rounded-xl bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-button text-white shadow">
              {pkg.badge}
            </span>
          ) : null}
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{pkg.name}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {pkg.destination ?? 'Berbagai destinasi'}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays size={12} /> {pkg.duration_days} hari
              </span>
              {pkg.capacity > 0 ? (
                <>
                  <span>·</span>
                  <span>{pkg.capacity} pax</span>
                </>
              ) : null}
            </p>

            {ratings.data && ratings.data.total > 0 ? (
              <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <Stars value={ratings.data.average} />
                {ratings.data.average.toFixed(1)}
                <span className="font-semibold text-slate-400">({ratings.data.total} ulasan)</span>
              </p>
            ) : null}
          </div>

          {pkg.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {pkg.description}
            </p>
          ) : null}

          {facilities.length > 0 ? (
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-button text-slate-400">Fasilitas</h3>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {facilities.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    {String(f)}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {itinerary.length > 0 ? (
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-button text-slate-400">Itinerary</h3>
              <ol className="mt-2 space-y-2">
                {itinerary.map((raw, i) => {
                  const step = raw as { day?: number; title?: string; detail?: string };
                  return (
                    <li key={i} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        Hari {step.day ?? i + 1}
                        {step.title ? ` — ${step.title}` : ''}
                      </p>
                      {step.detail ? (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{step.detail}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : null}

          {gallery.length > 0 ? (
            <section>
              <h3 className="text-xs font-extrabold uppercase tracking-button text-slate-400">Galeri</h3>
              <div className="scrollbar-none mt-2 flex gap-2 overflow-x-auto">
                {gallery.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={String(src)}
                    alt={`${pkg.name} ${i + 1}`}
                    loading="lazy"
                    className="h-24 w-36 shrink-0 rounded-xl object-cover"
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h3 className="text-xs font-extrabold uppercase tracking-button text-slate-400">Ulasan pelanggan</h3>
            {ratings.isLoading ? (
              <Skeleton className="mt-2 h-16" />
            ) : !ratings.data || ratings.data.total === 0 ? (
              <p className="mt-2 text-sm text-slate-400">
                Belum ada ulasan. Ulasan hanya bisa ditulis pelanggan yang sudah mengikuti paket ini.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {ratings.data.reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{r.name}</p>
                      <Stars value={r.stars} size={12} />
                    </div>
                    {r.comment ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.comment}</p>
                    ) : null}
                    {r.created_at ? <p className="mt-1 text-[10px] text-slate-400">{r.created_at}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-button text-slate-400">Mulai dari</p>
              <p className="text-lg font-extrabold text-primary">{formatIDR(pkg.price)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onBook(pkg);
              }}
              className="min-h-11 rounded-md bg-primary px-6 text-xs font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep"
            >
              Pesan Paket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Prompts the customer to rate trips they have actually travelled on.
 *
 * The list comes from the server's eligibility endpoint rather than being
 * derived here from booking status: the rule ("completed, or paid with the
 * travel date passed") is enforced on store() anyway, and duplicating it in
 * the client is how the two versions drift apart.
 */
export function RatePackagesCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<RatableBooking | null>(null);
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');

  const eligible = useQuery({ queryKey: ['ratable-bookings'], queryFn: fetchRatableBookings });

  const mutation = useMutation({
    mutationFn: () =>
      submitPackageRating({
        package_booking_id: active!.id,
        stars,
        comment: comment.trim() || undefined,
      }),
    onSuccess: (res) => {
      toast(res.message || 'Terima kasih atas penilaian Anda.', 'success');
      setActive(null);
      setComment('');
      setStars(5);
      queryClient.invalidateQueries({ queryKey: ['ratable-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['package-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-packages'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal mengirim rating.'), 'error'),
  });

  const items = eligible.data ?? [];
  if (eligible.isLoading || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-950/25">
      <p className="text-sm font-extrabold text-amber-900 dark:text-amber-200">Beri rating perjalananmu</p>
      <p className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300/80">
        Kamu sudah mengikuti paket berikut. Bagikan pengalamanmu untuk membantu pelanggan lain.
      </p>

      <ul className="mt-3 space-y-2">
        {items.map((b) => (
          <li key={b.id} className="rounded-xl bg-white/70 p-3 dark:bg-slate-900/50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {b.package?.name ?? b.code}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">
                  {b.travel_date} · <Badge tone="neutral">{b.code}</Badge>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(active?.id === b.id ? null : b)}
                className="min-h-9 shrink-0 rounded-xl bg-amber-500 px-3 text-xs font-extrabold text-white transition hover:bg-amber-600"
              >
                {active?.id === b.id ? 'Tutup' : 'Beri rating'}
              </button>
            </div>

            {active?.id === b.id ? (
              <div className="mt-3 border-t border-amber-200/60 pt-3 dark:border-amber-500/20">
                <div className="flex items-center gap-1" role="radiogroup" aria-label="Jumlah bintang">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={stars === n}
                      aria-label={`${n} bintang`}
                      onClick={() => setStars(n)}
                      className="p-0.5"
                    >
                      <Star
                        size={24}
                        className={clsx(
                          'transition',
                          n <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600',
                        )}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  placeholder="Ceritakan pengalamanmu (opsional)"
                  className="mt-2 w-full rounded-md border border-steel bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-primary dark:border-ink-soft dark:bg-ink dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="mt-2 min-h-10 rounded-md bg-primary px-5 text-xs font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60"
                >
                  {mutation.isPending ? 'Mengirim…' : 'Kirim rating'}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
