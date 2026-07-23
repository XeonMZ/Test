'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchRecommendations, type Recommendation } from '@/services/stms';
import { AppCard, SectionHeader, Skeleton } from '@/shared/ui/components';

/**
 * Horizontal recommendation rail: two cards visible, swipeable left/right.
 *
 * Two columns is a layout constraint, not a data one — the CMS can hold any
 * number of cards and the rail pages through them. Width comes from
 * `basis-1/2` on the items rather than a fixed pixel size, so "two visible"
 * survives every phone width without a media query per device.
 *
 * The whole section renders nothing at all when the CMS has no published
 * recommendation cards: an empty state here would be a permanent apology on
 * the dashboard of a site that simply chose not to use the feature.
 */
export function RecommendationRail() {
  const query = useQuery({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
    // Editorial content, not live data — don't refetch on every focus.
    staleTime: 5 * 60 * 1000,
  });

  const scroller = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncArrows = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // 1px slack: sub-pixel layout means scrollLeft rarely hits the exact max.
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    // Cards reflow on rotate/resize, which changes what "the end" means.
    window.addEventListener('resize', syncArrows);
    return () => {
      el.removeEventListener('scroll', syncArrows);
      window.removeEventListener('resize', syncArrows);
    };
  }, [syncArrows, query.data]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    // Scroll by a full viewport of the rail, i.e. both visible cards.
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  if (query.isLoading) {
    return (
      <AppCard>
        <SectionHeader title="Rekomendasi untukmu" description="Pilihan perjalanan dan promo terbaru." />
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-44 basis-1/2" />
          <Skeleton className="h-44 basis-1/2" />
        </div>
      </AppCard>
    );
  }

  // A failed fetch or an empty CMS both mean: show nothing. This block is
  // decorative, and a broken decoration should not shout at the customer.
  const items = query.data ?? [];
  if (query.isError || items.length === 0) return null;

  const scrollable = items.length > 2;

  return (
    <AppCard>
      <div className="flex items-center justify-between gap-3">
        <SectionHeader title="Rekomendasi untukmu" description="Pilihan perjalanan dan promo terbaru." />
        {scrollable ? (
          <div className="flex shrink-0 gap-1.5">
            <RailButton label="Sebelumnya" disabled={atStart} onClick={() => page(-1)}>
              <ChevronLeft size={16} />
            </RailButton>
            <RailButton label="Berikutnya" disabled={atEnd} onClick={() => page(1)}>
              <ChevronRight size={16} />
            </RailButton>
          </div>
        ) : null}
      </div>

      <div
        ref={scroller}
        // snap-x keeps a swipe from stopping halfway across a card;
        // scrollbar-none hides the desktop bar without disabling the scroll.
        className="scrollbar-none mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1"
        style={{ scrollbarWidth: 'none' }}
        role="region"
        aria-label="Rekomendasi untukmu"
      >
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </AppCard>
  );
}

function RailButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-600 dark:border-slate-800 dark:text-slate-300"
    >
      {children}
    </button>
  );
}

function RecommendationCard({ item }: { item: Recommendation }) {
  const body = (
    <>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
        {item.image_path ? (
          // Plain <img>: the CMS stores arbitrary paths and remote CDN URLs,
          // which next/image would reject unless every host is whitelisted.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_path}
            alt={item.title ?? 'Rekomendasi'}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : null}
        {item.badge ? (
          <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-button text-white">
            {item.badge}
          </span>
        ) : null}
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
        {item.title ?? 'Rekomendasi'}
      </p>
      {item.body ? (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.body}</p>
      ) : null}
    </>
  );

  // basis-1/2 minus half the gap = exactly two cards per view.
  const shell = 'group w-[calc(50%-0.375rem)] shrink-0 snap-start';

  if (!item.link) {
    return <div className={shell}>{body}</div>;
  }

  // Absolute URLs leave the app; relative ones stay inside the router.
  const external = /^https?:\/\//i.test(item.link);

  return external ? (
    <a
      href={item.link}
      target="_blank"
      // noopener/noreferrer: the opened tab must not get a handle on ours.
      rel="noopener noreferrer"
      className={clsx(shell, 'rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary')}
    >
      {body}
    </a>
  ) : (
    <Link
      href={item.link}
      className={clsx(shell, 'rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary')}
    >
      {body}
    </Link>
  );
}
