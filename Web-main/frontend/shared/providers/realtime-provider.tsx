'use client';
import { createContext, type ReactNode, useEffect, useMemo, useState } from 'react';
import { echoManager } from '@/shared/realtime/echo-manager';

type RealtimeContextValue = { connected: boolean; enabled: boolean };
export const RealtimeContext = createContext<RealtimeContextValue>({ connected: false, enabled: false });

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_REALTIME_ENABLED !== 'false';
  const [connected, setConnected] = useState(false);
  useEffect(() => { if (!enabled) return; const echo = echoManager.connect(); setConnected(Boolean(echo)); return () => { echoManager.disconnect(); setConnected(false); }; }, [enabled]);
  const value = useMemo(() => ({ connected, enabled }), [connected, enabled]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
