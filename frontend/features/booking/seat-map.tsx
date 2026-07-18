'use client';

import { clsx } from 'clsx';
import { Armchair } from 'lucide-react';
import type { CatalogSeat } from '@/services/stms';

type SeatMapProps = {
  seats: CatalogSeat[];
  selected: number[];
  maxSelectable?: number;
  onToggle: (seat: CatalogSeat) => void;
};

/**
 * Interactive vehicle seat map. Seats are laid out in a 2-2 aisle grid,
 * derived from live availability data — never mocked.
 */
export function SeatMap({ seats, selected, maxSelectable = 6, onToggle }: SeatMapProps) {
  const rows: CatalogSeat[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
        <Legend className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900" label="Tersedia" />
        <Legend className="border-primary bg-primary text-white" label="Pilihanmu" />
        <Legend className="border-slate-200 bg-slate-200 text-slate-400 dark:border-slate-800 dark:bg-slate-800" label="Terisi" />
      </div>

      <div className="mx-auto w-full max-w-xs rounded-[2rem] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-white dark:bg-slate-800">
          <span>Depan</span>
          <span aria-hidden="true">🚌</span>
        </div>

        <div className="space-y-3" role="group" aria-label="Pilih kursi">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[1fr_1fr_0.6fr_1fr_1fr] items-center gap-2">
              {row.map((seat, seatIndex) => {
                const isSelected = selected.includes(seat.id);
                const disabled = !seat.available;
                const button = (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    aria-label={`Kursi ${seat.seat_number}${disabled ? ' (terisi)' : isSelected ? ' (dipilih)' : ''}`}
                    onClick={() => {
                      if (disabled) return;
                      if (!isSelected && selected.length >= maxSelectable) return;
                      onToggle(seat);
                    }}
                    className={clsx(
                      'flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl border text-[11px] font-extrabold transition duration-150',
                      disabled
                        ? 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-600'
                        : isSelected
                          ? 'border-primary bg-primary text-white shadow-md shadow-primary/30 scale-105'
                          : 'border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200',
                    )}
                  >
                    <Armchair size={14} aria-hidden="true" />
                    {seat.seat_number}
                  </button>
                );

                // Insert aisle gap after the second seat in each row.
                return seatIndex === 1 ? (
                  <span key={`${seat.id}-wrap`} className="contents">
                    {button}
                    <span aria-hidden="true" />
                  </span>
                ) : (
                  button
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={clsx('inline-block h-4 w-4 rounded-md border', className)} aria-hidden="true" />
      {label}
    </span>
  );
}
