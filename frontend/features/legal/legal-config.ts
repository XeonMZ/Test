/**
 * Single source of truth for the legal system.
 *
 * The live text always comes from the database (CMS), so owners can edit it
 * without a redeploy. The bundled `fallbackBody` below is only rendered when
 * the API is unreachable, so the pages never 500 and never show a blank
 * document to a crawler.
 */

export const LEGAL_SLUGS = ['privacy-policy', 'terms-and-conditions', 'refund-policy', 'contact', 'copyright'] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export type LegalDocument = {
  slug: LegalSlug;
  title: string;
  meta_description: string | null;
  body: string;
  updated_at: string;
};

export type LegalPageConfig = {
  slug: LegalSlug;
  /** Short label used in the footer and breadcrumbs. */
  navLabel: string;
  /** Default heading, overridden by the CMS title when present. */
  title: string;
  /** Sub-heading rendered in the hero. */
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  fallbackBody: string;
};

const FALLBACK_PRIVACY = `SJT Tour & Travel (PT. Sekawan Jaya Trans) berkomitmen untuk menjaga kerahasiaan dan melindungi data pribadi setiap pelanggan yang menggunakan layanan kami. Dengan mengakses website atau menggunakan layanan kami, pelanggan dianggap telah membaca, memahami, dan menyetujui Kebijakan Privasi ini.

## Informasi yang Kami Kumpulkan

- Nama lengkap
- Nomor telepon
- Alamat email
- Alamat penjemputan dan tujuan
- Data pemesanan dan riwayat transaksi
- Informasi perangkat serta alamat IP
- Data lokasi (apabila pelanggan memberikan izin)

## Penggunaan Informasi

- Memproses pemesanan.
- Menghubungi pelanggan.
- Mengirim notifikasi transaksi.
- Meningkatkan kualitas layanan.
- Memenuhi kewajiban hukum.

## Kerahasiaan Data

Kami menjaga keamanan data pelanggan dengan langkah teknis dan administratif yang wajar.

## Pembagian Informasi

Data tidak diperjualbelikan dan hanya dibagikan kepada pihak yang diperlukan untuk penyelenggaraan layanan atau apabila diwajibkan oleh hukum.

## Hak Pelanggan

Pelanggan dapat memperbarui data, meminta koreksi, dan menghubungi kami terkait penggunaan data pribadi.

## Perubahan Kebijakan

Kebijakan ini dapat diperbarui sewaktu-waktu melalui website resmi.`;

const FALLBACK_TERMS = `Dengan menggunakan layanan kami, pelanggan dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan.

## Pemesanan

Pelanggan wajib memberikan data yang benar. Pemesanan dianggap sah setelah dikonfirmasi sistem.

## Pembayaran

Pembayaran dilakukan melalui metode yang tersedia. Pesanan dapat dibatalkan apabila pembayaran tidak diselesaikan sesuai batas waktu.

## Perubahan Jadwal

Mengikuti ketersediaan kursi dan kebijakan operasional.

## Tanggung Jawab

Perusahaan tidak bertanggung jawab atas keterlambatan akibat keadaan di luar kendali seperti kemacetan, cuaca, bencana alam, kecelakaan, atau force majeure.

## Larangan

Dilarang memberikan data palsu, menyalahgunakan layanan, atau melakukan tindakan yang merugikan perusahaan maupun pelanggan lain.`;

const FALLBACK_REFUND = `Pengajuan refund dapat dilakukan sesuai ketentuan yang berlaku.

## Nilai Pengembalian

Apabila refund disetujui, dana yang dikembalikan adalah nilai transaksi setelah dikurangi biaya administrasi.

## Biaya Administrasi

Biaya administrasi merupakan biaya layanan dan bersifat tidak dapat dikembalikan (non-refundable), kecuali diwajibkan lain oleh peraturan perundang-undangan yang berlaku.

## Verifikasi

Setiap permohonan refund akan diverifikasi sebelum diproses.`;

const FALLBACK_CONTACT = `Apabila memiliki pertanyaan, kritik, atau saran, silakan menghubungi SJT Tour & Travel (PT. Sekawan Jaya Trans) melalui informasi kontak yang tersedia pada halaman ini.

Tim kami akan menanggapi pesan Anda pada jam operasional yang tercantum.`;

