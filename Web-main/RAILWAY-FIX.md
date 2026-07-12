# Perbaikan Deploy Railway — SJT Frontend

## Gejala yang terlihat di log

1. **Crash loop** (screenshot pertama): `Could not find a production build in the '.next'
   directory` — Railway menjalankan `next start` tanpa `next build` lebih dulu.
2. **Caddy fileserver 404** (screenshot kedua): `resp_headers.Server: Caddy` +
   `fileserver.(*FileServer).notFound` — Railway menyajikan file **statis** lewat Caddy,
   bukan menjalankan server Next.js. Semua request balas 404.

Keduanya berarti Railway **belum menjalankan Next.js sebagai aplikasi Node**.

## Yang sudah diperbaiki di kode

- `railway.json` — build (`npm run build`) sebelum start (`npm run start`).
- `nixpacks.toml` — urutan install → build → start, `HUSKY=0` agar CI tak gagal.
- `Procfile` — `web: npm run start`, menandai ini **web process** (bukan static).
- `package.json` → `start` kini: `next start -H 0.0.0.0 -p ${PORT:-3000}`
  sehingga Next.js **mengikat ke port yang di-inject Railway** (tadi `:8080`).
  Ini kemungkinan besar akar masalah Caddy: bila Next tidak mengikat `$PORT`,
  Railway tidak mendeteksi web server dan jatuh ke penyajian statis.
- `prepare` → `husky || true` agar `npm ci` tidak gagal di server.

## Yang HARUS diperiksa/di-set di dashboard Railway (tidak bisa lewat file)

Ini monorepo (ada `backend/` dan `frontend/`). Railway harus tahu service ini = folder `frontend`.

1. **Settings → Service → Root Directory** = `frontend`
   Tanpa ini, `railway.json`/`Procfile`/`package.json` frontend tidak terbaca dan Railway
   bisa salah mendeteksi tipe proyek.

2. **Settings → Build**
   - Builder: **Nixpacks** (bukan "Static" / "Caddy").
   - Jika ada kolom **Build Command** manual: isi `npm run build` (atau kosongkan agar
     ikut `railway.json`).

3. **Settings → Deploy → Custom Start Command**
   - Isi `npm run start` **atau kosongkan**. Jika sebelumnya ada start command lama
     (mis. `serve`, `caddy`, `npx serve out`), **hapus** — itu penyebab Caddy statis.

4. **Settings → Networking**
   - Pastikan **Target Port** mengikuti `PORT` (Railway biasanya otomatis; kalau ada isian
     manual, samakan dengan port yang dipakai Next, yaitu `$PORT`).

5. **Variables** (Environment)
   - `NEXT_PUBLIC_API_URL` = URL backend, contoh `https://<backend>.up.railway.app/api`.
     Wajib, kalau tidak semua panggilan API menembak `localhost:8000` dan gagal.
   - `NODE_ENV` = `production` (biasanya otomatis).

6. **Redeploy dari commit terbaru.**
   Pastikan deployment yang berjalan berasal dari commit yang sudah memuat file di atas.
   Log Caddy pada screenshot kemungkinan dari deployment lama. Setelah push, klik
   **Deploy** ulang dan lihat **Build Logs** memuat baris `next build` lalu
   `✓ Compiled successfully`, dan **Deploy Logs** menampilkan `▲ Next.js` +
   `✓ Ready`, **tanpa** kata "Caddy".

## Alternatif paling pasti: Dockerfile

Jika deteksi Railway masih rewel, gunakan Dockerfile eksplisit (letakkan di `frontend/`)
dan set Builder = Dockerfile. Ini menghilangkan semua tebakan Railway:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN HUSKY=0 npm ci --include=dev
COPY . .
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
CMD ["npm", "run", "start"]
```

File `Dockerfile` ini sudah disertakan di `frontend/` — tinggal set Builder = Dockerfile
di Settings bila ingin memakainya.
```
