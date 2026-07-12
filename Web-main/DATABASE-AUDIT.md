# Audit Database Lengkap — Apa Lagi yang Hilang & Perbaikannya

Kekhawatiranmu tepat. Karena satu migrasi Laravel bawaan hilang, saya audit **semua**
tabel: membandingkan yang dibutuhkan kode (model, `DB::table()`, Sanctum, queue) dengan
yang benar-benar dibuat migrasi.

## Hasil audit

### Yang HILANG dan sudah diperbaiki

| Tabel | Dipakai untuk | Dampak jika hilang | Status |
| --- | --- | --- | --- |
| `personal_access_tokens` | Token login (Sanctum) | **Login gagal total** (error yang kamu lihat) | ✅ ditambah |
| `jobs` | Antrian job database | **Kedaluwarsa booking/pembayaran & rilis kursi tidak jalan** | ✅ ditambah |
| `job_batches` | Batch job | Error bila pakai batch | ✅ ditambah |
| `failed_jobs` | Log job gagal | Job gagal tak tercatat | ✅ ditambah |
| `cache` / `cache_locks` | Cache database | Error bila `CACHE_STORE=database` | ✅ ditambah |
| `sessions` | Sesi database | Error bila `SESSION_DRIVER=database` | ✅ ditambah |

### Yang SUDAH ADA (aman — 28 tabel aplikasi)

Semua tabel domain lengkap: users, customers, drivers, vehicles, vehicle_seats,
vehicle_layouts, seat_maps, routes, pickup_points, drop_points, schedules, trips,
bookings, passengers, seat_reservations, tickets, ticket_qr_codes, payments,
payment_webhook_logs, passenger_check_ins, promos, vouchers, pricing_rules,
memberships, notifications, feature_flags, system_settings, activity_logs,
audit_trails, driver_locations, password_reset_tokens.

Semua model punya tabel. Semua `DB::table()` punya tabel. Urutan foreign key benar.

## ⚠️ Temuan penting: kursi tidak akan dirilis otomatis

Aplikasi memakai **delayed job** (`->delay($expiresAt)`) untuk:
- Membatalkan booking yang tak dibayar
- Merilis kursi yang terkunci
- Menandai pembayaran kedaluwarsa

Dengan `QUEUE_CONNECTION=sync` (default), **delayed job tidak berjalan** — kursi yang
dikunci akan tetap terkunci selamanya. Untuk produksi kamu WAJIB:

1. Set `QUEUE_CONNECTION=database` (tabel `jobs` kini sudah ada)
2. Jalankan worker: `php artisan queue:work`

---

## File yang harus kamu ganti / tambahkan

Semua ada di dalam zip. Yang **baru** (tinggal taruh, tidak menimpa apa pun):

```
backend/database/migrations/2026_07_04_000001_create_personal_access_tokens_table.php
backend/database/migrations/2026_07_04_000002_create_jobs_table.php
backend/database/migrations/2026_07_04_000003_create_cache_table.php
backend/database/migrations/2026_07_04_000004_create_sessions_table.php
```

Yang **diubah**:

```
backend/.env.example      (komentar peringatan queue)
```

Opsional (fallback SQL, tidak wajib):

```
backend/database/sql/create_missing_laravel_tables.sql
```

---

## Cara menerapkan (pilih satu)

### Cara A — artisan (disarungkan, paling benar)

Set start command backend di Railway:

```
php artisan migrate --force && php artisan config:cache && php artisan serve --host 0.0.0.0 --port $PORT
```

`migrate` akan membuat 4 tabel baru; tabel lama dilewati. Aman diulang.

Kalau belum pernah seed (akun demo belum ada):

```
php artisan migrate --seed --force
```

### Cara B — SQL manual

Jalankan `backend/database/sql/create_missing_laravel_tables.sql` di MySQL Railway.

---

## Setelah menerapkan

1. Login lagi — error `personal_access_tokens` hilang.
2. Untuk produksi: set `QUEUE_CONNECTION=database` + jalankan `queue:work` (service
   terpisah dari folder `backend` dengan start command `php artisan queue:work`).
3. Uji: buat booking, biarkan tanpa bayar hingga lewat `PAYMENT_EXPIRY_MINUTES` (default
   15). Dengan worker jalan, kursi harus otomatis kembali tersedia.

## Verifikasi cepat

```
php artisan migrate:status
```

Semua baris harus "Ran". Kalau ada "Pending", jalankan `php artisan migrate --force` lagi.
