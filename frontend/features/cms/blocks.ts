import { resolveApiBaseUrl } from '@/services/api-config';
// Shared CMS block schema — the single source of truth used by BOTH the
// visual builder (features/admin-owner/cms-builder.tsx) and the public
// renderer (features/cms/cms-renderer.tsx). Each block maps to one
// cms_sections row: section_type = block.type, and all editable content lives
// in the row's `metadata` JSON so the block model is fully data-driven (no
// hardcoded page content).

export type CmsFieldType = 'text' | 'textarea' | 'image' | 'link' | 'color' | 'list';

export type CmsFieldSpec = {
  key: string;
  label: string;
  type: CmsFieldType;
  placeholder?: string;
  /** For 'list' fields: the shape of each item. */
  itemFields?: Array<{ key: string; label: string; type: Exclude<CmsFieldType, 'list'> }>;
};

export type CmsBlockDef = {
  type: string;
  label: string;
  icon: string; // lucide icon name (resolved in the builder)
  description: string;
  fields: CmsFieldSpec[];
  defaults: Record<string, unknown>;
};

export type CmsBlock = {
  id: number | string; // cms_sections.id, or a temp id for unsaved blocks
  type: string;
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
  // Top-level cms_sections columns. Most block types keep their content in
  // `metadata`, but hero_slider slides are authored through the generic CMS
  // form, which writes these columns instead.
  title?: string | null;
  body?: string | null;
  image_path?: string | null;
  link?: string | null;
};

