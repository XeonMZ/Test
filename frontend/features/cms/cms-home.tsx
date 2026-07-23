'use client';

import { useQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { CmsRenderer } from './cms-renderer';
import type { CmsBlock } from './blocks';

type HomeRow = {
  id: number;
  section_type: string;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, unknown> | null;
};

/**
 * Renders the public landing page from CMS blocks. When the CMS has no
 * published blocks yet, it renders the provided fallback (the original static
 * landing) so the site is never blank — zero regression during rollout.
 */
export function CmsHome({ fallback }: { fallback: React.ReactNode }) {
  const query = useQuery({
    queryKey: ['public-home-blocks'],
    queryFn: async () => (await http.get<{ data: HomeRow[] }>('/catalog/home')).data.data,
    staleTime: 60_000,
    retry: 1,
  });

  const blocks: CmsBlock[] = (query.data ?? [])
    .filter((r) => r.is_active)
    .map((r) => ({ id: r.id, type: r.section_type, is_active: r.is_active, sort_order: r.sort_order, metadata: r.metadata ?? {} }));

  // While loading, or if the CMS is empty / errored, show the fallback.
  if (query.isLoading || blocks.length === 0) {
    return <>{fallback}</>;
  }
  return (
    <div className="bg-secondary text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <CmsRenderer blocks={blocks} />
    </div>
  );
}
