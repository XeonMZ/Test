'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Consent checkbox used on registration and checkout.
 *
 * The caller owns the state and is responsible for blocking submission while
 * `checked` is false — this component only renders the control and its links.
 * Links open in a new tab so a half-filled form is never lost.
 */
export function LegalConsent({
  id,
  checked,
  onChange,
  children,
  describedBy,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  describedBy?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-hairline bg-cloud p-4 dark:border-ink-soft dark:bg-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby={describedBy}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-primary accent-primary focus:ring-2 focus:ring-primary/30 dark:border-slate-700"
      />
      <label htmlFor={id} className="cursor-pointer text-sm font-semibold leading-6 text-slate-600 dark:text-slate-300">
        {children}
      </label>
    </div>
  );
}

/** Inline link to a legal page, styled for use inside consent copy. */
export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-extrabold text-primary underline-offset-2 hover:underline"
    >
      {children}
    </Link>
  );
}
