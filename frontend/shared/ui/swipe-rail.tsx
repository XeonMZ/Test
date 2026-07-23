'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Horizontal, snap-scrolling rail.
 *
 * Shared by the dashboard recommendation rail (2 up) and the tour-package
 * rails (3 up) so the swipe behaviour, arrow enable/disable logic and
 * scrollbar handling exist in one place rather than being re-derived — and
 * subtly diverging — at each call site.
 *
 * Item width is `calc(100%/n - gap)` rather than a pixel size, so "three
 * visible" holds at every viewport without a media query per device. Callers
 * pass `perView` and get the matching child class back.
 */
export function SwipeRail({
  children,
  perView = 3,
  perViewMobile = 1,
  ariaLabel,
  header,
}: {
  children: ReactNode;
  perView?: number;
  /** Narrow screens can't usefully show three cards; default to one. */
  perViewMobile?: number;
  ariaLabel: string;
  header?: ReactNode;
}) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  const sync = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    // 1px slack: sub-pixel layout means scrollLeft rarely hits the exact max.
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
    setOverflowing(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [sync, children]);

  const page = (direction: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div>
      {header || overflowing ? (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">{header}</div>
          {overflowing ? (
            <div className="flex shrink-0 gap-1.5">
              <RailArrow label="Sebelumnya" disabled={atStart} onClick={() => page(-1)}>
                <ChevronLeft size={16} />
              </RailArrow>
              <RailArrow label="Berikutnya" disabled={atEnd} onClick={() => page(1)}>
                <ChevronRight size={16} />
              </RailArrow>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        ref={scroller}
        className="scrollbar-none mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1"
        role="region"
        aria-label={ariaLabel}
        // Expose the counts to CSS so children can size themselves without
        // every caller repeating the same calc().
        style={
          {
            '--rail-per-view': perView,
            '--rail-per-view-mobile': perViewMobile,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Width class for a SwipeRail child. Mobile shows `perViewMobile` cards,
 * `sm:` and up shows `perView`.
 */
export const railItemClass =
  'shrink-0 snap-start w-[calc((100%-(var(--rail-per-view-mobile)-1)*1rem)/var(--rail-per-view-mobile))] ' +
  'sm:w-[calc((100%-(var(--rail-per-view)-1)*1rem)/var(--rail-per-view))]';

function RailArrow({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
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

export type HeroSlide = {
  id: number;
  title?: string | null;
  body?: string | null;
  image_path?: string | null;
  link?: string | null;
  cta_label?: string | null;
};

/**
 * Swipeable hero banner.
 *
 * Additive by design — it renders wherever it is placed and does not replace
 * the existing static hero block. Auto-advances, but pauses on hover/focus and
 * stops entirely when the visitor has asked for reduced motion: a banner that
 * moves under the cursor while someone is reading it is a bug, not a feature.
 */
export function HeroSlider({ slides, className }: { slides: HeroSlide[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const scroller = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  const count = slides.length;

  const goTo = useCallback((next: number) => {
    const el = scroller.current;
    if (!el) return;
    const target = ((next % el.children.length) + el.children.length) % el.children.length;
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
    setIndex(target);
  }, []);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => goTo(index + 1), 6000);
    return () => window.clearInterval(timer);
  }, [count, paused, index, goTo]);

  // Keep the dots honest when the visitor swipes by hand.
  const onScroll = () => {
    const el = scroller.current;
    if (!el || el.clientWidth === 0) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (count === 0) return null;

  return (
    <div
      className={clsx('relative overflow-hidden rounded-2xl', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={scroller}
        onScroll={onScroll}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        role="region"
        aria-roledescription="carousel"
        aria-label="Banner utama"
      >
        {slides.map((slide, i) => (
          <HeroSlide key={slide.id} slide={slide} position={i + 1} total={count} />
        ))}
      </div>

      {count > 1 ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Ke slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={clsx(
                  'pointer-events-auto h-1.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80',
                )}
              />
            ))}
          </div>

          <SliderArrow side="left" onClick={() => goTo(index - 1)} />
          <SliderArrow side="right" onClick={() => goTo(index + 1)} />
        </>
      ) : null}
    </div>
  );
}

/**
 * Defence in depth for CMS-authored hrefs.
 *
 * The dedicated /catalog/hero-slides endpoint already strips unsafe schemes,
 * but the home page feeds this same component from /catalog/home, which
 * returns raw columns. Rather than rely on every future caller picking the
 * sanitised endpoint, the guard sits here — one place, closest to the href.
 */
function safeHref(link: string | null | undefined): string | null {
  const value = (link ?? '').trim();
  if (value === '') return null;
  // Site-relative, but never '//host' (protocol-relative escapes the origin).
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return /^https?:\/\//i.test(value) ? value : null;
}

function HeroSlide({ slide, position, total }: { slide: HeroSlide; position: number; total: number }) {
  const content = (
    <div className="relative h-full w-full">
      {slide.image_path ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.image_path}
          alt={slide.title ?? `Banner ${position}`}
          className="h-full w-full object-cover"
          // The first slide is almost always the largest-contentful paint on
          // the page; the rest can wait.
          loading={position === 1 ? 'eager' : 'lazy'}
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-primary to-primary-deep" />
      )}

      {slide.title || slide.body ? (
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-5 sm:p-8">
          {slide.title ? (
            <h2 className="max-w-xl text-lg font-extrabold leading-tight text-white sm:text-2xl">{slide.title}</h2>
          ) : null}
          {slide.body ? (
            <p className="mt-1.5 max-w-xl line-clamp-2 text-xs text-white/80 sm:text-sm">{slide.body}</p>
          ) : null}
          {safeHref(slide.link) && slide.cta_label ? (
            <span className="mt-3 inline-flex w-fit rounded-md bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-button text-slate-900">
              {slide.cta_label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  const shell = 'relative aspect-[16/9] w-full shrink-0 snap-center sm:aspect-[21/8]';
  const href = safeHref(slide.link);

  if (!href) {
    return (
      <div className={shell} role="group" aria-roledescription="slide" aria-label={`${position} dari ${total}`}>
        {content}
      </div>
    );
  }

  const external = /^https?:\/\//i.test(href);

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={shell}
      role="group"
      aria-roledescription="slide"
      aria-label={`${position} dari ${total}`}
    >
      {content}
    </a>
  );
}

function SliderArrow({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Slide sebelumnya' : 'Slide berikutnya'}
      onClick={onClick}
      className={clsx(
        'absolute top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55 sm:grid',
        side === 'left' ? 'left-3' : 'right-3',
      )}
    >
      {side === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  );
}
