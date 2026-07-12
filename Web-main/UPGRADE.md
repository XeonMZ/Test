# STMS — Catatan Upgrade Enterprise

Dokumen ini merangkum perubahan yang dilakukan untuk mengubah STMS dari fondasi
dengan banyak halaman placeholder menjadi sistem pemesanan yang **benar-benar berjalan
end-to-end**, dengan kontrol akses yang layak produksi.

---

## 1. Ringkasan

Sebelum upgrade, backend sudah memiliki modul booking/payment/ticket yang solid, tetapi:

- Tidak ada endpoint katalog publik, sehingga **alur pemesanan mustahil dijalankan** dari frontend.
- Endpoint `/api/v1/payments`, `/api/v1/tickets`, dan seluruh `check-in` **terbuka tanpa autentikasi**.
- `POST /api/booking` menerima `customer_id` dari klien → **IDOR** (siapa pun bisa memesan atas nama orang lain).
- `GET /api/v1/tickets` mengembalikan 50 tiket terbaru **milik semua orang**.
- Halaman `/booking` di frontend hanya berisi teks "reserved for next sprint".
- Tidak ada endpoint analytics/revenue untuk peran owner.

Semua poin di atas sudah ditangani.

---

## 2. Endpoint baru

### Katalog publik (tanpa autentikasi, `throttle:120,1`)

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/api/catalog/routes` | Daftar rute beserta titik jemput & turun |
| GET | `/api/catalog/schedules` | Cari jadwal (`origin`, `destination`, `date`, `route_id`), termasuk `seats_available` |
| GET | `/api/catalog/schedules/{uuid}/seats` | Denah kursi live dengan status ketersediaan |

Ketersediaan kursi dihitung dengan logika yang sama dengan `BookingValidationService`:
kursi dianggap terpakai bila reservasinya `confirmed/paid/ticket_generated`, atau masih
`locked/waiting_payment` dengan `locked_until` di masa depan.

### Owner analytics (`auth:sanctum` + `role:owner`)

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/api/owner/analytics` | KPI, distribusi status booking, tren 14 hari, rute terlaris |
| GET | `/api/owner/revenue?days=7..90` | Deret pendapatan harian, per rute, dan per status pembayaran |

Semua angka dihitung langsung dari tabel operasional — tidak ada data yang dikarang.

---

## 3. Perbaikan keamanan

| # | Masalah | Perbaikan |
| --- | --- | --- |
| 1 | `/v1/payments`, `/v1/tickets`, `/check-in`, `/trips/{trip}/passengers` publik | Kini di bawah `auth:sanctum` + `active` + `maintenance`. Aksi operasional (verify, check-in, board, daftar penumpang) tambahan `role:driver,admin,owner` |
| 2 | Webhook gateway ikut terkunci akan merusak integrasi | `POST /v1/payments/webhook` sengaja tetap publik — sudah diverifikasi tanda tangan di `PaymentWebhookService` — namun kini dibatasi `throttle:60,1` |
| 3 | IDOR pada `POST /booking` | `customer_id` diabaikan bila peran = customer; diambil dari user terautentikasi. Staff (admin/owner) tetap boleh memesan atas nama customer |
| 4 | IDOR pada `booking/{id}`, `booking/cancel`, `booking/lock-seat`, `booking/release-seat` | Ditambah pengecekan kepemilikan (`assertOwnership`); customer hanya bisa menyentuh booking miliknya |
| 5 | Kebocoran data pada `GET /v1/tickets` | Di-scope ke tiket milik customer yang login; admin/owner/driver tetap melihat semua |
| 6 | `GET /v1/tickets/{id}` & `/qr` bisa dibaca siapa saja | Pengecekan kepemilikan tiket |
| 7 | `GET /v1/payments/{uuid}` bisa dibaca siapa saja, dan mengembalikan `null` diam-diam | Pengecekan kepemilikan booking + `404` bila tidak ditemukan |
| 8 | `method` pembayaran tidak divalidasi | Dibatasi ke `qris,virtual_account,va,bank_transfer,ewallet,snap` |
| 9 | Header keamanan tidak ada | Middleware `SecurityHeaders` (nosniff, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP; menghapus `X-Powered-By`/`Server`) diterapkan ke seluruh respons API |

