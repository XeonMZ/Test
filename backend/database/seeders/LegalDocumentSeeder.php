<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\LegalDocument;
use Illuminate\Database\Seeder;

/**
 * Idempotent seeder for the five legal pages.
 *
 * Uses firstOrCreate so a re-run never overwrites text an owner has edited in
 * the CMS — it only fills in a document that does not exist yet.
 */
final class LegalDocumentSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->documents() as $doc) {
            LegalDocument::firstOrCreate(['slug' => $doc['slug']], $doc);
        }
    }

    /** @return array<int, array<string, string>> */
    private function documents(): array
    {
        return [
            [
                'slug' => 'privacy-policy',
                'title' => 'Kebijakan Privasi',
                'meta_description' => 'Kebijakan Privasi SJT Tour & Travel (PT. Sekawan Jaya Trans): data yang kami kumpulkan, cara penggunaannya, dan hak Anda sebagai pelanggan.',
                'body' => <<<'TEXT'
SJT Tour & Travel (PT. Sekawan Jaya Trans) berkomitmen untuk menjaga kerahasiaan dan melindungi data pribadi setiap pelanggan yang menggunakan layanan kami. Dengan mengakses website atau menggunakan layanan kami, pelanggan dianggap telah membaca, memahami, dan menyetujui Kebijakan Privasi ini.

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

Kebijakan ini dapat diperbarui sewaktu-waktu melalui website resmi.
TEXT,
            ],
            [
                'slug' => 'terms-and-conditions',
                'title' => 'Syarat & Ketentuan',
                'meta_description' => 'Syarat & Ketentuan layanan SJT Tour & Travel (PT. Sekawan Jaya Trans): pemesanan, pembayaran, perubahan jadwal, tanggung jawab, dan larangan.',
                'body' => <<<'TEXT'
Dengan menggunakan layanan kami, pelanggan dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan.

## Pemesanan

Pelanggan wajib memberikan data yang benar. Pemesanan dianggap sah setelah dikonfirmasi sistem.

## Pembayaran

Pembayaran dilakukan melalui metode yang tersedia. Pesanan dapat dibatalkan apabila pembayaran tidak diselesaikan sesuai batas waktu.

## Perubahan Jadwal

Mengikuti ketersediaan kursi dan kebijakan operasional.

## Tanggung Jawab

Perusahaan tidak bertanggung jawab atas keterlambatan akibat keadaan di luar kendali seperti kemacetan, cuaca, bencana alam, kecelakaan, atau force majeure.

## Larangan

Dilarang memberikan data palsu, menyalahgunakan layanan, atau melakukan tindakan yang merugikan perusahaan maupun pelanggan lain.
TEXT,
            ],
            [
                'slug' => 'refund-policy',
                'title' => 'Kebijakan Pengembalian Dana (Refund)',
                'meta_description' => 'Kebijakan Pengembalian Dana SJT Tour & Travel (PT. Sekawan Jaya Trans): pengajuan refund, potongan biaya administrasi, dan proses verifikasi.',
                'body' => <<<'TEXT'
Pengajuan refund dapat dilakukan sesuai ketentuan yang berlaku.

## Nilai Pengembalian

Apabila refund disetujui, dana yang dikembalikan adalah nilai transaksi setelah dikurangi biaya administrasi.

## Biaya Administrasi

Biaya administrasi merupakan biaya layanan dan bersifat tidak dapat dikembalikan (non-refundable), kecuali diwajibkan lain oleh peraturan perundang-undangan yang berlaku.

## Verifikasi

Setiap permohonan refund akan diverifikasi sebelum diproses.
TEXT,
            ],
            [
                'slug' => 'contact',
                'title' => 'Kontak',
                'meta_description' => 'Hubungi SJT Tour & Travel (PT. Sekawan Jaya Trans) untuk pertanyaan, kritik, maupun saran mengenai layanan travel dan jasa titip kami.',
                'body' => <<<'TEXT'
Apabila memiliki pertanyaan, kritik, atau saran, silakan menghubungi SJT Tour & Travel (PT. Sekawan Jaya Trans) melalui informasi kontak yang tersedia pada halaman ini.

Tim kami akan menanggapi pesan Anda pada jam operasional yang tercantum.
TEXT,
            ],
            [
                'slug' => 'copyright',
                'title' => 'Hak Cipta',
                'meta_description' => 'Informasi hak cipta SJT Tour & Travel (PT. Sekawan Jaya Trans). Seluruh konten website merupakan milik perusahaan.',
                'body' => <<<'TEXT'
© 2026 SJT Tour & Travel (PT. Sekawan Jaya Trans). Seluruh Hak Dilindungi Undang-Undang.

Seluruh konten website merupakan milik perusahaan dan tidak boleh digunakan tanpa izin tertulis.

## Cakupan Perlindungan

Perlindungan ini mencakup teks, gambar, logo, desain antarmuka, serta seluruh materi lain yang ditampilkan pada website resmi kami.

## Permintaan Izin

Permohonan izin penggunaan konten dapat diajukan melalui informasi kontak resmi perusahaan.
TEXT,
            ],
        ];
    }
}
