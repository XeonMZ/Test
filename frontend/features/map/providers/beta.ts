/* eslint-disable @typescript-eslint/no-explicit-any */
import { DONE_COLOR, MARKER_COLORS, type LatLng, type MapHandle, type MapPoint, type MapProvider } from '../types';

/**
 * Mode 3 — Beta / Simulation (Dev, QA, Demo, Testing, UAT).
 *
 * A lightweight canvas "map": grid + deterministic pseudo-streets, colored
 * markers, breadcrumb path, click-to-pick with inverse projection. No Google,
 * no OSRM, no API key, no internet — every method resolves locally so the
 * entire Live Trip flow can be exercised at zero API cost. Accuracy is not a
 * goal; flow coverage is.
 */

const DEFAULT_CENTER: LatLng = { lat: -7.2575, lng: 112.7521 };
const SPAN = 0.12; // degrees covered by the viewport at mount

type Viewport = { minLat: number; maxLat: number; minLng: number; maxLng: number };

function viewportAround(center: LatLng, span: number): Viewport {
  return { minLat: center.lat - span / 2, maxLat: center.lat + span / 2, minLng: center.lng - span / 2, maxLng: center.lng + span / 2 };
}

export const betaMapProvider: MapProvider = {
  id: 'beta',

  async mount(el, opts = {}) {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;background:#e8f0e8;cursor:crosshair;';
    el.appendChild(canvas);

    let points: MapPoint[] = [];
    let path: LatLng[] = [];
    let view = viewportAround(opts.center ?? DEFAULT_CENTER, SPAN);
    let pickCb: ((p: LatLng) => void) | null = null;

    const project = (p: LatLng): [number, number] => {
      const w = canvas.width;
      const h = canvas.height;
      const x = ((p.lng - view.minLng) / (view.maxLng - view.minLng)) * w;
      const y = h - ((p.lat - view.minLat) / (view.maxLat - view.minLat)) * h;
      return [x, y];
    };
    const unproject = (x: number, y: number): LatLng => ({
      lng: view.minLng + (x / canvas.clientWidth) * (view.maxLng - view.minLng),
      lat: view.minLat + ((canvas.clientHeight - y) / canvas.clientHeight) * (view.maxLat - view.minLat),
    });

    function draw(): void {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, el.clientWidth * dpr);
      canvas.height = Math.max(1, el.clientHeight * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      // Base + city blocks grid
      ctx.fillStyle = '#e8f0e8';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d3ded3';
      ctx.lineWidth = 1 * dpr;
      const grid = 40 * dpr;
      for (let x = 0; x < w; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // Deterministic pseudo main streets + a "river"
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6 * dpr;
      for (const frac of [0.22, 0.5, 0.78]) {
        ctx.beginPath(); ctx.moveTo(0, h * frac); ctx.lineTo(w, h * frac); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w * frac, 0); ctx.lineTo(w * frac, h); ctx.stroke();
      }
      ctx.strokeStyle = '#b7d4ea';
      ctx.lineWidth = 10 * dpr;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.85);
      ctx.quadraticCurveTo(w * 0.4, h * 0.6, w, h * 0.9);
      ctx.stroke();

      // Path
      if (path.length > 1) {
        ctx.strokeStyle = '#0f766e';
        ctx.lineWidth = 3.5 * dpr;
        ctx.beginPath();
        path.forEach((p, i) => {
          const [x, y] = project(p);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Markers
      for (const p of points) {
        if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
        const [x, y] = project(p);
        const r = (p.kind === 'driver' ? 9 : 7) * dpr;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.done ? DONE_COLOR : MARKER_COLORS[p.kind];
        ctx.fill();
        ctx.lineWidth = 2 * dpr;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }

      // Watermark — unmistakably not production
      ctx.fillStyle = 'rgba(15,23,42,0.10)';
      ctx.font = `${16 * dpr}px sans-serif`;
      ctx.fillText('SIMULATION MAP — BUKAN PETA ASLI', 12 * dpr, h - 12 * dpr);
    }

    const onClick = (e: MouseEvent) => {
      if (!pickCb) return;
      const rect = canvas.getBoundingClientRect();
      pickCb(unproject(e.clientX - rect.left, e.clientY - rect.top));
    };
    canvas.addEventListener('click', onClick);
    const resizeObserver = new ResizeObserver(() => draw());
    resizeObserver.observe(el);
    draw();

    const handle: MapHandle = {
      setPoints(next) { points = next; draw(); },
      setPath(next) { path = next; draw(); },
      panTo(p) { view = viewportAround(p, view.maxLat - view.minLat); draw(); },
      fitAll() {
        const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
        if (valid.length === 0) return;
        const lats = valid.map((p) => p.lat);
        const lngs = valid.map((p) => p.lng);
        const pad = Math.max(0.01, (Math.max(...lats) - Math.min(...lats)) * 0.25);
        view = { minLat: Math.min(...lats) - pad, maxLat: Math.max(...lats) + pad, minLng: Math.min(...lngs) - pad, maxLng: Math.max(...lngs) + pad };
        draw();
      },
      onPick(cb) { pickCb = cb; },
      destroy() { canvas.removeEventListener('click', onClick); resizeObserver.disconnect(); el.innerHTML = ''; },
    };
    return handle;
  },

  /** Simulated results scattered around the mock city — no network. */
  async search(query) {
    const seed: number = Array.from(query).reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    return [0, 1, 2].map((i) => ({
      label: `${query} — Titik Simulasi ${i + 1}`,
      lat: DEFAULT_CENTER.lat + Math.sin(seed + i * 2.1) * 0.03,
      lng: DEFAULT_CENTER.lng + Math.cos(seed + i * 1.7) * 0.03,
    }));
  },

  async reverseGeocode(p) {
    return `Titik Simulasi (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`;
  },

  /** Simulated routing: gentle zigzag between the two points. */
  async route(from, to) {
    const steps = 12;
    const out: LatLng[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const wobble = Math.sin(t * Math.PI * 3) * 0.0015;
      out.push({ lat: from.lat + (to.lat - from.lat) * t + wobble, lng: from.lng + (to.lng - from.lng) * t - wobble });
    }
    return out;
  },
};
