# SJT — Akses Tamu, Booking Wajib Login, & Pemindai QR

Ringkasan perubahan pada iterasi ini.

## 1. Tamu bisa lihat jadwal, booking wajib login

- Halaman publik baru **`/jadwal`** (`PublicSchedules`): siapa pun — termasuk tamu yang
  belum login — dapat mencari dan melihat jadwal keberangkatan beserta harga dan sisa
  kursi. Endpoint katalog memang publik, jadi tidak ada data sensitif yang bocor.
- Tombol **"Pesan"** pada tiap jadwal:
  - Jika sudah login → langsung ke `/booking` dengan konteks rute/tanggal terisi.
  - Jika tamu → diarahkan ke `/login?next=/booking?...`, sehingga setelah masuk langsung
    melanjutkan pemesanan. (Parameter `next` sudah difilter agar hanya menerima path
    internal — tidak bisa dipakai open-redirect.)
- `/booking` tetap **bukan** halaman publik: bila tamu membukanya langsung, `AppShell`
  otomatis mengalihkan ke login. Backend juga menolak pembuatan booking tanpa auth
  (`auth:sanctum` + `permission:booking:create`). Jadi ada tiga lapis: menu, guard rute,
  dan otorisasi server.
- Landing page, hero search, dan menu tamu kini menunjuk ke `/jadwal` (bukan `/booking`
  atau `/customer/tracking` yang butuh login), sehingga tamu tidak lagi terpental ke login
  sebelum melihat apa pun.

## 2. Check-in penumpang: kode tiket + pindai QR (kamera / foto)

Konsol check-in (`/driver/check-in`) kini punya tiga mode, semuanya memanggil API nyata:

1. **Scan QR** — komponen `QrScanner`:
   - **Kamera langsung**: `navigator.mediaDevices.getUserMedia({ facingMode: 'environment' })`
     lalu loop `requestAnimationFrame` mendekode frame dengan **jsQR**. Begitu QR terbaca,
     kamera dimatikan dan payload diverifikasi + check-in otomatis.
   - **Unggah foto**: gambar didekode di `<canvas>` dengan jsQR — berguna bila kamera tidak
     tersedia atau penumpang mengirim tangkapan layar tiket.
   - Menangani penolakan izin kamera dengan pesan yang jelas dan menyarankan unggah foto.
     Stream kamera selalu dihentikan saat berpindah/menutup (tidak ada kebocoran kamera).
2. **Tempel payload** — menempel string payload QR mentah (mis. dari pemindai keras).
3. **Kode tiket** — memasukkan nomor tiket manusiawi (mis. `TIX-A1B2C3`) untuk kondisi
   QR rusak/tak terbaca. Endpoint baru `POST /v1/check-in/by-code` mencari tiket by
   `ticket_number` lalu menjalankan alur check-in yang sama.

### Keamanan pemindai

- Dekode QR sepenuhnya di sisi klien; hanya string payload yang dikirim ke server.
- Semua endpoint check-in (`/v1/check-in`, `/v1/check-in/by-code`, board, no-show) tetap
  di belakang `auth:sanctum` + `role:driver,admin,owner`, dan `driver_uuid` untuk peran
  driver selalu diambil dari akun yang login (tidak bisa dipalsukan).
- `Permissions-Policy` diperbarui menjadi `camera=(self)` agar pemindai berfungsi;
  mikrofon tetap diblokir.
- Payload QR asli tetap bertanda tangan (`verification_token` + signature) dan diverifikasi
  server, sehingga QR palsu ditolak. Mode kode tiket mengandalkan nomor tiket yang unik dan
  hanya dapat dipakai oleh peran petugas.

### Dependensi baru

`jsqr` (^1.4.0) di `frontend/package.json` — pustaka murni JS untuk mendekode QR dari
`ImageData`, ringan dan tanpa akses jaringan.

### Catatan lingkungan

Kamera membutuhkan **HTTPS** (atau `localhost` saat pengembangan). Di produksi, pastikan
aplikasi frontend disajikan melalui HTTPS agar `getUserMedia` diizinkan browser.
