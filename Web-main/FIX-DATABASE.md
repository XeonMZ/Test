# Fix: "Table 'railway.personal_access_tokens' doesn't exist"

## Penyebab

Aplikasi memakai Laravel Sanctum untuk token login, tetapi **file migrasi tabel
`personal_access_tokens` hilang** dari project. Jadi saat kamu login, verifikasi
email/password berhasil, tapi langkah menyimpan token gagal karena tabelnya belum ada.

(Bahwa error terjadi di tahap simpan token, bukan cek password, menandakan tabel
`users` sudah ada dan seeder sudah jalan — hanya tabel Sanctum yang kurang.)

## Perbaikan

File migrasi yang hilang sudah ditambahkan:
`backend/database/migrations/2026_07_04_000001_create_personal_access_tokens_table.php`

Tinggal jalankan migrasi. **Jangan tulis SQL manual kalau tidak terpaksa** — Laravel
sudah tahu cara membuat tabelnya.

### Opsi A — Redeploy dengan start command yang benar (disarankan)

Di Railway, service **backend** → Settings → Deploy → Custom Start Command:

```
php artisan migrate --force && php artisan config:cache && php artisan serve --host 0.0.0.0 --port $PORT
```

Lalu redeploy. Migrasi baru akan membuat `personal_access_tokens`; tabel lain yang
sudah ada otomatis dilewati. Aman dijalankan berulang.

### Opsi B — Jalankan sekali via Railway CLI / shell

```
php artisan migrate --force
```

Kalau kamu belum pernah seed data contoh (akun demo, rute, jadwal):

```
php artisan migrate --seed --force
```

### Opsi C — SQL manual (hanya bila tidak bisa pakai artisan)

Jalankan `backend/database/sql/create_personal_access_tokens.sql` di MySQL Railway
(service MySQL → Query, atau via `mysql` CLI). File itu juga menandai migrasinya sebagai
sudah jalan agar tidak bentrok dengan artisan di kemudian hari.

## Verifikasi

Setelah migrasi, coba login lagi dengan akun demo:

- Email: `owner@stms.test` / `admin@stms.test` / `customer@stms.test` / `driver@stms.test`
- Password: `password`

Kalau seeder belum pernah jalan, akun demo di atas belum ada — jalankan
`php artisan migrate --seed --force` dulu, atau daftar akun baru lewat halaman Register.

## Catatan

Ada 32 tabel yang seharusnya dibuat migrasi. Kalau setelah `migrate` masih ada error
"table ... doesn't exist" untuk tabel lain, berarti migrasi belum tuntas — jalankan
`php artisan migrate:status` untuk melihat mana yang belum, lalu `php artisan migrate --force`.
Untuk mulai bersih dari nol (menghapus semua data): `php artisan migrate:fresh --seed --force`.
