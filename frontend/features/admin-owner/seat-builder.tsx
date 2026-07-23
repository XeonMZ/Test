'use client';

import { Armchair, DoorOpen, Loader2, Minus, Plus, Save, Disc3, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type SeatCell } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

type CellType = SeatCell['cell_type'];

const PALETTE: { type: CellType; label: string; icon: typeof Armchair; hint: string }[] = [
  { type: 'seat', label: 'Kursi', icon: Armchair, hint: 'Kursi penumpang (diberi nomor otomatis)' },
  { type: 'aisle', label: 'Lorong', icon: Minus, hint: 'Jalan/gang kosong' },
  { type: 'driver', label: 'Sopir', icon: Disc3, hint: 'Posisi pengemudi' },
  { type: 'door', label: 'Pintu', icon: DoorOpen, hint: 'Pintu masuk/keluar' },
  { type: 'empty', label: 'Kosong', icon: Trash2, hint: 'Sel kosong' },
];

const input = 'min-h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60';

function cellStyle(type: CellType, active: boolean): string {
  const base = 'grid aspect-square place-items-center rounded-lg border text-[10px] font-extrabold transition select-none ';
  if (active) return base + 'ring-2 ring-offset-1 ring-primary ';
  switch (type) {
    case 'seat': return base + 'border-primary/40 bg-primary/10 text-primary';
    case 'aisle': return base + 'border-dashed border-slate-300 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-900';
    case 'driver': return base + 'border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-950/40';
    case 'door': return base + 'border-emerald-400 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40';
    default: return base + 'border-transparent bg-transparent text-transparent';
  }
}

export function SeatBuilderPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [brush, setBrush] = useState<CellType>('seat');
  const [grid, setGrid] = useState<CellType[][]>([]);

  const vehicles = useQuery({ queryKey: ['manage-vehicles-all'], queryFn: () => adminApi.vehiclesList({}), placeholderData: keepPreviousData });
  const layoutQuery = useQuery({
    queryKey: ['vehicle-layout', vehicleId],
    queryFn: () => adminApi.vehicleLayout(vehicleId!),
    enabled: Boolean(vehicleId),
  });

  // Build the editable grid from the saved layout (or a blank grid).
  useEffect(() => {
    if (!vehicleId) return;
    const cells = layoutQuery.data ?? [];
    if (cells.length > 0) {
      const maxRow = Math.max(...cells.map((c) => c.row_index)) + 1;
      const maxCol = Math.max(...cells.map((c) => c.column_index)) + 1;
      setRows(maxRow);
      setCols(maxCol);
      const g: CellType[][] = Array.from({ length: maxRow }, () => Array.from({ length: maxCol }, () => 'empty' as CellType));
      for (const c of cells) g[c.row_index][c.column_index] = c.cell_type;
      setGrid(g);
    } else {
      setGrid(Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'empty' as CellType)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutQuery.data, vehicleId]);

  function resize(nextRows: number, nextCols: number) {
    setRows(nextRows);
    setCols(nextCols);
    setGrid((prev) => Array.from({ length: nextRows }, (_, r) => Array.from({ length: nextCols }, (_, c) => prev[r]?.[c] ?? ('empty' as CellType))));
  }

  function paint(r: number, c: number) {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = next[r][c] === brush ? 'empty' : brush;
      return next;
    });
  }

  // Convert grid → cells with auto seat numbers (A1, A2… per row).
  const cells: SeatCell[] = useMemo(() => {
    const out: SeatCell[] = [];
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < grid.length; r++) {
      let seatInRow = 0;
      for (let c = 0; c < grid[r].length; c++) {
        const type = grid[r][c];
        if (type === 'empty') continue;
        const cell: SeatCell = { row_index: r, column_index: c, cell_type: type, seat_number: '' };
        if (type === 'seat') {
          seatInRow++;
          cell.seat_number = `${rowLetters[r] ?? 'X'}${seatInRow}`;
        } else {
          cell.label = type;
          cell.seat_number = `${type}-${r}${c}`;
        }
        out.push(cell);
      }
    }
    return out;
  }, [grid]);

  const seatCount = cells.filter((c) => c.cell_type === 'seat').length;

  const saveMutation = useMutation({
    mutationFn: () => adminApi.vehicleLayoutSave(vehicleId!, cells),
    onSuccess: () => {
      toast(`Denah tersimpan (${seatCount} kursi).`, 'success');
      queryClient.invalidateQueries({ queryKey: ['vehicle-layout', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['manage-vehicles-all'] });
    },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan denah.'), 'error'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Denah Kursi Kustom"
        description="Rancang tata letak kursi armada persis seperti bentuk fisiknya. Klik sel untuk mengubah jenisnya."
      />

      <AppCard>
        <SectionHeader title="Pilih armada" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <select value={vehicleId ?? ''} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)} className={input} aria-label="Pilih armada">
            <option value="">Pilih armada…</option>
            {vehicles.data?.data.map((v) => <option key={v.id} value={v.id}>{v.brand} · {v.code}</option>)}
          </select>
          {vehicleId ? (
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold">Baris</label>
              <button onClick={() => resize(Math.max(1, rows - 1), cols)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Kurangi baris"><Minus size={14} /></button>
              <span className="w-6 text-center font-extrabold">{rows}</span>
              <button onClick={() => resize(Math.min(30, rows + 1), cols)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Tambah baris"><Plus size={14} /></button>
              <label className="ml-2 text-sm font-bold">Kolom</label>
              <button onClick={() => resize(rows, Math.max(1, cols - 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Kurangi kolom"><Minus size={14} /></button>
              <span className="w-6 text-center font-extrabold">{cols}</span>
              <button onClick={() => resize(rows, Math.min(12, cols + 1))} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Tambah kolom"><Plus size={14} /></button>
            </div>
          ) : null}
        </div>
      </AppCard>

      {!vehicleId ? (
        <EmptyState title="Belum ada armada dipilih" description="Pilih armada untuk mulai merancang denah kursinya." />
      ) : layoutQuery.isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <AppCard>
            <SectionHeader title="Denah" description={`${seatCount} kursi · depan kendaraan di atas`} />
            <div className="mt-5 rounded-2xl bg-slate-100 p-4 dark:bg-slate-900">
              <p className="mb-3 text-center text-xs font-extrabold uppercase tracking-widest text-slate-400">Depan</p>
              <div className="mx-auto grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: `${cols * 52}px` }}>
                {grid.map((row, r) =>
                  row.map((type, c) => (
                    <button key={`${r}-${c}`} onClick={() => paint(r, c)} className={cellStyle(type, false)} title={`Baris ${r + 1}, Kolom ${c + 1}`}>
                      {type === 'seat' ? '' : type === 'driver' ? 'D' : type === 'door' ? 'P' : ''}
                    </button>
                  )),
                )}
              </div>
            </div>
          </AppCard>

          <div className="space-y-4">
            <AppCard>
              <SectionHeader title="Alat" description="Pilih jenis sel lalu klik pada denah." />
              <div className="mt-4 space-y-2">
                {PALETTE.map(({ type, label, icon: Icon, hint }) => (
                  <button key={type} onClick={() => setBrush(type)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${brush === type ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 hover:border-primary/40 dark:border-slate-800'}`} title={hint}>
                    <Icon size={16} /> {label}
                  </button>
                ))}
              </div>
            </AppCard>
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || seatCount === 0} className={`${btnPrimary} w-full`}>
              {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan denah
            </button>
            {seatCount === 0 ? <p className="text-center text-xs font-semibold text-amber-600">Tambahkan minimal satu kursi.</p> : null}
          </div>
        </div>
      )}
    </div>
  );
}
