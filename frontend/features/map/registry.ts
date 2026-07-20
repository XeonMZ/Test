'use client';

import { useQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { betaMapProvider } from './providers/beta';
import { googleMapProvider } from './providers/google';
import { osmMapProvider } from './providers/osm';
import type { MapProvider, MapProviderId } from './types';

/**
 * Provider registry — the frontend counterpart of the backend
 * MapProviderResolver. Components never branch on provider id; they ask the
 * registry for the provider the server resolved (beta-blocked rule included).
 */
const PROVIDERS: Record<MapProviderId, MapProvider> = {
  google: googleMapProvider,
  osm: osmMapProvider,
  beta: betaMapProvider,
};

export type MapConfig = {
  requested: MapProviderId;
  provider: MapProviderId;
  beta_enabled: boolean;
  beta_blocked: boolean;
  message: string | null;
};

const FALLBACK: MapConfig = { requested: 'google', provider: 'google', beta_enabled: false, beta_blocked: false, message: null };

export function useMapConfig() {
  return useQuery({
    queryKey: ['map-config'],
    queryFn: async () => (await http.get<{ data: MapConfig }>('/map/config')).data.data,
    staleTime: 60_000,
    placeholderData: FALLBACK,
  });
}

export function useMapProvider(): { provider: MapProvider; config: MapConfig; isLoading: boolean } {
  const { data, isLoading } = useMapConfig();
  const config = data ?? FALLBACK;
  return { provider: PROVIDERS[config.provider] ?? PROVIDERS.google, config, isLoading };
}
