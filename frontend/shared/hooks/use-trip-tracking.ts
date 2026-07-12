'use client';
import { useState } from 'react';
export type DriverMarker = { lat: number; lng: number; status: string; eta: string; distance: string };
export function useTripTracking() { const [marker, setMarker] = useState<DriverMarker>({ lat: -6.2, lng: 106.816666, status: 'Waiting for GPS', eta: '-', distance: '-' }); return { marker, setMarker }; }
