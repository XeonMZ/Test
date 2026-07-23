'use client';

import { Camera, CameraOff, Image as ImageIcon, Loader2, ScanLine, X } from 'lucide-react';
import jsQR from 'jsqr';
import { useCallback, useEffect, useRef, useState } from 'react';

type QrScannerProps = {
  onDetected: (payload: string) => void;
  /** Called when the user closes the scanner without a result. */
  onClose?: () => void;
};

/**
 * QR scanner supporting two input modes:
 *  1. Live camera (getUserMedia + requestAnimationFrame decode loop via jsQR).
 *  2. Photo upload (decode a still image on a canvas).
 *
 * Everything runs client-side; only the decoded payload string leaves the
 * component (handed to onDetected). The camera stream is always stopped on
 * unmount or when a code is found.
 */
export function QrScanner({ onDetected, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decoding, setDecoding] = useState(false);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
    if (code && code.data) {
      stopCamera();
      onDetected(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(scanFrame);
  }, [onDetected, stopCamera]);

  const startCamera = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      setError(
        (err as Error)?.name === 'NotAllowedError'
          ? 'Akses kamera ditolak. Izinkan kamera di browser, atau gunakan unggah foto.'
          : 'Kamera tidak tersedia di perangkat/browser ini. Gunakan unggah foto.',
      );
    } finally {
      setStarting(false);
    }
  }, [scanFrame]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setDecoding(true);
      try {
        const bitmap = await createImageBitmap(file);
        const canvas = canvasRef.current ?? document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) throw new Error('Canvas tidak tersedia.');
        ctx.drawImage(bitmap, 0, 0);
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });
        if (code && code.data) {
          stopCamera();
          onDetected(code.data);
        } else {
          setError('QR tidak terbaca dari foto. Pastikan QR jelas dan tidak terpotong.');
        }
      } catch {
        setError('Gagal memproses foto. Coba foto lain.');
      } finally {
        setDecoding(false);
      }
    },
    [onDetected, stopCamera],
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white"><ScanLine size={18} className="text-primary" /> Pindai QR Tiket</p>
        {onClose ? (
          <button onClick={() => { stopCamera(); onClose(); }} aria-label="Tutup pemindai" className="rounded-xl p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X size={16} /></button>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-slate-950">
        <div className="relative aspect-square w-full">
          <video ref={videoRef} className={`h-full w-full object-cover ${active ? '' : 'hidden'}`} playsInline muted aria-label="Pratinjau kamera" />
          {active ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-2/3 w-2/3 rounded-md border-4 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          ) : (
            <div className="grid aspect-square place-items-center text-center text-sm font-semibold text-slate-400">
              <div className="px-6">
                <Camera size={40} className="mx-auto opacity-60" />
                <p className="mt-3">Nyalakan kamera atau unggah foto QR tiket penumpang.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error ? <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!active ? (
          <button onClick={startCamera} disabled={starting} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold uppercase tracking-button text-white transition hover:bg-primary-deep disabled:opacity-60">
            {starting ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />} Nyalakan kamera
          </button>
        ) : (
          <button onClick={stopCamera} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 px-5 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-800 dark:text-slate-200">
            <CameraOff size={15} /> Matikan kamera
          </button>
        )}

        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-5 text-sm font-semibold uppercase tracking-button text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-800 dark:text-slate-200">
          {decoding ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />} Unggah foto
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
