'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { fetchPublicSettings } from '@/services/stms';

/**
 * Welcome modal for the public site.
 *
 * Shown once per browser session, which is the behaviour that was asked for:
 * close it and it stays closed while you browse, but it greets you again the
 * next time you open the browser.
 *
 * That distinction is entirely about which storage is used:
 *
 *   localStorage   — survives browser restarts. Dismissed once, gone forever.
 *   sessionStorage — cleared when the tab/browser session ends. Back next visit.
 *
 * sessionStorage is the correct one here. It is also per-tab, so a second tab
 * in the same session shows it again; that is the standard trade-off and is
 * preferable to the alternative of never showing it again at all.
 *
 * Note this is the pop-up, not the welcome NOTIFICATION — the inbox entry
 * created at registration lives under separate settings and is untouched by
 * anything here.
 */
const SESSION_KEY = 'sjt:welcome-popup-seen';

export function WelcomePopup() {
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: fetchPublicSettings,
    staleTime: 5 * 60_000,
  });

  const enabled = isTruthy(data?.welcome_popup_enabled);
  const title = str(data?.welcome_popup_title);
  const body = str(data?.welcome_popup_body) || str(data?.welcome_notice);
  const image = str(data?.welcome_popup_image);

  useEffect(() => {
    if (!enabled) return;
    // Nothing to show is not the same as disabled — an operator who enables
    // the pop-up but leaves every field blank should get no empty box.
    if (title === '' && body === '' && image === '') return;

    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === '1') return;
    } catch {
      // Private mode / storage blocked: fail open and just show it. A greeting
      // shown twice is a far smaller problem than a crashed render.
    }

    // Let the page paint first; a modal that beats the content on screen
    // reads as an ad rather than a greeting.
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, [enabled, title, body, image]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    setOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // Storage unavailable — it will simply appear again. Acceptable.
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-900/60 p-4"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {image ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="h-36 w-full object-cover" />
            <button
              type="button"
              onClick={dismiss}
              aria-label="Tutup"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
            >
              <X size={16} />
            </button>
          </div>
        ) : null}

        <div className="p-6">
          {!image ? (
            <button
              type="button"
              onClick={dismiss}
              aria-label="Tutup"
              className="float-right -mr-2 -mt-2 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          ) : null}

          {title ? (
            <h2 id="welcome-popup-title" className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
          ) : null}

          {body ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {body}
            </p>
          ) : null}

          <button
            type="button"
            onClick={dismiss}
            className="mt-5 min-h-11 w-full rounded-md bg-primary text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Settings arrive as strings ('1', 'true') or real booleans depending on how they were saved. */
function isTruthy(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'ya', 'on', 'aktif'].includes(value.trim().toLowerCase());
}
