'use client';
import { Wifi, WifiOff } from 'lucide-react';
import { useConnection } from '@/shared/hooks/use-connection';
export function ConnectionIndicator() { const { realtimeConnected, realtimeEnabled } = useConnection(); const ok = realtimeEnabled && realtimeConnected; return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${ok ? 'bg-success text-white' : 'bg-slate-200 text-slate-700'}`}>{ok ? <Wifi size={16}/> : <WifiOff size={16}/>} {ok ? 'Realtime connected' : 'Realtime idle'}</span>; }
