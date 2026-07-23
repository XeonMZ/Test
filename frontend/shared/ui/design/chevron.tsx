import { clsx } from 'clsx';

/**
 * The blue chevron pair — DESIGN.md § Decorative Depth.
 *
 * Two angular `primary` slashes with zero radius and no shadow, echoing the
 * wordmark's parallel strokes at architectural scale. They flank hero cards
 * on the left and right edges. Treated as a brand artifact: never recoloured,
 * never rounded, never shadowed.
 */
export function Chevrons({
  side = 'left',
  className,
  size = 'lg',
}: {
  side?: 'left' | 'right';
  className?: string;
  /** lg = hero flank, sm = inline section marker */
  size?: 'lg' | 'sm';
}) {
  const bar = size === 'lg' ? 'h-full w-6 sm:w-9' : 'h-8 w-3';

  return (
    <div
      aria-hidden="true"
      className={clsx('pointer-events-none flex select-none gap-2', side === 'right' && 'flex-row-reverse', className)}
    >
      <span className={clsx('sjt-chevron', bar)} />
      <span className={clsx('sjt-chevron', bar, size === 'lg' && 'opacity-70')} />
    </div>
  );
}

/**
 * Small inline chevron used as a section-eyebrow marker, keeping the brand
 * gesture present in dense UI where the full hero flank would not fit.
 */
export function ChevronMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={clsx('inline-flex shrink-0 gap-1', className)}>
      <span className="sjt-chevron h-4 w-1.5" />
      <span className="sjt-chevron h-4 w-1.5 opacity-70" />
    </span>
  );
}
