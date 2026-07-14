'use client';

import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error' | 'info';
type ToastItem = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toneStyles: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200',
  error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-200',
  info: 'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
};

const toneIcons: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
  error: <AlertTriangle size={18} className="shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />,
  info: <Info size={18} className="shrink-0 text-primary" aria-hidden="true" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = ++counter.current;
      setItems((current) => [...current.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={clsx('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg shadow-slate-900/10 backdrop-blur', toneStyles[item.tone])}
          >
            {toneIcons[item.tone]}
            <span className="min-w-0 flex-1 leading-5">{item.message}</span>
            <button type="button" aria-label="Tutup notifikasi" onClick={() => dismiss(item.id)} className="rounded-full p-1 opacity-60 transition hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
