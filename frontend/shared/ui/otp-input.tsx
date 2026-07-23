'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Fired when the last digit lands, so the caller can auto-submit. */
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  invalid?: boolean;
  label?: string;
};

/**
 * Six separate boxes that behave like one field.
 *
 * The whole point is that people receive these codes on the same phone they
 * are typing on, so the interaction has to survive the OS paste banner, SMS
 * autofill, backspacing mid-code and arrow-key repositioning. Each of those
 * is handled explicitly below — a plain row of maxLength=1 inputs gets all of
 * them wrong.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled = false,
  autoFocus = false,
  invalid = false,
  label = 'Kode verifikasi',
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  const handleInput = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, '');
    if (typed === '') return;

    // Multi-character input means autofill or paste landed in one box.
    const chars = value.split('');
    if (typed.length > 1) {
      const clean = commit(value.slice(0, index) + typed);
      refs.current[Math.min(clean.length, length - 1)]?.focus();
      return;
    }

    chars[index] = typed;
    const clean = commit(chars.join('').slice(0, length));
    if (index < length - 1 && clean.length > index) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const chars = value.split('');
      if (chars[index]) {
        // Clear the current box first; only step back once it's already empty.
        chars[index] = '';
        onChange(chars.join('').replace(/\s/g, ''));
      } else if (index > 0) {
        chars[index - 1] = '';
        onChange(chars.slice(0, index - 1).join(''));
        refs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const clean = commit(event.clipboardData.getData('text'));
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  };

  return (
    <div>
      <span id="otp-label" className="mb-2 block text-sm font-semibold text-ink dark:text-slate-200">
        {label}
      </span>
      <div className="flex justify-between gap-2" role="group" aria-labelledby="otp-label">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            // 'numeric' + 'one-time-code' is what triggers the OS to offer the
            // code straight from the notification.
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={length}
            disabled={disabled}
            aria-invalid={invalid}
            aria-label={`Digit ${index + 1} dari ${length}`}
            value={digit.trim()}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            className={clsx(
              'h-14 w-full rounded-lg border text-center font-mono text-xl font-extrabold outline-none transition-colors',
              'bg-canvas text-ink dark:bg-ink dark:text-slate-100',
              invalid
                ? 'border-rose-400 focus:border-rose-500 dark:border-rose-500/60'
                : 'border-steel focus:border-primary dark:border-ink-soft dark:focus:border-primary-bright',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          />
        ))}
      </div>
    </div>
  );
}
