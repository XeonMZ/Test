'use client';
import { useRealtime } from './use-realtime';
export function useConnection() { const realtime = useRealtime(); return { online: typeof navigator === 'undefined' ? true : navigator.onLine, realtimeConnected: realtime.connected, realtimeEnabled: realtime.enabled }; }
