'use client';

import { MapPin, Package as PackageIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/services/http';
import { extractApiError, formatIDR } from '@/services/stms';
import type { TourPackageRow } from '@/services/portal';
import { AppCard, Badge, EmptyState, PageHeader, SectionHeader, Skeleton } from '@/shared/ui/components';

type Paged = { data: TourPackageRow[] };

const SECTIONS = [
  { key: 'recommended', title: 'Recommended Packages', desc: 'Pilihan terbaik dari tim kami.' },
  { key: 'best_seller', title: 'Best Seller', desc: 'Paling banyak dipesan pelanggan.' },
  { key: 'promo', title: 'Promo', desc: 'Harga spesial waktu terbatas.' },
  { key: 'featured', title: 'Featured Packages', desc: 'Sorotan destinasi unggulan.' },
] as const;

function PackageCard({ p }: { p: TourPackageRow }) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="relative grid h-36 place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
        {p.cover_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover_path} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <PackageIcon size={34} className="text-primary/50" />
        )}
        {p.badge ? <span className="absolute left-3 top-3 rounded-xl bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow">{p.badge}</span> : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{p.name}</h3>
        <p className="flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin size={12} /> {p.destination ?? 'Berbagai destinasi'} · {p.duration_days} hari</p>
        {p.facilities?.length ? <p className="line-clamp-1 text-xs font-semibold text-slate-400">{p.facilities.slice(0, 4).join(' · ')}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-sm font-extrabold text-primary">{formatIDR(p.price)}</span>
          <Badge tone="neutral">{p.capacity > 0 ? `${p.capacity} pax` : 'fleksibel'}</Badge>
        </div>
      </div>
    </article>
  );
}

/** Customer view: four managed sections, all content from the CMS. */
export function PublicPackagesPage() {
  const query = useQuery({
    queryKey: ['catalog-packages'],
    queryFn: async () => {
      const results = await Promise.all(
        SECTIONS.map(async (s) => [s.key, (await http.get<{ data: Paged }>(`/catalog/tour-packages?filter=${s.key}&per_page=8`)).data.data.data] as const),
      );
      return Object.fromEntries(results) as Record<string, TourPackageRow[]>;
    },
  });

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>;
  if (query.isError) return <EmptyState title="Gagal memuat paket wisata" description={extractApiError(query.error, 'Terjadi kesalahan.')} />;

  const data = query.data ?? {};
  const allEmpty = SECTIONS.every((s) => (data[s.key] ?? []).length === 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Paket Wisata" description="Jelajahi paket wisata SJT Travel — dikurasi dan diperbarui oleh tim kami." />
      {allEmpty ? (
        <EmptyState title="Belum ada paket wisata" description="Paket akan tampil di sini begitu dipublikasikan. Cek kembali segera!" />
      ) : (
        SECTIONS.map((s) => {
          const rows = data[s.key] ?? [];
          if (rows.length === 0) return null;
          return (
            <AppCard key={s.key}>
              <SectionHeader title={s.title} description={s.desc} />
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rows.map((p) => <PackageCard key={p.id} p={p} />)}
              </div>
            </AppCard>
          );
        })
      )}
    </div>
  );
}