const FALLBACK_COPYRIGHT = `© 2026 SJT Tour & Travel (PT. Sekawan Jaya Trans). Seluruh Hak Dilindungi Undang-Undang.

Seluruh konten website merupakan milik perusahaan dan tidak boleh digunakan tanpa izin tertulis.

## Cakupan Perlindungan

Perlindungan ini mencakup teks, gambar, logo, desain antarmuka, serta seluruh materi lain yang ditampilkan pada website resmi kami.

## Permintaan Izin

Permohonan izin penggunaan konten dapat diajukan melalui informasi kontak resmi perusahaan.`;

export const LEGAL_PAGES: Record<LegalSlug, LegalPageConfig> = {
  'privacy-policy': {
    slug: 'privacy-policy',
    navLabel: 'Kebijakan Privasi',
    title: 'Kebijakan Privasi',
    tagline: 'Bagaimana SJT Tour & Travel mengumpulkan, menggunakan, dan melindungi data pribadi Anda.',
    metaTitle: 'Kebijakan Privasi',
    metaDescription:
      'Kebijakan Privasi SJT Tour & Travel (PT. Sekawan Jaya Trans): data yang kami kumpulkan, cara penggunaannya, kerahasiaan, serta hak Anda sebagai pelanggan.',
    keywords: ['kebijakan privasi', 'privacy policy', 'perlindungan data', 'SJT Travel', 'Sekawan Jaya Trans'],
    fallbackBody: FALLBACK_PRIVACY,
  },
  'terms-and-conditions': {
    slug: 'terms-and-conditions',
    navLabel: 'Syarat & Ketentuan',
    title: 'Syarat & Ketentuan',
    tagline: 'Ketentuan yang berlaku saat Anda memesan dan menggunakan layanan SJT Tour & Travel.',
    metaTitle: 'Syarat & Ketentuan',
    metaDescription:
      'Syarat & Ketentuan layanan SJT Tour & Travel (PT. Sekawan Jaya Trans): pemesanan, pembayaran, perubahan jadwal, tanggung jawab, dan larangan penggunaan.',
    keywords: ['syarat dan ketentuan', 'terms and conditions', 'ketentuan layanan', 'SJT Travel'],
    fallbackBody: FALLBACK_TERMS,
  },
  'refund-policy': {
    slug: 'refund-policy',
    navLabel: 'Kebijakan Refund',
    title: 'Kebijakan Pengembalian Dana (Refund)',
    tagline: 'Ketentuan pengajuan, verifikasi, dan perhitungan pengembalian dana.',
    metaTitle: 'Kebijakan Pengembalian Dana (Refund)',
    metaDescription:
      'Kebijakan Pengembalian Dana SJT Tour & Travel (PT. Sekawan Jaya Trans): syarat pengajuan refund, potongan biaya administrasi, dan proses verifikasi.',
    keywords: ['kebijakan refund', 'pengembalian dana', 'refund policy', 'SJT Travel'],
    fallbackBody: FALLBACK_REFUND,
  },
  contact: {
    slug: 'contact',
    navLabel: 'Kontak',
    title: 'Kontak',
    tagline: 'Hubungi tim SJT Tour & Travel untuk pertanyaan, kritik, maupun saran.',
    metaTitle: 'Kontak',
    metaDescription:
      'Hubungi SJT Tour & Travel (PT. Sekawan Jaya Trans): alamat kantor, email, nomor telepon, dan jam operasional layanan travel serta jasa titip.',
    keywords: ['kontak SJT', 'hubungi kami', 'alamat SJT Travel', 'customer service travel'],
    fallbackBody: FALLBACK_CONTACT,
  },
  copyright: {
    slug: 'copyright',
    navLabel: 'Hak Cipta',
    title: 'Hak Cipta',
    tagline: 'Ketentuan kepemilikan dan penggunaan seluruh konten website resmi kami.',
    metaTitle: 'Hak Cipta',
    metaDescription:
      'Informasi hak cipta SJT Tour & Travel (PT. Sekawan Jaya Trans). Seluruh konten website merupakan milik perusahaan dan dilindungi undang-undang.',
    keywords: ['hak cipta', 'copyright', 'kepemilikan konten', 'SJT Travel'],
    fallbackBody: FALLBACK_COPYRIGHT,
  },
};

/** Footer / navigation ordering. */
export const LEGAL_NAV: Array<{ href: string; label: string }> = LEGAL_SLUGS.map((slug) => ({
  href: `/${slug}`,
  label: LEGAL_PAGES[slug].navLabel,
}));
