'use client';
import { useConnection } from '@/shared/hooks/use-connection';
export function OfflineBanner() { const { online } = useConnection(); if (online) return null; return <div className="fixed inset-x-0 top-0 z-[70] bg-danger px-4 py-2 text-center text-sm font-bold text-white">You are offline. Realtime updates are paused.</div>; }
