<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\SiteContent;
use Illuminate\Database\Seeder;

/**
 * Default company profile for SJT Tour & Travel (PT. Sekawan Jaya Trans).
 *
 * This is the *default* only — owner & admin can edit every field from
 * Dashboard → Pusat CMS → Profil Perusahaan at any time, and re-running this
 * seeder never overwrites their edits (firstOrCreate).
 */
final class CompanyProfileSeeder extends Seeder
{
    public function run(): void
    {
        SiteContent::firstOrCreate(
            ['slug' => 'company-profile'],
            ['payload' => $this->payload()],
        );
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        return [
            'name' => 'SJT Tour & Travel',
            'legal_name' => 'PT. Sekawan Jaya Trans',
            'location' => 'Sumenep, Jawa Timur',
            'tagline' => 'Teman perjalanan yang dapat diandalkan.',
            'intro' => 'Berawal dari keinginan untuk menghadirkan layanan transportasi yang lebih nyaman dan dapat dipercaya, SJT Tour & Travel (PT. Sekawan Jaya Trans) hadir sebagai mitra perjalanan bagi masyarakat yang membutuhkan layanan travel, wisata, maupun pengiriman paket.',

            'story' => [
                'Berlokasi di Sumenep, Jawa Timur, kami melayani berbagai kebutuhan perjalanan dengan mengutamakan kenyamanan, keamanan, dan ketepatan waktu.',
                'Kami percaya bahwa setiap perjalanan bukan sekadar berpindah dari satu tempat ke tempat lain, tetapi juga tentang memberikan rasa tenang kepada setiap pelanggan.',
                'Karena itu, kami terus berupaya memberikan pelayanan yang ramah, armada yang terawat, serta pengemudi yang berpengalaman agar setiap perjalanan terasa lebih aman dan menyenangkan.',
            ],

            'vision' => 'Menjadi perusahaan transportasi dan perjalanan yang dipercaya masyarakat melalui pelayanan yang jujur, profesional, dan terus berkembang mengikuti kebutuhan zaman.',

            'mission' => [
                'Memberikan layanan transportasi yang aman, nyaman, dan tepat waktu.',
                'Mengutamakan kepuasan pelanggan dalam setiap perjalanan.',
                'Menjaga kualitas armada melalui perawatan yang rutin dan berkelanjutan.',
                'Mengembangkan layanan berbasis teknologi agar proses pemesanan menjadi lebih mudah dan efisien.',
                'Membangun hubungan jangka panjang dengan pelanggan melalui pelayanan yang konsisten dan dapat diandalkan.',
            ],

            'services' => [
                ['icon' => 'bus', 'title' => 'Travel Reguler', 'body' => 'Melayani perjalanan antarkota dengan jadwal keberangkatan yang teratur dan armada yang nyaman.'],
                ['icon' => 'map', 'title' => 'Tour & Wisata', 'body' => 'Melayani perjalanan wisata untuk keluarga, sekolah, instansi, komunitas, maupun perusahaan dengan layanan yang dapat disesuaikan dengan kebutuhan.'],
                ['icon' => 'car', 'title' => 'Carter Kendaraan', 'body' => 'Penyewaan kendaraan untuk berbagai keperluan, mulai dari perjalanan pribadi hingga kegiatan bisnis dan acara khusus.'],
                ['icon' => 'package', 'title' => 'Jasa Titip & Pengiriman Paket', 'body' => 'Layanan pengiriman barang dan titipan yang praktis, cepat, dan aman mengikuti rute perjalanan kami.'],
            ],

            'reasons_intro' => 'Kami memahami bahwa memilih jasa transportasi berarti mempercayakan keselamatan dan kenyamanan perjalanan kepada orang lain. Oleh karena itu, kami selalu berusaha memberikan pelayanan terbaik.',

            'reasons' => [
                ['icon' => 'shield', 'title' => 'Armada terawat', 'body' => 'Armada yang bersih dan terawat melalui perawatan rutin.'],
                ['icon' => 'users', 'title' => 'Pengemudi berpengalaman', 'body' => 'Pengemudi yang berpengalaman dan bertanggung jawab.'],
                ['icon' => 'sparkles', 'title' => 'Pelayanan ramah', 'body' => 'Pelayanan yang ramah serta responsif.'],
                ['icon' => 'clock', 'title' => 'Jadwal teratur', 'body' => 'Jadwal perjalanan yang teratur dan dapat diandalkan.'],
                ['icon' => 'wallet', 'title' => 'Harga transparan', 'body' => 'Harga yang transparan tanpa biaya tersembunyi.'],
                ['icon' => 'heart', 'title' => 'Terus meningkat', 'body' => 'Komitmen untuk terus meningkatkan kualitas layanan.'],
            ],

            'areas_intro' => 'SJT Tour & Travel melayani berbagai rute perjalanan dari dan menuju beberapa kota di Jawa Timur. Kami akan terus memperluas jangkauan layanan agar semakin banyak pelanggan dapat menikmati perjalanan yang aman dan nyaman.',

            'areas' => ['Sumenep', 'Surabaya', 'Sidoarjo', 'Pasuruan', 'Malang', 'Mojokerto', 'Jombang'],

            'commitment' => 'Kepercayaan pelanggan adalah hal yang paling berharga bagi kami. Oleh karena itu, kami akan terus menjaga kualitas pelayanan, meningkatkan kenyamanan perjalanan, dan berinovasi agar setiap pelanggan mendapatkan pengalaman terbaik setiap kali memilih SJT Tour & Travel.',

            'closing' => 'Terima kasih atas kepercayaan Anda. Kami siap menjadi teman perjalanan yang dapat diandalkan, kapan pun dan ke mana pun tujuan Anda.',
        ];
    }
}