/** All available block types an editor can drop onto the page. */
export const CMS_BLOCKS: CmsBlockDef[] = [
  {
    type: 'hero',
    label: 'Hero',
    icon: 'Sparkles',
    description: 'Bagian pembuka besar dengan judul, subjudul, dan tombol.',
    fields: [
      { key: 'eyebrow', label: 'Label kecil', type: 'text', placeholder: 'SJT Travel & Tour' },
      { key: 'title', label: 'Judul utama', type: 'text', placeholder: 'Perjalanan yang mulus…' },
      { key: 'subtitle', label: 'Subjudul', type: 'textarea', placeholder: 'Deskripsi singkat…' },
      { key: 'cta_label', label: 'Teks tombol', type: 'text', placeholder: 'Lihat jadwal' },
      { key: 'cta_link', label: 'Link tombol', type: 'link', placeholder: '/jadwal' },
      { key: 'image', label: 'Gambar', type: 'image' },
    ],
    defaults: { eyebrow: 'SJT Travel & Tour', title: 'Perjalanan yang mulus, dari pemesanan hingga tiba di tujuan.', subtitle: 'Booking, pengelolaan armada, dan tracking dalam satu platform.', cta_label: 'Lihat jadwal', cta_link: '/jadwal', image: '' },
  },
  {
    type: 'banner',
    label: 'Banner',
    icon: 'Megaphone',
    description: 'Pita promosi lebar dengan teks dan tombol opsional.',
    fields: [
      { key: 'title', label: 'Teks banner', type: 'text', placeholder: 'Promo akhir tahun!' },
      { key: 'cta_label', label: 'Teks tombol', type: 'text' },
      { key: 'cta_link', label: 'Link tombol', type: 'link' },
      { key: 'bg_color', label: 'Warna latar', type: 'color' },
    ],
    defaults: { title: 'Diskon spesial rute Madura–Surabaya minggu ini!', cta_label: 'Pesan sekarang', cta_link: '/jadwal', bg_color: '#024ad8' },
  },
  {
    type: 'about',
    label: 'Tentang Kami',
    icon: 'Info',
    description: 'Blok teks profil perusahaan dengan gambar.',
    fields: [
      { key: 'title', label: 'Judul', type: 'text', placeholder: 'Tentang SJT' },
      { key: 'body', label: 'Isi', type: 'textarea' },
      { key: 'image', label: 'Gambar', type: 'image' },
    ],
    defaults: { title: 'Tentang SJT Travel', body: 'Sekawan Jaya Trans melayani perjalanan Madura–Surabaya dengan armada nyaman dan layanan tepat waktu.', image: '' },
  },
  {
    type: 'services',
    label: 'Layanan',
    icon: 'LayoutGrid',
    description: 'Grid kartu layanan/keunggulan.',
    fields: [
      { key: 'title', label: 'Judul bagian', type: 'text' },
      { key: 'items', label: 'Kartu', type: 'list', itemFields: [
        { key: 'title', label: 'Judul', type: 'text' },
        { key: 'body', label: 'Deskripsi', type: 'textarea' },
        { key: 'icon', label: 'Ikon (nama)', type: 'text' },
      ] },
    ],
    defaults: { title: 'Layanan Kami', items: [
      { title: 'Travel Reguler', body: 'Jadwal harian, kursi bisa dipilih, e-ticket QR.', icon: 'Car' },
      { title: 'Jastip / Kirim Paket', body: 'Titip barang antar kota, dilacak real-time.', icon: 'Package' },
      { title: 'Live Tracking', body: 'Pantau posisi driver & ETA dari genggaman.', icon: 'MapPin' },
    ] },
  },
  {
    type: 'stats',
    label: 'Statistik',
    icon: 'BarChart3',
    description: 'Deretan angka/statistik ringkas.',
    fields: [
      { key: 'items', label: 'Statistik', type: 'list', itemFields: [
        { key: 'value', label: 'Angka', type: 'text' },
        { key: 'label', label: 'Keterangan', type: 'text' },
      ] },
    ],
    defaults: { items: [
      { value: 'End-to-end', label: 'Booking sampai boarding' },
      { value: 'Real-time', label: 'Ketersediaan kursi' },
      { value: '24/7', label: 'Dukungan operasional' },
    ] },
  },
  {
    type: 'promo',
    label: 'Promo',
    icon: 'Tag',
    description: 'Sorotan promo dengan gambar dan tombol.',
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'body', label: 'Deskripsi', type: 'textarea' },
      { key: 'image', label: 'Gambar', type: 'image' },
      { key: 'cta_label', label: 'Teks tombol', type: 'text' },
      { key: 'cta_link', label: 'Link tombol', type: 'link' },
    ],
    defaults: { title: 'Promo Spesial', body: 'Hemat lebih banyak untuk perjalanan rombongan.', image: '', cta_label: 'Lihat promo', cta_link: '/packages' },
  },
  {
    type: 'testimonial',
    label: 'Testimoni',
    icon: 'Quote',
    description: 'Kutipan pelanggan.',
    fields: [
      { key: 'title', label: 'Judul bagian', type: 'text' },
      { key: 'items', label: 'Testimoni', type: 'list', itemFields: [
        { key: 'quote', label: 'Kutipan', type: 'textarea' },
        { key: 'author', label: 'Nama', type: 'text' },
      ] },
    ],
    defaults: { title: 'Apa Kata Pelanggan', items: [
      { quote: 'Bisa lihat posisi driver, jemputnya tepat waktu!', author: 'Siti A., Sumenep' },
    ] },
  },
  {
    type: 'faq',
    label: 'FAQ',
    icon: 'HelpCircle',
    description: 'Daftar tanya-jawab.',
    fields: [
      { key: 'title', label: 'Judul bagian', type: 'text' },
      { key: 'items', label: 'Pertanyaan', type: 'list', itemFields: [
        { key: 'q', label: 'Pertanyaan', type: 'text' },
        { key: 'a', label: 'Jawaban', type: 'textarea' },
      ] },
    ],
    defaults: { title: 'Pertanyaan Umum', items: [
      { q: 'Apakah bisa bayar DP dulu?', a: 'Bisa, tersedia opsi pembayaran DP pada paket tertentu.' },
    ] },
  },
  {
    type: 'contact',
    label: 'Kontak',
    icon: 'Phone',
    description: 'Informasi kontak & alamat.',
    fields: [
      { key: 'title', label: 'Judul', type: 'text' },
      { key: 'address', label: 'Alamat', type: 'textarea' },
      { key: 'phone', label: 'Telepon', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
    ],
    defaults: { title: 'Hubungi Kami', address: 'Sumenep, Madura', phone: '+62 800-0000-0000', email: 'mail@sekawanjayatrans.com' },
  },
  {
    type: 'footer',
    label: 'Footer',
    icon: 'PanelBottom',
    description: 'Bagian penutup halaman.',
    fields: [
      { key: 'company', label: 'Nama perusahaan', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'note', label: 'Catatan hak cipta', type: 'text' },
    ],
    defaults: { company: 'SJT Travel — Sekawan Jaya Trans', tagline: 'Perjalanan nyaman Madura ⇄ Surabaya', note: '© 2026 Sekawan Jaya Trans' },
  },
];

export const blockDef = (type: string): CmsBlockDef | undefined => CMS_BLOCKS.find((b) => b.type === type);

/** Build the absolute URL for a stored image path. */
export function cmsImageUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  // Derive the storage host from the resolved API URL so uploaded images keep
  // working when the API URL is configured at runtime rather than build time.
  const base = resolveApiBaseUrl().replace(/\/api\/?$/, '');
  return `${base}/storage/${path}`;
}
