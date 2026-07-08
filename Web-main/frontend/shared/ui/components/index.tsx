'use client';

import { clsx } from 'clsx';
import { Bell, Loader2, Plus, Search, WifiOff, X } from 'lucide-react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950';
const panel = 'border border-slate-200/80 bg-white/95 text-slate-950 shadow-sm shadow-slate-900/5 backdrop-blur transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-900/95 dark:text-slate-50';

export function AppCard({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={clsx('rounded-3xl p-5 sm:p-6', panel, className)} {...props} />;
}

export function StatsCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return <AppCard className="group relative overflow-hidden"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-400 to-indigo-500 opacity-80" /><p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p><p className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{value}</p>{helper ? <p className="mt-2 max-w-prose text-sm leading-6 text-slate-500 dark:text-slate-400">{helper}</p> : null}</AppCard>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className="flex flex-col gap-4 rounded-3xl border border-transparent bg-gradient-to-br from-white/70 to-slate-50/70 py-1 dark:from-slate-950/40 dark:to-slate-900/30 md:flex-row md:items-end md:justify-between"><div className="min-w-0"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">STMS</p><h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{title}</h1>{description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">{description}</p> : null}</div>{actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}</header>;
}

export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return <div className="space-y-1"><h2 className="font-display text-lg font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-xl">{title}</h2>{description ? <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p> : null}</div>;
}

export function SearchBar({ placeholder = 'Search STMS...', className }: { placeholder?: string; className?: string }) {
  return <label className={clsx('group flex min-h-11 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm transition duration-200 hover:border-primary/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 sm:w-72', className)}><Search size={18} aria-hidden="true" className="shrink-0 text-slate-400 transition group-focus-within:text-primary" /><span className="sr-only">{placeholder}</span><input aria-label={placeholder} placeholder={placeholder} className="h-11 w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100" /></label>;
}

export function FilterBar({ children }: { children?: ReactNode }) {
  return <div className={clsx('flex flex-col gap-3 rounded-3xl p-3 sm:flex-row sm:flex-wrap sm:items-center', panel)}>{children ?? <span className="px-1 text-sm font-medium text-slate-500">Filters ready</span>}</div>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows?: Array<Array<ReactNode>> }) {
  const hasRows = Boolean(rows?.length);
  return <div className={clsx('overflow-hidden rounded-3xl', panel)}><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-50/95 text-xs uppercase tracking-wide text-slate-500 backdrop-blur dark:bg-slate-900/95 dark:text-slate-400"><tr>{columns.map((c) => <th key={c} scope="col" className="whitespace-nowrap px-4 py-3 font-extrabold sm:px-5">{c}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{hasRows ? rows?.map((row, i) => <tr key={i} className="transition duration-150 hover:bg-slate-50/80 dark:hover:bg-slate-800/50">{row.map((cell, j) => <td key={j} className="whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300 sm:px-5">{cell}</td>)}</tr>) : <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">No records match the current view.</td></tr>}</tbody></table></div></div>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const tones = { neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700', success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900', warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900', danger: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900' };
  return <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset', tones[tone])}>{children}</span>;
}

export function Timeline({ items = ['Requested', 'Assigned', 'On trip', 'Completed'] }: { items?: string[] }) {
  return <ol className="space-y-1" aria-label="Timeline">{items.map((item, i) => <li key={item} className="group flex gap-3 rounded-2xl px-1 py-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-extrabold text-white shadow-sm transition group-hover:scale-105">{i + 1}</span><span className="pt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{item}</span></li>)}</ol>;
}

export function Drawer({ open, children }: { open?: boolean; children: ReactNode }) {
  return open ? <aside role="dialog" aria-modal="true" className="fixed inset-y-0 right-0 z-50 w-full max-w-sm translate-x-0 overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950">{children}</aside> : null;
}

export function Modal({ open, title, children }: { open?: boolean; title: string; children: ReactNode }) {
  return open ? <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><AppCard role="dialog" aria-modal="true" aria-labelledby="modal-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-2xl"><div className="flex items-start justify-between gap-4"><h2 id="modal-title" className="font-display text-xl font-extrabold tracking-tight">{title}</h2><button type="button" aria-label="Close dialog" className={clsx('rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200', focusRing)}><X size={18} /></button></div><div className="mt-5">{children}</div></AppCard></div> : null;
}

export function ConfirmDialog(props: { open?: boolean; title?: string }) { return <Modal open={props.open} title={props.title ?? 'Confirm action'}><p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Review the details before continuing. This confirmation pattern keeps destructive actions intentional and keyboard accessible.</p></Modal>; }
export function Toast({ message }: { message?: string }) { return message ? <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white shadow-2xl dark:bg-white dark:text-slate-950">{message}</div> : null; }
export function Loading() { return <div role="status" aria-live="polite" className="flex min-h-40 items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-200 p-8 text-sm font-extrabold text-slate-500 dark:border-slate-800"><Loader2 className="animate-spin text-primary" size={20} aria-hidden="true" /> Loading content</div>; }
export function Skeleton({ className }: { className?: string }) { return <div aria-hidden="true" className={clsx('relative h-24 overflow-hidden rounded-3xl bg-slate-200/80 after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent dark:bg-slate-800/80 dark:after:via-white/10', className)} />; }
export function EmptyState({ title = 'No records yet', description = 'Content will appear here when available.' }) { return <AppCard className="grid place-items-center px-6 py-12 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Bell aria-hidden="true" /></div><h3 className="mt-5 font-display text-xl font-extrabold tracking-tight">{title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p></AppCard>; }
export function OfflineState() { return <div role="status" className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-extrabold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900"><WifiOff size={16} aria-hidden="true" /> You are offline</div>; }
export function ReconnectState() { return <div role="status" className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-extrabold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900">Reconnecting realtime services...</div>; }
export function ActionButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={clsx('inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition duration-200 hover:-translate-y-0.5 hover:bg-primary/90 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60', focusRing, className)} {...props} />; }
export function FloatingButton(props: ButtonHTMLAttributes<HTMLButtonElement>) { return <button aria-label="Create" className={clsx('fixed bottom-20 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-white shadow-2xl shadow-primary/30 transition hover:scale-105 md:hidden', focusRing)} {...props}><Plus aria-hidden="true" /></button>; }
