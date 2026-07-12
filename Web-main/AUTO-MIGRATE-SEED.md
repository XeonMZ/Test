# Auto Migrate + Seed Setiap Deploy

Sesuai permintaan: migrasi (termasuk tabel yang tadinya hilang) **dan** seed kini
berjalan **otomatis di setiap deploy**, tanpa langkah manual.

## Apa yang berubah

| File | Perubahan |
| --- | --- |
| `backend/start.sh` | **BARU** — script boot: key → migrate → seed → cache → serve |
| `backend/railway.json` | **BARU** — start command backend = `bash start.sh` |
| `backend/nixpacks.toml` | **BARU** — PHP 8.3 + composer install saat build |
| `backend/database/seeders/DatabaseSeeder.php` | **DIUBAH** — kini idempoten (aman diulang) |

## Kenapa seeder harus diubah

Seeder lama memakai `User::create('admin@stms.test')`. Kalau `db:seed` jalan **dua kali**
(mis. tiap deploy), deploy kedua **crash**: "Duplicate entry 'admin@stms.test'" karena
email itu unik.

Seeder baru memakai `firstOrCreate`/`updateOrCreate` dengan kunci unik, jadi:
- Deploy pertama: membuat semua data contoh.
- Deploy berikutnya: mendeteksi data sudah ada, **tidak** menduplikasi, **tidak** crash.
- Password akun demo hanya di-set saat pertama dibuat — re-seed tidak menimpa password
  yang mungkin sudah kamu ubah.
- Jadwal demo hanya dibuat bila rute JKT-BDG belum punya jadwal, jadi tidak menumpuk
  keberangkatan baru tiap deploy.

## Cara pakai di Railway (service backend)

1. Pastikan **Root Directory** = `backend` (Settings → Source).
2. Start command otomatis terbaca dari `railway.json` (`bash start.sh`). Kalau kolom
   Custom Start Command diisi manual, kosongkan atau isi `bash start.sh`.
3. Set environment variables (Variables):

   ```
   APP_KEY=base64:...        # WAJIB & PERMANEN — lihat catatan di bawah
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://<backend>.up.railway.app
   FRONTEND_URL=https://<frontend>.up.railway.app

   DB_CONNECTION=mysql
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_DATABASE=${{MySQL.MYSQLDATABASE}}
   DB_USERNAME=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

   QUEUE_CONNECTION=database     # agar kedaluwarsa booking/kursi jalan
   SANCTUM_STATEFUL_DOMAINS=<frontend>.up.railway.app
   BETA_WEBHOOK_SECRET=<acak-panjang>
   ```

4. Deploy. Log akan menampilkan: "Running migrations…", "Seeding (idempotent)…",
   lalu server start.

### ⚠️ Set APP_KEY yang permanen

`start.sh` akan meng-generate APP_KEY sementara bila kosong, TAPI kunci itu berganti tiap
deploy — membuat data terenkripsi & token lama tak valid. Generate sekali di lokal:

```
php artisan key:generate --show
```

Salin hasilnya (mis. `base64:xxxx`) ke variabel `APP_KEY` di Railway. Sekali saja.

## Mengontrol seed

- Default: seed jalan tiap deploy (aman karena idempoten).
- Mau matikan? Set variabel `SEED_ON_DEPLOY=false`. Migrasi tetap jalan, seed dilewati.

## Queue worker (disarankan)

Kedaluwarsa booking & rilis kursi butuh worker. Buat **service kedua** dari folder
`backend` dengan start command:

```
php artisan queue:work --tries=3 --timeout=120
```

## Verifikasi setelah deploy

1. Cek log deploy backend — tidak ada error, ada baris migrate & seed.
2. `https://<backend>.up.railway.app/api/installer/status` → JSON.
3. Login dengan `owner@stms.test` / `password`.
4. `php artisan migrate:status` (via shell) → semua "Ran".

## Untuk reset total (opsional, HAPUS SEMUA DATA)

Kalau perlu mulai dari nol, sementara ubah start command jadi:

```
php artisan migrate:fresh --seed --force && bash start.sh
```

Lalu kembalikan ke `bash start.sh` setelah satu kali deploy. **Jangan** biarkan
`migrate:fresh` permanen — itu menghapus semua tabel tiap deploy.
