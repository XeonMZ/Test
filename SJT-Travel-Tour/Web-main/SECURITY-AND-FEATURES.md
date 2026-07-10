# SJT Travel & Tour — Laporan Keamanan & Status Fitur

Dokumen ini merangkum tiga hal yang diminta: (1) rebrand + navigasi, (2) kemampuan
owner/admin mengelola jadwal/harga/kendaraan, dan (3) hasil uji eksploitasi &
penetrasi celah keamanan.

---

## 1. Rebrand & navigasi

- Nama perusahaan kini **SJT Travel & Tour** (Sekawan Jaya Trans) di seluruh UI,
  metadata halaman, footer, dan `manifest.json`. Seluruh 57 berkas yang memuat "STMS"
  sudah diganti.
- **Logo** memakai PNG yang dilampirkan (`/public/sjt-logo.png`), tampil di header dan
  drawer navigasi. `next.config.ts` di-set `images.unoptimized` agar logo lokal render
  tanpa dependensi tambahan.
- **Navigasi kini via hamburger di mobile DAN desktop.** Sebelumnya mobile memakai
  bottom-tab yang hanya memuat 4 item (mayoritas menu tak terjangkau di ponsel).
  Bottom-tab dihapus; drawer geser kiri berlaku di semua ukuran layar, menutup otomatis
  saat memilih menu, bisa ditutup dengan Escape/overlay.

---

## 2. Owner & Admin: kelola jadwal, harga, dan kendaraan — SEKARANG BISA

Sebelumnya **tidak ada** cara membuat jadwal, rute, atau mengatur harga dari UI (hanya
`vehicleStore` yang ada). Katalog hanya bisa diisi lewat seeder. Ini gap fatal untuk
sistem travel dan sudah ditutup.

Controller baru `ManagementController` + endpoint (grup `admin`, role `admin,owner`):

| Fitur | Endpoint |
| --- | --- |
| Rute: list/buat/ubah | `GET/POST /admin/manage/routes`, `PATCH /admin/manage/routes/{id}` |
| Jadwal: list/buat/ubah/batal | `GET/POST /admin/manage/schedules`, `PATCH .../{id}`, `POST .../{id}/cancel` |
| Aturan harga: list/buat/ubah/hapus | `GET/POST /admin/manage/pricing`, `PATCH/DELETE .../{id}` |
| Kursi kendaraan: list/generate/toggle | `GET/POST /admin/manage/vehicles/{v}/seats*`, `PATCH .../seats/{seat}` |
| Opsi form (rute/armada/driver) | `GET /admin/manage/form-options` |

Halaman UI (untuk **admin** dan **owner**): `/{role}/manage/routes`, `/schedules`,
`/pricing`, `/seats`. Form membuat jadwal memilih rute + armada + driver + waktu + tarif;
generator kursi membuat denah massal (prefix + jumlah) yang langsung dipakai di pemilihan
kursi pelanggan.

**Aturan bisnis yang ditegakkan di server:**
- Membuat jadwal **menolak** bila armada atau driver sudah punya jadwal bertabrakan pada
  rentang waktu tersebut (mencegah double-booking armada).
- Tarif jadwal **tidak dapat diubah** setelah ada pemesanan aktif (mencegah desync jumlah
  yang sudah dibayar).
- Membatalkan jadwal ikut membatalkan trip terkait dalam satu transaksi.
- Setiap pembuatan jadwal otomatis membuat `Trip` berstatus `ready`, sehingga manifes
  penumpang & alur driver langsung berfungsi.
- Semua aksi tercatat di audit trail + activity log.

---

## 3. Apakah semua fitur bisa dipakai dari UI? — YA (dengan catatan)

Seluruh peran kini terhubung endpoint nyata, tanpa placeholder statis:

- **Customer:** booking wizard, pembayaran, e-ticket QR, batal booking, promo, membership,
  tracking GPS, notifikasi, riwayat pembayaran, profil.
- **Driver:** dashboard shift/trip dengan aksi, konsol check-in (verify QR → check-in →
  board → no-show), manifes penumpang, pendapatan, notifikasi, profil.
- **Admin:** konsol bermutasi (bookings, payments, customers, drivers, vehicles),
  broadcast notifikasi, settings, laporan, **+ kelola rute/jadwal/harga/kursi**.
- **Owner:** analytics, revenue, feature-flags, backup, laporan, health, audit logs,
  **+ semua kemampuan admin termasuk kelola operasional** (role owner mewarisi akses admin).