---

## 4. Frontend — alur yang kini berfungsi

**Beranda → Booking → Pembayaran → Tiket QR**, seluruhnya terhubung ke API nyata.

- `app/page.tsx` — hero search fungsional (`features/booking/hero-search.tsx`), opsi kota diambil dari `/catalog/routes`, submit mengarah ke wizard.
- `app/booking/page.tsx` — **wizard 4 langkah** (`features/booking/booking-wizard.tsx`):
  1. Cari & pilih jadwal (daftar live, sisa kursi)
  2. Pilih kursi pada denah interaktif (auto-refresh 15 detik)
  3. Isi data penumpang per kursi (validasi nama)
  4. Review & konfirmasi → `POST /booking` → diarahkan ke pembayaran
- `app/payment/*` — pilih metode, countdown kedaluwarsa, polling status tiap 4 detik,
  lalu halaman `success` / `failed` / `expired` yang proper.
- `app/customer/page.tsx` — dashboard dengan statistik nyata, banner "menunggu pembayaran", booking terbaru.
- `app/customer/bookings` & `[id]` — daftar + detail booking (penumpang, kursi, pembayaran, aksi batal).
- `app/customer/tickets` & `[id]` — daftar tiket dan **e-ticket dengan QR** (`qrcode.react`), payload dari `/v1/tickets/{id}/qr`, disegarkan tiap 60 detik.
- `app/customer/payment` — riwayat pembayaran yang diturunkan dari data booking.
- `app/owner/analytics` & `app/owner/revenue` — KPI dan grafik dari endpoint owner baru
  (chart CSS murni, tanpa dependensi tambahan).
- `app/error.tsx` dan `app/not-found.tsx` — penanganan galat & 404 global.
- `shared/providers/toast-provider.tsx` — notifikasi aksi yang konsisten di seluruh aplikasi.

Lapisan API terketik ada di `services/stms.ts`.

---

## 5. Dependensi baru

Hanya satu, di `frontend/package.json`:

```json
"qrcode.react": "^4.2.0"
```

Grafik owner sengaja dibuat dengan CSS murni agar bundle tetap ringan.

---

## 6. Menjalankan

```bash
# Backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed        # membuat akun demo + rute/jadwal contoh
php artisan queue:work &          # penting: job kedaluwarsa pembayaran & rilis kursi
php artisan serve                 # http://localhost:8000

# Frontend
cd frontend
npm install                       # menarik qrcode.react
npm run dev                       # http://localhost:3000
```

Akun demo (semua berpassword `password`):

| Peran | Email |
| --- | --- |
| Admin | `admin@stms.test` |
| Owner | `owner@stms.test` |
| Customer | `customer@stms.test` |
| Driver | `driver@stms.test` |

> **Catatan:** `queue:work` wajib berjalan. Tanpa worker, `PaymentExpiredJob` tidak
> pernah dieksekusi sehingga kursi yang dikunci tidak akan dirilis otomatis.

---

## 7. Uji alur end-to-end

1. Login sebagai `customer@stms.test`.
2. Buka **/booking**, cari jadwal (seeder menyediakan rute Jakarta–Bandung).
3. Pilih kursi → isi penumpang → konfirmasi. Booking dibuat, kursi dikunci.
4. Pilih metode pembayaran. Halaman menunggu akan melakukan polling status.
5. Simulasikan callback gateway ke `POST /api/v1/payments/webhook` dengan tanda tangan valid
   (lihat `PaymentWebhookService`), atau ubah status pembayaran langsung di database untuk demo.
6. Tiket terbit → buka **/customer/tickets** → QR siap dipindai driver via `POST /api/v1/tickets/verify`.

---

## 8. Status fungsional per peran — FINAL: nol placeholder statis

Seluruh halaman pada keempat peran kini membaca/menulis ke endpoint nyata.

**Customer:** beranda → booking wizard → pembayaran → e-ticket QR → batal booking;
`promo` & `promo/[id]` (endpoint baru `GET /customer/promos`), `membership` (endpoint baru,
auto-provision level bronze), `tracking` (endpoint baru `GET /customer/bookings/{uuid}/tracking`,
polling 10 detik, tautan Google Maps), `notifications` (endpoint baru per-user), `payment`
(riwayat), `profile` (form update nyata via `PUT /profile`), `trip-history` (data live).

