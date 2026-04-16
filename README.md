# SIROSA — Sistem Informasi Produksi Susu Sapi

Aplikasi berbasis web untuk prediksi dan pencatatan produksi susu sapi perah. Dirancang untuk peternak kecil hingga menengah dengan tampilan mobile-first yang ringan dan mudah digunakan.

---

## Fitur Utama

- **Prediksi Produksi Susu** menggunakan dua model regresi linier
- **Manajemen Ternak** — data sapi, status, paritas, BCS, dan bobot badan
- **Pencatatan Produksi Susu** — sesi pagi dan sore, per ekor sapi
- **Dashboard** ringkasan data produksi dan ternak
- **Autentikasi** berbasis JWT dengan dua peran: Admin dan Peternak
- **Riwayat Prediksi** tersimpan per pengguna

---

## Model Prediksi

### Model A — Tanpa Bobot Badan
```
Milk_prod = 12.07588 - 0.0023511 * parity - 0.165474 * ll - 0.0035817 * bcs
```

### Model B — Dengan Bobot Badan
```
Milk_prod = 14.54375 - 0.2656174 * ll - 2.916924 * bcs + 0.0128959 * weight
```

**Keterangan variabel:**
| Variabel | Keterangan | Rentang Valid |
|----------|------------|---------------|
| `parity` | Paritas (jumlah laktasi) | 1 – 6 |
| `ll` | Bulan laktasi | 2 – 9 |
| `bcs` | Body Condition Score | 2.0 – 4.0 |
| `weight` | Bobot badan (kg) | 250 – 700 |

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion |
| Backend | NestJS, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (Passport.js) |
| Charts | Recharts |

---

## Struktur Direktori

```
sirosa-app/
├── frontend/          # Next.js app (mobile-first, max-width 430px)
│   ├── app/
│   │   ├── (farmer)/  # Halaman untuk peternak (dashboard, ternak, produksi, prediksi)
│   │   ├── admin/     # Halaman untuk admin
│   │   ├── landing/   # Landing page
│   │   ├── login/
│   │   └── register/
│   ├── components/
│   ├── contexts/
│   └── lib/
└── backend/           # NestJS REST API
    ├── src/
    │   ├── auth/      # Autentikasi & otorisasi JWT
    │   ├── cow/       # Manajemen data sapi
    │   ├── milk-production/  # Pencatatan produksi susu
    │   ├── prediction/       # Endpoint prediksi & riwayat
    │   ├── dashboard/        # Statistik ringkasan
    │   └── users/
    └── prisma/
        └── schema.prisma
```

---

## Prasyarat

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

---

## Instalasi & Menjalankan

### 1. Clone repositori

```bash
git clone <url-repo>
cd sirosa-app
```

### 2. Install semua dependensi

```bash
# Install dependensi root (concurrently)
npm install

# Install dependensi frontend
cd frontend && npm install && cd ..

# Install dependensi backend
cd backend && npm install && cd ..
```

### 3. Konfigurasi environment backend

Buat file `.env` di dalam folder `backend/`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sirosa_db"
JWT_SECRET="your-secret-key"
```

### 4. Jalankan migrasi database

```bash
npm run db:migrate
```

### 5. Jalankan aplikasi

```bash
# Jalankan frontend dan backend bersamaan
npm run dev
```

Atau jalankan terpisah:

```bash
npm run backend   # NestJS API — http://localhost:3001
npm run frontend  # Next.js   — http://localhost:3000
```

---

## Script yang Tersedia

| Script | Keterangan |
|--------|------------|
| `npm run dev` | Jalankan frontend + backend bersamaan |
| `npm run frontend` | Jalankan hanya frontend (Next.js dev) |
| `npm run backend` | Jalankan hanya backend (NestJS dev) |
| `npm run frontend:build` | Build frontend untuk produksi |
| `npm run backend:build` | Build backend untuk produksi |
| `npm run db:migrate` | Jalankan migrasi Prisma |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |

---

## Lisensi

Hak cipta dilindungi. Proyek ini dikembangkan untuk keperluan penelitian dan pengembangan sistem informasi peternakan sapi perah di Indonesia.