Catatan jujur: konsol check-in menerima payload QR via tempel/ketik; integrasi kamera
pemindai butuh library decode QR tambahan (alur server sudah lengkap).

---

## 4. Uji eksploitasi & penetrasi celah keamanan

Audit dilakukan pada permukaan serang: endpoint publik, autentikasi, IDOR,
mass-assignment, SQL injection, XSS, open-redirect, dan verifikasi webhook.

### Temuan & perbaikan

**[KRITIS] Webhook pembayaran palsu (gateway demo).**
`BetaPaymentGateway::verifyWebhook()` sebelumnya `return true` — menerima callback apa pun.
Karena gateway ini adalah default saat provider asli belum dikonfigurasi, penyerang bisa
mengirim `POST /v1/payments/webhook` dengan `transaction_status: settlement` dan
menerbitkan tiket **tanpa membayar**. Diperbaiki: gateway demo kini **menolak webhook di
lingkungan produksi**, dan di non-produksi mewajibkan HMAC-SHA256 dengan
`BETA_WEBHOOK_SECRET`. Gateway Midtrans asli sudah benar (SHA-512 + `hash_equals`,
aman timing attack).

**[SEDANG] Open redirect via `?next=`.**
Halaman login mengarahkan ke `next` mentah — `/login?next=https://evil.com` bisa dipakai
phishing. Diperbaiki: hanya path internal (`/…` bukan `//…`) yang diterima.

**[SEDANG] IDOR trip driver** (dari gelombang sebelumnya, dikonfirmasi tertutup):
`start-trip`/`finish-trip`/`location` memvalidasi trip milik driver yang login.

### Yang diuji dan ternyata AMAN

- **Privilege escalation saat register:** `role` di-hardcode `customer`; `RegisterRequest`
  tidak menerima `role`. Tidak bisa mendaftar sebagai owner/admin.
- **Mass-assignment:** meski model memakai `$guarded = ['id']`, semua controller menulis
  dari `$request->validate()` yang mem-whitelist field, dan `status` dibatasi `in:`.
  Tidak ada field liar yang lolos.
- **SQL injection:** seluruh `selectRaw` memakai string statis tanpa interpolasi input;
  sisanya Eloquent dengan parameter binding.
- **XSS:** nol `dangerouslySetInnerHTML`/`innerHTML`/`eval` di seluruh frontend.
- **Endpoint sensitif:** pembayaran, tiket, check-in, driver, owner, admin, dan
  production-readiness (backup/hapus-data) semua di belakang `auth:sanctum` + peran.
  Webhook publik hanya satu, dan terverifikasi signature.
- **Rate limiting:** login 5/menit, register 3/menit, reset password 3/menit (per email+IP),
  pembuatan pembayaran 30/menit, webhook 60/menit, aksi destruktif 6/menit.
- **Kepemilikan data:** booking, tiket, pembayaran, tracking, dan notifikasi semuanya
  di-scope ke pemilik; staf (admin/owner) memang berwenang lintas data.
- **Header keamanan:** `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, COOP; `X-Powered-By`/`Server` dihapus. `poweredByHeader:false` di Next.

### Rekomendasi lanjutan (belum wajib untuk berjalan)

1. Pertimbangkan memindahkan token dari `localStorage` ke cookie `httpOnly` untuk
   mengurangi dampak seandainya XSS muncul di masa depan (saat ini tidak ada XSS).
2. Tambah `Content-Security-Policy` ketat di sisi Next/proxy.
3. Rotasi & masa berlaku token API (sudah ada expiry via Sanctum; pastikan
   `token_expiration_minutes` diset wajar di produksi).
4. Uji otomatis (feature test) untuk alur booking→bayar→tiket dan untuk setiap kontrol
   akses peran.

---

## 5. Menjalankan

```bash
# Backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed          # termasuk tabel driver_locations baru
# WAJIB untuk produksi: konfigurasi provider pembayaran asli
#   set stms.optional_services_enabled=true + MIDTRANS_SERVER_KEY
# atau untuk demo aman: set BETA_WEBHOOK_SECRET
php artisan queue:work &            # job kedaluwarsa pembayaran & rilis kursi
php artisan serve

# Frontend
cd frontend
npm install
npm run dev
```

Akun demo (password `password`): `admin@stms.test`, `owner@stms.test`,
`customer@stms.test`, `driver@stms.test`.
