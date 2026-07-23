'use client';

import { clsx } from 'clsx';
import { useMemo, type CSSProperties } from 'react';
import type { CatalogSeat } from '@/services/stms';
import {
  CELL_LETTER,
  CELL_NAME,
  FURNITURE_LEGEND,
  autoLayout,
  furnitureTone,
  type LayoutCell,
  type SeatLayout,
} from '@/features/booking/seat-cells';

type SeatMapProps = {
  seats: CatalogSeat[];
  /** Full grid drawn by the operator. Omitted/empty → auto 2-2 grid fallback. */
  layout?: SeatLayout | null;
  selected: number[];
  maxSelectable?: number;
  onToggle?: (seat: CatalogSeat) => void;
  /** Read-only rendering for the admin "Pratinjau Pelanggan". */
  readOnly?: boolean;
  /** Tighter cells, for the narrow preview column. */
  compact?: boolean;
};

/**
 * Interactive vehicle seat map. The grid mirrors the layout the operator drew
 * in the vehicle-layout editor cell for cell — seat coordinates, aisles,
 * driver, doors and toilets included — with live availability on top.
 */
export function SeatMap({
  seats,
  layout,
  selected,
  maxSelectable = 6,
  onToggle,
  readOnly = false,
  compact = false,
}: SeatMapProps) {
  const grid = useMemo<SeatLayout>(
    () => (layout && layout.has_layout && layout.cells.length > 0 ? layout : autoLayout(seats)),
    [layout, seats],
  );

  // Seat objects keyed by id so a cell click can hand the caller the real seat.
  const seatById = useMemo(() => new Map(seats.map((seat) => [seat.id, seat])), [seats]);

  // Availability comes from the live seats query, not the (cached) layout.
  const cells = useMemo<LayoutCell[]>(
    () =>
      grid.cells.map((cell) =>
        cell.seat_id != null && seatById.has(cell.seat_id)
          ? { ...cell, available: seatById.get(cell.seat_id)!.available }
          : cell,
      ),
    [grid, seatById],
  );

  const usedTypes = useMemo(() => new Set(cells.map((c) => c.cell_type)), [cells]);
  const legend = FURNITURE_LEGEND.filter((item) => usedTypes.has(item.type));

  if (cells.length === 0) {
    return <p className="text-sm font-semibold text-slate-500">Denah kursi belum tersedia untuk armada ini.</p>;
  }

  // Width is driven by the grid template; cells only carry their type scale.
  const cellSize = compact ? 'text-[8px]' : 'text-[11px]';

  return (
    <div className={compact ? 'space-y-3' : 'space-y-5'}>
      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-300">
          <Legend className="border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900" label="Tersedia" />
          <Legend className="border-primary bg-primary text-white" label="Pilihanmu" />
          <Legend className="border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800" label="Terisi" />
        </div>
      ) : null}

      <div
        className={clsx(
          'mx-auto w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900',
          compact ? 'p-3' : 'max-w-sm p-5',
        )}
      >
        <div
          className={clsx(
            'flex items-center justify-between rounded-2xl bg-slate-950 font-extrabold uppercase tracking-buttonst text-white dark:bg-slate-800',
            compact ? 'mb-3 px-3 py-1.5 text-[9px]' : 'mb-5 px-4 py-2 text-xs',
          )}
        >
          <span>Depan</span>
          <span aria-hidden="true">🚌</span>
        </div>

        <div className="overflow-x-auto">
          <div
            className={clsx('mx-auto grid w-fit', compact ? 'gap-1' : 'gap-2')}
            style={{ gridTemplateColumns: `repeat(${grid.columns}, minmax(${compact ? '1.6rem' : '2.75rem'}, 1fr))` }}
            role="group"
            aria-label="Pilih kursi"
          >
            {cells.map((cell) => (
              <Cell
                key={`${cell.row_index}-${cell.column_index}`}
                cell={cell}
                sizeClass={cellSize}
                // Explicit placement: 'empty' squares are never persisted, so
                // grid auto-flow would silently close the operator's gaps.
                position={{ gridColumn: cell.column_index + 1, gridRow: cell.row_index + 1 }}
                selected={cell.seat_id != null && selected.includes(cell.seat_id)}
                readOnly={readOnly}
                onPick={() => {
                  if (readOnly || !onToggle || cell.seat_id == null) return;
                  const seat = seatById.get(cell.seat_id);
                  if (!seat || !seat.available) return;
                  if (!selected.includes(seat.id) && selected.length >= maxSelectable) return;
                  onToggle(seat);
                }}
              />
            ))}
          </div>
        </div>

        {legend.length > 0 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-[9px] font-bold text-slate-500 dark:text-slate-400">
            {legend.map((item) => (
              <span key={item.type} className="flex items-center gap-1">
                <span className={clsx('h-2.5 w-2.5 rounded', item.swatch)} aria-hidden="true" /> {CELL_NAME[item.type]}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Cell({
  cell,
  sizeClass,
  position,
  selected,
  readOnly,
  onPick,
}: {
  cell: LayoutCell;
  sizeClass: string;
  position: CSSProperties;
  selected: boolean;
  readOnly: boolean;
  onPick: () => void;
}) {
  const shared = clsx('grid aspect-square place-items-center rounded-lg border font-extrabold transition', sizeClass);

  // Furniture and blanks keep their square so the grid stays true to the drawing.
  if (cell.cell_type !== 'seat' || cell.seat_id == null) {
    return (
      <div
        className={clsx(shared, furnitureTone(cell.cell_type))}
        style={position}
        title={cell.label ?? CELL_NAME[cell.cell_type]}
        aria-hidden={cell.cell_type === 'empty' || cell.cell_type === 'aisle'}
      >
        {CELL_LETTER[cell.cell_type]}
      </div>
    );
  }

  const occupied = !cell.available;
  const label = cell.seat_number ?? '';

  return (
    <button
      type="button"
      disabled={readOnly || occupied}
      aria-pressed={selected}
      aria-label={`Kursi ${label}${occupied ? ' (terisi)' : selected ? ' (dipilih)' : ''}`}
      onClick={onPick}
      style={position}
      className={clsx(
        shared,
        occupied
          ? 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-600'
          : selected
            ? 'border-primary bg-primary text-white shadow-md'
            : readOnly
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-primary/40 bg-primary/10 text-primary hover:border-primary hover:bg-primary/20',
      )}
    >
      {label}
    </button>
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
