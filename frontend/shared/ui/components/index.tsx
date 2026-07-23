'use client';

import { clsx } from 'clsx';
import { Loader2, Plus, Search, WifiOff, X } from 'lucide-react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { ChevronMark } from '@/shared/ui/design/chevron';

/**
 * Shared UI primitives — the DESIGN.md vocabulary every screen composes from.
 *
 * Rules encoded here so individual pages don't have to restate them:
 *   · Cards are soft (16px) white paper carrying Soft Lift on a cloud band.
 *   · Interactive elements are sharp (4px), uppercase, 44px tall.
 *   · Type: display sizes run at weight 500; micro-labels are uppercase 0.7px.
 *   · Transitions change colour only — nothing lifts, scales, or glows.
 *   · Blue is a signal (one CTA, one accent), never a decorative wash.
 */

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas dark:focus-visible:ring-offset-ink-deep';

/** White paper + Soft Lift. Cards float on the cloud band; no border needed. */
const paper = 'bg-canvas text-ink shadow-soft transition-colors duration-200 dark:bg-ink dark:text-white';
/** Micro-label: the uppercase 0.7px voice used for eyebrows and table heads. */
const micro = 'text-xs font-semibold uppercase tracking-button';

export function AppCard({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={clsx('rounded-2xl p-5 sm:p-6', paper, className)} {...props} />;
}

export function StatsCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <AppCard className="relative overflow-hidden">
      {/* Solid primary rule — the "featured tier" gesture, no gradient. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <p className={clsx(micro, 'text-graphite dark:text-slate-400')}>{label}</p>
      <p className="mt-3 font-display text-3xl font-medium tracking-tight text-ink dark:text-white sm:text-4xl">{value}</p>
      {helper ? <p className="mt-2 max-w-prose text-sm leading-relaxed text-graphite dark:text-slate-400">{helper}</p> : null}
    </AppCard>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 border-b border-hairline pb-6 md:flex-row md:items-end md:justify-between dark:border-ink-soft">
      <div className="min-w-0">
        <p className={clsx('mb-3 flex items-center gap-2 text-primary', micro)}><ChevronMark /> SJT</p>
        <h1 className="font-display text-3xl font-medium leading-none tracking-tight text-ink dark:text-white sm:text-5xl">{title}</h1>
        {description ? <p className="mt-4 max-w-3xl text-sm leading-relaxed text-charcoal dark:text-slate-300 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-1.5">
      <h2 className="font-display text-lg font-medium tracking-tight text-ink dark:text-white sm:text-2xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm leading-relaxed text-graphite dark:text-slate-400">{description}</p> : null}
    </div>
  );
}

export function SearchBar({ placeholder = 'Cari di SJT...', className }: { placeholder?: string; className?: string }) {
  return (
    <label
      className={clsx(
        'group flex h-11 w-full items-center gap-3 rounded-md border border-steel bg-canvas px-4 text-sm transition-colors focus-within:border-primary dark:border-ink-soft dark:bg-ink sm:w-72',
        className,
      )}
    >
      <Search size={18} aria-hidden="true" className="shrink-0 text-graphite transition-colors group-focus-within:text-primary" />
      <span className="sr-only">{placeholder}</span>
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-ink outline-none placeholder:text-graphite dark:text-slate-100"
      />
    </label>
  );
}

export function FilterBar({ children }: { children?: ReactNode }) {
  return (
    <div className={clsx('flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:flex-wrap sm:items-center', paper)}>
      {children ?? <span className="px-1 text-sm text-graphite">Filter siap digunakan</span>}
    </div>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows?: Array<Array<ReactNode>> }) {
  const hasRows = Boolean(rows?.length);
  return (
    <div className={clsx('overflow-hidden rounded-2xl', paper)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-hairline bg-cloud dark:border-ink-soft dark:bg-ink-soft">
            <tr>
              {columns.map((c) => (
                <th key={c} scope="col" className={clsx('whitespace-nowrap px-4 py-3.5 text-graphite sm:px-5', micro)}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline dark:divide-ink-soft">
            {hasRows ? (
              rows?.map((row, i) => (
                <tr key={i} className="transition-colors hover:bg-cloud dark:hover:bg-ink-soft">
                  {row.map((cell, j) => (
                    <td key={j} className="whitespace-nowrap px-4 py-4 text-charcoal dark:text-slate-300 sm:px-5">{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-graphite">Tidak ada data pada tampilan ini.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Status tag — sharp 4px and uppercase, matching the interactive language. */
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const tones = {
    neutral: 'bg-cloud text-charcoal dark:bg-ink-soft dark:text-slate-200',
    success: 'bg-storm-mist/25 text-storm-deep dark:bg-storm-deep/30 dark:text-storm-mist',
    warning: 'bg-bloom-rose text-bloom-deep dark:bg-bloom-deep/30 dark:text-bloom-rose',
    danger: 'bg-bloom-rose text-bloom-wine dark:bg-bloom-wine/40 dark:text-bloom-rose',
  };
  return <span className={clsx('inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-button', tones[tone])}>{children}</span>;
}

export function Timeline({ items = ['Requested', 'Assigned', 'On trip', 'Completed'] }: { items?: string[] }) {
  return (
    <ol className="space-y-1" aria-label="Timeline">
      {items.map((item, i) => (
        <li key={item} className="flex gap-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-white">{i + 1}</span>
          <span className="pt-1 text-sm font-medium text-charcoal dark:text-slate-200">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function Drawer({ open, children }: { open?: boolean; children: ReactNode }) {
  return open ? (
    <aside
      role="dialog"
      aria-modal="true"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-hairline bg-canvas p-6 shadow-float transition-transform duration-200 dark:border-ink-soft dark:bg-ink"
    >
      {children}
    </aside>
  ) : null;
}

export function Modal({ open, title, children }: { open?: boolean; title: string; children: ReactNode }) {
  return open ? (
    <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4">
      <AppCard role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-float">
        <div className="flex items-start justify-between gap-4">
          <h2 id="modal-title" className="font-display text-xl font-medium tracking-tight text-ink dark:text-white">{title}</h2>
          <button
            type="button"
            aria-label="Tutup dialog"
            className={clsx('grid h-9 w-9 place-items-center rounded-md text-graphite transition-colors hover:bg-cloud hover:text-ink dark:hover:bg-ink-soft dark:hover:text-white', focusRing)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </AppCard>
    </div>
  ) : null;
}

export function ConfirmDialog(props: { open?: boolean; title?: string }) {
  return (
    <Modal open={props.open} title={props.title ?? 'Konfirmasi tindakan'}>
      <p className="text-sm leading-relaxed text-graphite dark:text-slate-400">
        Periksa detail sebelum melanjutkan. Pola konfirmasi ini menjaga tindakan destruktif tetap disengaja dan dapat diakses keyboard.
      </p>
    </Modal>
  );
}

export function Toast({ message }: { message?: string }) {
  return message ? (
    <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-lg bg-ink px-4 py-3 text-sm font-medium text-white shadow-float dark:bg-canvas dark:text-ink">
      {message}
    </div>
  ) : null;
}

export function Loading() {
  return (
    <div role="status" aria-live="polite" className={clsx('flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-dashed border-steel p-8 text-graphite dark:border-ink-soft', micro)}>
      <Loader2 className="animate-spin text-primary" size={18} aria-hidden="true" /> Memuat konten
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        'relative h-24 overflow-hidden rounded-2xl bg-fog after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent dark:bg-ink-soft dark:after:via-white/10',
        className,
      )}
    />
  );
}

export function EmptyState({ title = 'Belum ada data', description = 'Konten akan muncul di sini ketika tersedia.' }) {
  return (
    <AppCard className="grid place-items-center px-6 py-14 text-center">
      <ChevronMark className="scale-150" />
      <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-ink dark:text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-graphite dark:text-slate-400">{description}</p>
    </AppCard>
  );
}

export function OfflineState() {
  return (
    <div role="status" className={clsx('flex items-center gap-2 rounded-lg bg-bloom-rose px-4 py-3 text-bloom-wine dark:bg-bloom-wine/40 dark:text-bloom-rose', micro)}>
      <WifiOff size={16} aria-hidden="true" /> Anda sedang offline
    </div>
  );
}

export function ReconnectState() {
  return (
    <div role="status" className={clsx('rounded-lg bg-bloom-rose px-4 py-3 text-bloom-deep dark:bg-bloom-deep/30 dark:text-bloom-rose', micro)}>
      Menyambungkan ulang layanan realtime...
    </div>
  );
}

export function ActionButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition-colors duration-150 hover:bg-primary-deep disabled:cursor-not-allowed disabled:bg-steel',
        focusRing,
        className,
      )}
      {...props}
    />
  );
}

export function FloatingButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      aria-label="Buat baru"
      className={clsx('fixed bottom-20 right-5 z-40 grid h-14 w-14 place-items-center rounded-md bg-primary text-white shadow-float transition-colors hover:bg-primary-deep md:hidden', focusRing)}
      {...props}
    >
      <Plus aria-hidden="true" />
    </button>
  );
}
