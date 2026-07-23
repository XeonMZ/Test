/**
 * Single source of truth for how a vehicle-layout cell looks.
 *
 * Both the customer seat picker (`SeatMap`) and the admin layout editor's
 * "Pratinjau Pelanggan" render through this vocabulary, so the preview can
 * never drift away from what the passenger actually sees.
 */

import type { LayoutCell, SeatCellType, SeatLayout } from '@/services/stms';

export type { LayoutCell, SeatCellType, SeatLayout };

/** Short marker drawn inside non-seat cells. */
export const CELL_LETTER: Record<SeatCellType, string> = {
  seat: '',
  driver: 'D',
  aisle: '',
  door: 'P',
  luggage: 'B',
  toilet: 'WC',
  stairs: '⇅',
  empty: '',
};

export const CELL_NAME: Record<SeatCellType, string> = {
  seat: 'kursi',
  driver: 'sopir',
  aisle: 'lorong',
  door: 'pintu',
  luggage: 'bagasi',
  toilet: 'toilet',
  stairs: 'tangga',
  empty: 'kosong',
};

/** Colour treatment for the non-bookable furniture cells. */
export function furnitureTone(type: SeatCellType): string {
  switch (type) {
    case 'driver':
      return 'border-amber-400 bg-amber-100 text-amber-700 dark:border-amber-500/60 dark:bg-amber-950/40 dark:text-amber-300';
    case 'door':
      return 'border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'luggage':
      return 'border-slate-400 bg-slate-200 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300';
    case 'toilet':
      return 'border-sky-400 bg-sky-100 text-sky-700 dark:border-sky-500/60 dark:bg-sky-950/40 dark:text-sky-300';
    case 'stairs':
      return 'border-violet-400 bg-violet-100 text-violet-700 dark:border-violet-500/60 dark:bg-violet-950/40 dark:text-violet-300';
    case 'aisle':
      return 'border-dashed border-slate-200 bg-transparent text-transparent dark:border-slate-800';
    default:
      return 'border-transparent bg-transparent text-transparent';
  }
}

/** Legend entries shown under the map — furniture actually present, only. */
export const FURNITURE_LEGEND: { type: SeatCellType; swatch: string }[] = [
  { type: 'driver', swatch: 'bg-amber-200' },
  { type: 'door', swatch: 'bg-emerald-200' },
  { type: 'toilet', swatch: 'bg-sky-200' },
  { type: 'luggage', swatch: 'bg-slate-300' },
  { type: 'stairs', swatch: 'bg-violet-200' },
];

/**
 * Fallback for vehicles whose seats predate the layout builder: they all share
 * coordinate (0,0), so we lay them out in a conventional 2-aisle-2 grid.
 */
export function autoLayout(seats: { id: number; seat_number: string; available: boolean }[]): SeatLayout {
  const perRow = 4;
  const cells: LayoutCell[] = seats.map((seat, index) => {
    const column = index % perRow;
    return {
      seat_id: seat.id,
      seat_number: seat.seat_number,
      row_index: Math.floor(index / perRow),
      // Column 2 is the aisle gap.
      column_index: column < 2 ? column : column + 1,
      cell_type: 'seat' as const,
      available: seat.available,
    };
  });

  return {
    has_layout: cells.length > 0,
    rows: Math.ceil(seats.length / perRow),
    columns: 5,
    cells,
  };
}
