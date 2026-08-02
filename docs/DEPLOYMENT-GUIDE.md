# Deployment Guide — CERIA

Panduan teknis untuk mengelola aplikasi CERIA setelah serah terima.

---

## Daftar Isi

1. [Akses & Akun](#1-akses--akun)
2. [Mengelola Akun Pengguna](#2-mengelola-akun-pengguna)
3. [Update Aplikasi](#3-update-aplikasi)
4. [Backup & Restore Database](#4-backup--restore-database)
5. [Penanganan Masalah](#5-penanganan-masalah)

---

## 1. Akses & Akun

### URL Aplikasi

| Item | Nilai |
|------|-------|
| **URL Aplikasi** | https://ceria-puskesmas.vercel.app |
| **Platform Hosting** | Vercel (gratis) |
| **Database** | Supabase (gratis) |

### Akun yang Perlu Dijaga

| Layanan | Fungsi | URL Dashboard |
|---------|--------|---------------|
| **GitHub** | Source code aplikasi | https://github.com |
| **Vercel** | Hosting/deploy aplikasi | https://vercel.com |
| **Supabase** | Database & autentikasi | https://supabase.com |

> **PENTING:** Simpan email dan password ketiga akun di atas di tempat yang aman. Jangan share ke orang yang tidak berkepentingan.

---

## 2. Mengelola Akun Pengguna

### 2.1 Menambah Akun Baru (Admin/Staf)

1. Login ke https://supabase.com
2. Pilih project **bywewiyiernmjkazihjs**
3. Klik menu **Authentication** (ikon orang) di sidebar kiri
4. Klik tombol **"Add user"** → **"Create new user"**
5. Isi:
   - **Email:** email pengguna (contoh: staf1@puskesmas-karanganom.go.id)
   - **Password:** kata sandi sementara (minimal 6 karakter)
   - **Email Confirm:** centang **Auto Confirm** agar tidak perlu verifikasi email
6. Klik **"Create User"**
7. **Pesan ke pengguna:** Beritahu email dan password yang sudah dibuat. Mereka bisa login ke aplikasi langsung.

### 2.2 Mengubah Password Pengguna

1. Login ke Supabase Dashboard → **Authentication**
2. Cari user berdasarkan email
3. Klik user tersebut
4. Scroll ke bagian **Reset Password**
5. Masukkan password baru
6. Klik **"Send password reset email"** atau update langsung

### 2.3 Menghapus Akun

1. Login ke Supabase Dashboard → **Authentication**
2. Cari user berdasarkan email
3. Klik user tersebut
4. Scroll ke bawah, klik **"Delete user"**
5. Konfirmasi penghapusan

> **Peringatan:** Menghapus akun tidak menghapus data pemeriksaan yang sudah diinput oleh user tersebut. Data tetap ada di database.

---

## 3. Update Aplikasi

### 3.1 Kapan Perlu Update

Update diperlukan jika ada:
- Perbaikan bug
- Penambahan fitur baru
- Perubahan tampilan

### 3.2 Cara Update (otomatis)

Jika developer sudah push kode baru ke GitHub, Vercel akan **otomatis** deploy versi terbaru. Tidak perlu melakukan apa pun.

**Proses:**
1. Developer push kode ke repository GitHub
2. Vercel mendeteksi perubahan
3. Vercel build dan deploy otomatis (biasanya 1-3 menit)
4. Aplikasi di URL https://ceria-puskesmas.vercel.app otomatis diperbarui

### 3.3 Memeriksa Versi Terbaru

1. Login ke https://vercel.com
2. Pilih project **ceria-puskesmas**
3. Lihat tab **Deployments** untuk melihat riwayat deploy
4. Deployment terbaru di bagian atas

### 3.4 Rollback (Kembalikan Versi Sebelumnya)

Jika versi baru bermasalah:
1. Login ke Vercel → project **ceria-puskesmas**
2. Buka tab **Deployments**
3. Cari versi yang ingin dikembalikan
4. Klik titik tiga (⋯) di sebelah kanan
5. Klik **"Promote to Production"**
6. Aplikasi akan kembali ke versi sebelumnya

---

## 4. Backup & Restore Database

### 4.1 Backup Manual (Disarankan Seminggu Sekali)

1. Login ke https://supabase.com
2. Pilih project **bywewiyiernmjkazihjs**
3. Klik menu **SQL Editor** di sidebar
4. Ketik perintah berikut untuk export semua data:

```sql
-- Lihat semua data pemeriksaan
SELECT * FROM pemeriksaan ORDER BY dibuat_pada DESC;

-- Lihat semua log aktivitas
SELECT * FROM activity_log ORDER BY created_at DESC;
```

5. Klik **"Run"**
6. Klik ikon download (💾) di hasil query untuk download sebagai CSV
7. Simpan file backup dengan nama: `backup-ceria-TANGGAL.csv`

### 4.2 Backup via Supabase Dashboard

1. Login ke Supabase Dashboard
2. Klik **Table Editor** di sidebar
3. Pilih tabel **pemeriksaan**
4. Klik ikon **⋯** di kanan atas tabel
5. Klik **"Export to CSV"**
6. Ulangi untuk tabel **activity_log**

### 4.3 Restore dari Backup

Jika data perlu dikembalikan:

1. Login ke Supabase Dashboard → **SQL Editor**
2. Siapkan file CSV backup
3. Gunakan perintah COPY untuk import (atau gunakan fitur import di Supabase Table Editor)

> **Catatan:** Restore data membutuhkan pengetahuan SQL. Hubungi developer jika diperlukan.

---

## 5. Penanganan Masalah

### 5.1 Aplikasi Tidak Bisa Diakses

| Kemungkinan | Solusi |
|-------------|--------|
| Server Vercel down | Tunggu beberapa menit, coba lagi. Cek status di https://vercel.com/status |
| Koneksi internet putus | Periksa koneksi internet komputer/HP |
| URL salah | Pastikan ketik: https://ceria-puskesmas.vercel.app |

### 5.2 Login Gagal

| Kemungkinan | Solusi |
|-------------|--------|
| Email/password salah | Reset password via link "Lupa kata sandi?" di halaman login |
| Akun tidak ada | Hubungi admin untuk membuat akun baru di Supabase |
| Sesi expired | Tutup browser, buka ulang, login kembali |

### 5.3 Data Tidak Tersimpan

| Kemungkinan | Solusi |
|-------------|--------|
| Koneksi internet lambat | Pastikan koneksi stabil saat menyimpan |
| Field wajib kosong | Periksa semua field bertanda wajib sudah terisi |
| Server error | Coba beberapa saat lagi. Jika terus terjadi, hubungi developer |

### 5.4 Error saat Import CSV

| Kemungkinan | Solusi |
|-------------|--------|
| Format kolom salah | Pastikan format: No,NIK,TTL,L/P,BB,TB,LP,TD,GDS,CL |
| NIK tidak 16 digit | Periksa NIK di file CSV |
| Tanggal format salah | Gunakan format DD/MM/YYYY (contoh: 15/03/1990) |
| Delimiter salah | Gunakan koma (,) atau koma titik (;) sebagai pemisah |

### 5.5 Butuh Bantuan Teknis

Hubungi developer/KKN PPM UGM:
- **Email:** swarya.karanganomugm@gmail.com
- **Instagram:** @swarya.karanganom

---

## Informasi Teknis Tambahan

### Environment Variables (Rahasia)

Berikut variabel lingkungan yang digunakan aplikasi (jangan share ke publik):

| Variable | Keterangan |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL database Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci akses publik Supabase |

Kedua variabel ini tersimpan di file `.env.local` di repository GitHub dan di environment Vercel.

### Database Structure

| Tabel | Fungsi |
|-------|--------|
| `pemeriksaan` | Data pemeriksaan kesehatan warga |
| `activity_log` | Log aktivitas pengguna |

### Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel |
| Bahasa | TypeScript |

---

*Dikembangkan oleh KKN PPM UGM SWARYA KARANGANOM 2026*
*Untuk pertanyaan teknis: swarya.karanganomugm@gmail.com*
