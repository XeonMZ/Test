'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { AuthProvider } from '@/shared/providers/auth-provider';
import { RealtimeProvider } from '@/shared/providers/realtime-provider';
import { ToastProvider } from '@/shared/providers/toast-provider';
import { ThemeProvider } from '@/shared/ui/theme/theme-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}><AuthProvider><ThemeProvider><ToastProvider><RealtimeProvider>{children}</RealtimeProvider></ToastProvider></ThemeProvider></AuthProvider></QueryClientProvider>;
}
