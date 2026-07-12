# Panduan Deploy Railway — SJT Travel & Tour

Dua error yang kamu temui semuanya soal **konfigurasi environment**, bukan bug kode:

1. `Could not find a production build` → sudah beres (railway.json + nixpacks.toml).
2. `Unable to check installer status` → frontend tidak menemukan backend.

Dokumen ini menuntaskan #2 dan menjelaskan arsitektur yang benar.

---

## Arsitektur: DUA service terpisah

SJT terdiri dari dua aplikasi berbeda. Keduanya harus jalan sebagai service Railway
terpisah, plus satu database:

```
┌─────────────────┐      HTTPS /api      ┌─────────────────┐
│  FRONTEND        │ ───────────────────▶ │  BACKEND         │
│  Next.js         │                      │  Laravel (PHP)   │
│  (folder /frontend)                     │  (folder /backend)
└─────────────────┘                      └────────┬─────────┘
                                                   │
                                          ┌────────▼─────────┐
                                          │  MySQL / Postgres │
                                          └──────────────────┘
```

Dari screenshot, yang sudah jalan baru **frontend**. Backend kemungkinan **belum
di-deploy** — itulah kenapa `/installer/status` gagal.

---

## Langkah 1 — Deploy BACKEND (Laravel)

1. Di project Railway yang sama, **New → GitHub Repo** (repo yang sama), lalu di
   **Settings → Root Directory** set ke `backend`.
2. Tambahkan database: **New → Database → MySQL** (atau Postgres).
3. Set environment variables backend (Variables tab):

   ```
   APP_KEY=                 # generate: php artisan key:generate --show, tempel di sini
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://<backend-anda>.up.railway.app

   # Railway MySQL menyediakan variabel ini otomatis — hubungkan via reference:
   DB_CONNECTION=mysql
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_DATABASE=${{MySQL.MYSQLDATABASE}}
   DB_USERNAME=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

   # WAJIB agar frontend boleh memanggil API (lihat config/cors.php):
   FRONTEND_URL=https://<frontend-anda>.up.railway.app

   # Sanctum:
   SANCTUM_STATEFUL_DOMAINS=<frontend-anda>.up.railway.app

   # Untuk demo tanpa gateway asli, amankan webhook beta:
   BETA_WEBHOOK_SECRET=<string-acak-panjang>
   ```

4. **Start command** backend (Settings → Deploy):

   ```
   php artisan migrate --force && php artisan config:cache && php artisan serve --host 0.0.0.0 --port $PORT
   ```

   > Untuk produksi sungguhan, lebih baik pakai `php-fpm` + nginx (atau image
   > FrankenPHP/Octane). `artisan serve` cukup untuk menguji dulu.
   > Seed data contoh sekali saja: jalankan `php artisan migrate --seed --force`
   > pada deploy pertama, lalu kembalikan ke `migrate --force` saja.

5. Pastikan **queue worker** jalan (untuk kedaluwarsa pembayaran & rilis kursi).
   Cara termudah: service kedua dari folder `backend` dengan start command
   `php artisan queue:work`.

---

## Langkah 2 — Sambungkan FRONTEND ke BACKEND

Di service **frontend**, tab Variables:

```
NEXT_PUBLIC_API_URL=https://<backend-anda>.up.railway.app/api
```

⚠️ **PENTING — ini penyebab error "Unable to check installer status":**

`NEXT_PUBLIC_*` di Next.js dibakar saat **BUILD**, bukan runtime. Jadi:

1. Set `NEXT_PUBLIC_API_URL` **dulu**.
2. **Redeploy** frontend (trigger build baru) — tanpa ini, nilai lama (kosong →
   `http://localhost:8000/api`) tetap terpakai dan error tidak hilang.

Jangan lupa akhiran `/api` (karena route Laravel berada di bawah prefix `api`).

---

## Langkah 3 — Verifikasi

1. Buka `https://<backend-anda>.up.railway.app/api/installer/status` langsung di browser.
   Harus mengembalikan JSON (bukan error koneksi). Kalau ini gagal, masalah di backend,
   bukan frontend.
2. Buka frontend `/install`. Pesan "Unable to check installer status" harus hilang dan
   wizard menampilkan status PHP/database/storage.
3. Buka **DevTools → Network** di halaman install. Request `installer/status` harus menuju
   domain backend (bukan `localhost:8000`) dan berstatus `200`.

---

## Checklist ringkas

- [ ] Backend di-deploy sebagai service terpisah (Root Directory = `backend`)
- [ ] Database MySQL/Postgres terhubung via variabel reference
- [ ] `APP_KEY` di-generate & diset
- [ ] `FRONTEND_URL` + `SANCTUM_STATEFUL_DOMAINS` diset di backend (CORS)
- [ ] Migrasi jalan (`migrate --force`, sekali dengan `--seed`)
- [ ] `queue:work` jalan
- [ ] `NEXT_PUBLIC_API_URL` diset di frontend **lalu rebuild**
- [ ] `https://backend/api/installer/status` mengembalikan JSON

---

## Kenapa muncul halaman "First-Time Setup"?

Itu wizard installer bawaan aplikasi (`/install`) untuk verifikasi lingkungan dan
mengisi profil perusahaan + konfigurasi awal. Ia hanya bisa jalan bila backend
terjangkau. Setelah backend tersambung, wizard akan memverifikasi PHP, database,
storage, queue, dan cache, lalu mengunci installer dan mengarahkan ke login.
