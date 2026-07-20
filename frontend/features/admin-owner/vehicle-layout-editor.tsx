'use client';

import { Armchair, ArrowUpDown, Briefcase, Copy, DoorOpen, Disc3, Download, Droplet, Eraser, Loader2, Minus, Plus, Redo2, Save, Trash2, Undo2, Upload } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, type SeatCell } from '@/services/portal';
import { extractApiError } from '@/services/stms';
import { useToast } from '@/shared/providers/toast-provider';
import { ActionButton, AppCard, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

type CellType = SeatCell['cell_type'];

const PALETTE: { type: CellType; label: string; icon: typeof Armchair; letter: string }[] = [
  { type: 'seat', label: 'Kursi', icon: Armchair, letter: '' },
  { type: 'driver', label: 'Sopir', icon: Disc3, letter: 'D' },
  { type: 'aisle', label: 'Lorong', icon: Minus, letter: '' },
  { type: 'door', label: 'Pintu', icon: DoorOpen, letter: 'P' },
  { type: 'luggage', label: 'Bagasi', icon: Briefcase, letter: 'B' },
  { type: 'toilet', label: 'Toilet', icon: Droplet, letter: 'WC' },
  { type: 'stairs', label: 'Tangga', icon: ArrowUpDown, letter: '⇅' },
  { type: 'empty', label: 'Kosong', icon: Eraser, letter: '' },
];

const input = 'min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100';
const btnPrimary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-extrabold text-white shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-60';
const toolBtn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-extrabold text-slate-600 transition hover:border-primary hover:text-primary disabled:opacity-40 dark:border-slate-800 dark:text-slate-300';

/** Visual style per cell — the SAME palette the customer seat map uses. */
function cellStyle(type: CellType, selected: boolean): string {
  const base = 'relative grid aspect-square place-items-center rounded-lg border text-[10px] font-extrabold transition select-none cursor-pointer ';
  const ring = selected ? 'ring-2 ring-offset-1 ring-slate-900 dark:ring-white ' : '';
  switch (type) {
    case 'seat': return base + ring + 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20';
    case 'aisle': return base + ring + 'border-dashed border-slate-300 bg-slate-50 text-slate-300 dark:border-slate-700 dark:bg-slate-900';
    case 'driver': return base + ring + 'border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-950/40';
    case 'door': return base + ring + 'border-emerald-400 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40';
    case 'luggage': return base + ring + 'border-slate-400 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    case 'toilet': return base + ring + 'border-sky-400 bg-sky-100 text-sky-700 dark:bg-sky-950/40';
    case 'stairs': return base + ring + 'border-violet-400 bg-violet-100 text-violet-700 dark:bg-violet-950/40';
    default: return base + ring + 'border-slate-200 bg-transparent text-transparent hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900';
  }
}

const letterFor = (t: CellType) => PALETTE.find((p) => p.type === t)?.letter ?? '';
const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Recompute seat numbers row-by-row (A1, A2, B1 …). */
function numberSeats(grid: CellType[][]): SeatCell[] {
  const cells: SeatCell[] = [];
  for (let r = 0; r < grid.length; r++) {
    let seatInRow = 0;
    for (let c = 0; c < grid[r].length; c++) {
      const type = grid[r][c];
      if (type === 'empty') continue;
      const cell: SeatCell = { row_index: r, column_index: c, cell_type: type, seat_number: '' };
      if (type === 'seat') {
        seatInRow++;
        cell.seat_number = `${ROW_LETTERS[r] ?? 'X'}${seatInRow}`;
      } else {
        cell.label = type;
        cell.seat_number = `${type}-${r}${c}`;
      }
      cells.push(cell);
    }
  }
  return cells;
}

export function VehicleLayoutEditorPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [brush, setBrush] = useState<CellType>('seat');
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Undo/redo stacks.
  const [past, setPast] = useState<CellType[][][]>([]);
  const [future, setFuture] = useState<CellType[][][]>([]);

  const vehicles = useQuery({ queryKey: ['manage-vehicles-all'], queryFn: () => adminApi.vehiclesList({}), placeholderData: keepPreviousData });
  const layoutQuery = useQuery({ queryKey: ['vehicle-layout', vehicleId], queryFn: () => adminApi.vehicleLayout(vehicleId!), enabled: Boolean(vehicleId) });

  const commit = useCallback((next: CellType[][]) => {
    setPast((p) => [...p.slice(-49), grid]);
    setFuture([]);
    setGrid(next);
  }, [grid]);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [grid, ...f]);
      setGrid(prev);
      return p.slice(0, -1);
    });
  }, [grid]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const nextState = f[0];
      setPast((p) => [...p, grid]);
      setGrid(nextState);
      return f.slice(1);
    });
  }, [grid]);

  // Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // Load a saved layout (or blank grid) into the editor.
  useEffect(() => {
    if (!vehicleId) return;
    const cells = layoutQuery.data ?? [];
    if (cells.length > 0) {
      const maxRow = Math.max(...cells.map((c) => c.row_index)) + 1;
      const maxCol = Math.max(...cells.map((c) => c.column_index)) + 1;
      const g: CellType[][] = Array.from({ length: maxRow }, () => Array.from({ length: maxCol }, () => 'empty' as CellType));
      for (const c of cells) g[c.row_index][c.column_index] = c.cell_type;
      setRows(maxRow); setCols(maxCol); setGrid(g);
    } else {
      setGrid(Array.from({ length: rows }, () => Array.from({ length: cols }, () => 'empty' as CellType)));
    }
    setPast([]); setFuture([]); setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, layoutQuery.data]);

  function resize(nextRows: number, nextCols: number) {
    const g: CellType[][] = Array.from({ length: nextRows }, (_, r) =>
      Array.from({ length: nextCols }, (_, c) => grid[r]?.[c] ?? ('empty' as CellType)));
    setRows(nextRows); setCols(nextCols); commit(g);
  }

  function paint(r: number, c: number, type: CellType = brush) {
    if (grid[r]?.[c] === type) { setSelected({ r, c }); return; }
    const g = grid.map((row) => [...row]);
    g[r][c] = type;
    commit(g);
    setSelected({ r, c });
  }

  function duplicateSelected() {
    if (!selected) return;
    const src = grid[selected.r][selected.c];
    // Duplicate into the next empty cell to the right, else below.
    const g = grid.map((row) => [...row]);
    const rightC = selected.c + 1;
    if (rightC < cols && g[selected.r][rightC] === 'empty') { g[selected.r][rightC] = src; commit(g); setSelected({ r: selected.r, c: rightC }); return; }
    const downR = selected.r + 1;
    if (downR < rows && g[downR][selected.c] === 'empty') { g[downR][selected.c] = src; commit(g); setSelected({ r: downR, c: selected.c }); return; }
    toast('Tidak ada sel kosong di sebelah untuk menduplikasi.', 'info');
  }

  const cells = useMemo(() => numberSeats(grid), [grid]);
  const seatCount = cells.filter((c) => c.cell_type === 'seat').length;

  const saveMutation = useMutation({
    mutationFn: () => adminApi.vehicleLayoutSave(vehicleId!, cells),
    onSuccess: () => { toast(`Denah tersimpan — ${seatCount} kursi.`, 'success'); queryClient.invalidateQueries({ queryKey: ['vehicle-layout', vehicleId] }); },
    onError: (error) => toast(extractApiError(error, 'Gagal menyimpan denah.'), 'error'),
  });

  function exportTemplate() {
    const blob = new Blob([JSON.stringify({ rows, cols, grid }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `denah-armada-${vehicleId ?? 'template'}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  function importTemplate(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { rows: number; cols: number; grid: CellType[][] };
        if (!Array.isArray(parsed.grid)) throw new Error('bad');
        setRows(parsed.rows); setCols(parsed.cols); commit(parsed.grid);
        toast('Template denah diimpor.', 'success');
      } catch {
        toast('File template tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
  }

  const vehicleList = vehicles.data?.data ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Editor Denah Armada"
        description="Seret komponen ke grid atau klik untuk melukis. Snap-grid otomatis, undo/redo (Ctrl+Z / Ctrl+Shift+Z), duplikat sel, serta impor/ekspor template. Pratinjau tepat seperti tampilan pemilihan kursi pelanggan."
        actions={<ActionButton onClick={() => layoutQuery.refetch()} disabled={!vehicleId || layoutQuery.isFetching}>Muat ulang</ActionButton>}
      />

      <AppCard>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label className="mb-1.5 block text-xs font-extrabold text-slate-500">Armada</label>
            <select value={vehicleId ?? ''} onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)} className={input} aria-label="Pilih armada">
              <option value="">— pilih armada —</option>
              {vehicleList.map((v: { id: number; brand?: string; plate_number?: string; code?: string }) => (
                <option key={v.id} value={v.id}>{[v.brand, v.plate_number ?? v.code].filter(Boolean).join(' · ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-500">Baris</span>
            <button onClick={() => resize(Math.max(1, rows - 1), cols)} disabled={!vehicleId} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Kurangi baris"><Minus size={14} /></button>
            <span className="w-6 text-center text-sm font-extrabold">{rows}</span>
            <button onClick={() => resize(Math.min(40, rows + 1), cols)} disabled={!vehicleId} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Tambah baris"><Plus size={14} /></button>
            <span className="ml-2 text-xs font-extrabold text-slate-500">Kolom</span>
            <button onClick={() => resize(rows, Math.max(1, cols - 1))} disabled={!vehicleId} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Kurangi kolom"><Minus size={14} /></button>
            <span className="w-6 text-center text-sm font-extrabold">{cols}</span>
            <button onClick={() => resize(rows, Math.min(16, cols + 1))} disabled={!vehicleId} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 dark:border-slate-700" aria-label="Tambah kolom"><Plus size={14} /></button>
          </div>
        </div>
      </AppCard>

      {!vehicleId ? (
        <EmptyState title="Pilih armada" description="Pilih armada untuk mulai menyusun denah kursinya." />
      ) : layoutQuery.isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[220px_1fr_260px]">
          {/* Palette */}
          <AppCard>
            <SectionHeader title="Komponen" />
            <p className="mt-1 text-[11px] font-semibold text-slate-400">Klik untuk memilih kuas, atau seret ke grid.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {PALETTE.map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  draggable
                  onDragStart={() => { setBrush(type); setDragging(true); }}
                  onDragEnd={() => setDragging(false)}
                  onClick={() => setBrush(type)}
                  className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 text-[11px] font-extrabold transition ${brush === type ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 text-slate-500 hover:border-primary/50 dark:border-slate-800'}`}
                >
                  <Icon size={18} /> {label}
                </button>
              ))}
            </div>
          </AppCard>

          {/* Canvas */}
          <AppCard>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeader title="Kanvas Denah" />
              <div className="flex flex-wrap gap-1.5">
                <button onClick={undo} disabled={past.length === 0} className={toolBtn}><Undo2 size={13} /> Undo</button>
                <button onClick={redo} disabled={future.length === 0} className={toolBtn}><Redo2 size={13} /> Redo</button>
                <button onClick={duplicateSelected} disabled={!selected} className={toolBtn}><Copy size={13} /> Duplikat</button>
                <button onClick={() => selected && paint(selected.r, selected.c, 'empty')} disabled={!selected} className={toolBtn}><Trash2 size={13} /> Hapus sel</button>
              </div>
            </div>

            <div className="mt-4 overflow-auto rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/40">
              {/* Front-of-vehicle indicator */}
              <div className="mx-auto mb-2 flex w-full max-w-md items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" /> Depan kendaraan <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="mx-auto grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(2.4rem, 1fr))` }}>
                {grid.map((row, r) =>
                  row.map((type, c) => (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => paint(r, c)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={(e) => { e.preventDefault(); paint(r, c); setDragging(false); }}
                      className={`${cellStyle(type, selected?.r === r && selected?.c === c)} ${dragging ? 'ring-1 ring-primary/30' : ''}`}
                      style={{ minWidth: '2.4rem' }}
                      title={`Baris ${r + 1}, Kolom ${c + 1} — ${type}`}
                    >
                      {type === 'seat' ? '' : letterFor(type)}
                    </div>
                  )),
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || seatCount === 0} className={btnPrimary}>
                {saveMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Simpan Denah
              </button>
              <button onClick={exportTemplate} className={toolBtn}><Download size={13} /> Ekspor Template</button>
              <button onClick={() => fileRef.current?.click()} className={toolBtn}><Upload size={13} /> Impor Template</button>
              <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importTemplate(f); e.currentTarget.value = ''; }} />
              <span className="ml-auto text-xs font-extrabold text-slate-500">Total kursi: <span className="text-primary">{seatCount}</span></span>
            </div>
          </AppCard>

          {/* Live customer-identical preview */}
          <AppCard>
            <SectionHeader title="Pratinjau Pelanggan" />
            <p className="mt-1 text-[11px] font-semibold text-slate-400">Persis seperti yang dilihat pelanggan saat memilih kursi.</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Depan</div>
              <div className="mx-auto grid w-fit gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(1.6rem, 1fr))` }}>
                {grid.map((row, r) =>
                  row.map((type, c) => {
                    const seat = type === 'seat';
                    const num = seat ? cells.find((x) => x.row_index === r && x.column_index === c)?.seat_number : '';
                    return (
                      <div key={`p-${r}-${c}`} className={`grid aspect-square place-items-center rounded-md border text-[8px] font-extrabold ${
                        seat ? 'border-primary/40 bg-primary/10 text-primary' :
                        type === 'driver' ? 'border-amber-400 bg-amber-100 text-amber-700' :
                        type === 'door' ? 'border-emerald-400 bg-emerald-100 text-emerald-700' :
                        type === 'luggage' ? 'border-slate-400 bg-slate-200 text-slate-600' :
                        type === 'toilet' ? 'border-sky-400 bg-sky-100 text-sky-700' :
                        type === 'stairs' ? 'border-violet-400 bg-violet-100 text-violet-700' :
                        type === 'aisle' ? 'border-dashed border-slate-200 bg-transparent' : 'border-transparent bg-transparent'
                      }`} style={{ minWidth: '1.6rem' }}>
                        {seat ? num : letterFor(type)}
                      </div>
                    );
                  }),
                )}
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-2 text-[9px] font-bold text-slate-500">
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-primary/30" /> kursi</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-200" /> sopir</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-200" /> pintu</span>
                <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-sky-200" /> toilet</span>
              </div>
            </div>
          </AppCard>
        </div>
      )}
    </div>
  );
}
