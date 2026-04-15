## Proyek: Aplikasi Prediksi Produksi Susu Sapi Perah

### Stack
- Frontend: Next.js + Tailwind CSS + Framer Motion
- Backend: NestJS + Prisma + PostgreSQL
- Tampilan: Mobile-first (max-width 430px, centered)

### 2 Model Prediksi
- Model A (Tanpa Bobot Badan): Milk_prod = 12.07588 - 0.0023511*parity - 0.165474*ll - 0.0035817*bcs
- Model B (Dengan Bobot Badan): Milk_prod = 14.54375 - 0.2656174*ll - 2.916924*bcs + 0.0128959*weight

### Validasi Input
- BCS: 2-4 (boleh desimal)
- Paritas: 1-6 (integer)
- Bulan Laktasi: 2-9 (integer)
- Bobot Badan: 200-800 kg (hanya untuk Model B)

### Aturan
- Input di luar range validasi = tombol submit disabled
- UI sederhana, ringan, cocok untuk peternak
- Animasi transisi halus tapi tidak berlebihan
