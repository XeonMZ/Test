import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

/**
 * Primary CTA — DESIGN.md `button-primary`.
 * HP Electric Blue fill, 44px tall, 4px radius, uppercase 0.7px tracking.
 * Sharp interactive element against the softer 16px card surfaces.
 */
export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold uppercase tracking-button text-white transition-colors duration-150 hover:bg-primary-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-steel',
        className,
      )}
      {...props}
    />
  );
}
