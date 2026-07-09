'use client';
import { useContext } from 'react';
import { RealtimeContext } from '@/shared/providers/realtime-provider';
export function useRealtime() { return useContext(RealtimeContext); }