**Driver:** dashboard operasional dengan aksi nyata (mulai/akhiri shift, istirahat/lanjut,
mulai/selesaikan trip), konsol `check-in` (verifikasi payload QR → check-in → boarding →
no-show), manifes penumpang per trip (auto-refresh), `earnings` (statistik nyata),
`notifications`, `profile`. Halaman `trips/history/timeline` membaca endpoint driver live.

**Admin:** seluruh konsol kini bermutasi — `bookings` (batalkan + konfirmasi), `payments`
(tandai gagal), `customers` (aktif/nonaktifkan akun), `drivers` (ubah status operasional),
`vehicles` (ubah status; non-aktif otomatis hilang dari katalog), `notifications`
(form broadcast per peran + riwayat), `settings` (editor key-value dengan audit trail),
`reports` (laporan 30 hari nyata), `operations`/`tickets` (list live), `profile`.

**Owner:** dashboard analytics bisnis, `analytics`, `revenue`, `feature-flags` (toggle),
`backup` (backup/ekspor/hapus data demo), `reports` (halaman laporan baru), serta
`drivers/fleet/logs/notifications/settings/health` membaca endpoint live.

Rute statis lawas `/ticket`, `/ticket/[id]`, `/ticket/qr` dialihkan (redirect) ke portal
tiket customer yang nyata. Pusat notifikasi lama berbasis data seed telah diganti penuh.

## 9. Endpoint baru gelombang 2

| Method | Path | Keterangan |
| --- | --- | --- |
| GET | `/api/customer/promos`, `/api/customer/promos/{uuid|code}` | Promo aktif + voucher aktif |
| GET | `/api/customer/membership` | Membership customer (auto-provision bronze) |
| GET | `/api/customer/bookings/{uuid}/tracking` | Status trip + posisi GPS terakhir (cek kepemilikan, throttle 120/menit) |
| GET | `/api/notifications` | Notifikasi milik user yang login (semua peran) |
| POST | `/api/notifications/{uuid}/read`, `/api/notifications/read-all` | Tandai dibaca |
| GET/PATCH | `/api/owner/feature-flags` | Lihat & toggle flag (cache dibersihkan otomatis) |

## 10. Perbaikan keamanan gelombang 2

| # | Masalah | Perbaikan |
| --- | --- | --- |
| 10 | GPS driver disimpan **in-memory** — hilang antar request, tracking mustahil | Tabel `driver_locations` baru + `EloquentDriverLocationRepository`, binding diganti |
| 11 | `POST /v1/driver/start-trip` & `finish-trip` menerima `trip_id` bebas — driver bisa memulai/menyelesaikan trip driver lain (IDOR) | Validasi kepemilikan: trip harus milik driver yang login |
| 12 | `POST /v1/driver/location` tidak memvalidasi kepemilikan trip & rentang koordinat | Cek kepemilikan + validasi lat -90..90, lng -180..180, battery 0..100 |
| 13 | Grup `/v1/driver/*` tanpa middleware peran | Ditambah `role:driver` |
| 14 | `driver_uuid` pada check-in/no-show dikirim dari klien — scan bisa diatasnamakan driver lain | Untuk peran driver, `driver_uuid` selalu diambil dari akun yang login; staf wajib menyuplai eksplisit |
| 15 | Notifikasi bisa dibaca lintas user? | Endpoint notifikasi baru selalu di-scope `user_id` yang login, termasuk mark-as-read |

## 11. Pekerjaan lanjutan yang disarankan

1. Integrasi pemindai kamera (getUserMedia + lib decode QR) pada konsol check-in — saat ini input payload tempel/ketik, alur server sudah lengkap.
2. Redemption voucher pada alur pembayaran (endpoint apply-voucher belum ada).
3. Pengujian otomatis alur booking→pembayaran→tiket→check-in; rate limit per pengguna pada pembuatan booking.
4. Pertimbangkan retensi/pruning tabel `driver_locations` (mis. hapus data > 30 hari) via scheduled job.
