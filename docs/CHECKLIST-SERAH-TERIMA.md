# Checklist Serah Terima — CERIA

Panduan checklist untuk memastikan serah terima aplikasi CERIA berjalan lancar.

---

## Informasi Serah Terima

| Item | Keterangan |
|------|-----------|
| **Aplikasi** | CERIA — Cek kEsehatan Remaja dan lansIA |
| **URL** | https://ceria-puskesmas.vercel.app |
| **Developer** | KKN PPM UGM SWARYA KARANGANOM 2026 |
| **Pihak Penerima** | Puskesmas Karanganom |
| **Tanggal Serah Terima** | __________________ |

---

## A. Persiapan Sebelum Serah Terima

### A1. Akun & Akses

| # | Item | Status | Keterangan |
|---|------|--------|------------|
| 1 | URL aplikasi bisa diakses | ☐ | Cek dari komputer dan HP |
| 2 | Akun admin utama sudah dibuat | ☐ | Email: _________________ |
| 3 | Akun admin utama sudah login | ☐ | Password: _________________ |
| 4 | Akun staf sudah dibuat (jika ada) | ☐ | Jumlah: ___ akun |
| 5 | Semua akun sudah diuji coba login | ☐ | |
| 6 | Link "Lupa Password" berfungsi | ☐ | |

### A2. Database & Data

| # | Item | Status | Keterangan |
|---|------|--------|------------|
| 1 | Database Supabase aktif | ☐ | |
| 2 | Data contoh sudah ada (minimal 5 data) | ☐ | |
| 3 | Backup pertama sudah dilakukan | ☐ | File: _________________ |
| 4 | Tabel pemeriksaan ada dan berisi data | ☐ | |
| 5 | Tabel activity_log ada dan berisi log | ☐ | |

### A3. Fitur Aplikasi

| # | Item | Status | Keterangan |
|---|------|--------|------------|
| 1 | Login & logout berfungsi | ☐ | |
| 2 | Input data warga (3 langkah) berfungsi | ☐ | |
| 3 | Daftar warga (cari, urutkan, lihat detail) berfungsi | ☐ | |
| 4 | Hapus data (soft delete) berfungsi | ☐ | |
| 5 | Impor CSV berfungsi | ☐ | |
| 6 | Download template CSV berfungsi | ☐ | |
| 7 | Rekap & grafik berfungsi | ☐ | |
| 8 | Export CSV dari rekap berfungsi | ☐ | |
| 9 | Recycle bin (pulihkan & hapus permanen) berfungsi | ☐ | |
| 10 | Lihat riwayat pemeriksaan berfungsi | ☐ | |
| 11 | Log aktivitas berfungsi | ☐ | |

---

## B. Dokumen yang Diserahkan

| # | Dokumen | File | Status |
|---|---------|------|--------|
| 1 | Panduan Pengguna CERIA | `docs/PANDUAN-PENGGUNA-CERIA.md` | ☐ |
| 2 | Deployment Guide | `docs/DEPLOYMENT-GUIDE.md` | ☐ |
| 3 | Checklist Serah Terima | `docs/CHECKLIST-SERAH-TERIMA.md` | ☐ |

### Screenshot yang Perlu Dilengkapi

Setelah aplikasi live, capture screenshot halaman berikut dan tempel ke Panduan Pengguna:

| # | Halaman | Placeholder di Panduan | Status |
|---|---------|----------------------|--------|
| 1 | Login | `[SCREENSHOT: halaman_login]` | ☐ |
| 2 | Dashboard | `[SCREENSHOT: halaman_dashboard]` | ☐ |
| 3 | Input Step 1 (Identitas) | `[SCREENSHOT: halaman_input_step1]` | ☐ |
| 4 | Input Step 2 (Pengukuran) | `[SCREENSHOT: halaman_input_step2]` | ☐ |
| 5 | Input Step 3 (Hasil) | `[SCREENSHOT: halaman_input_step3]` | ☐ |
| 6 | Daftar Warga | `[SCREENSHOT: halaman_daftar_warga]` | ☐ |
| 7 | Impor CSV | `[SCREENSHOT: halaman_import_csv]` | ☐ |
| 8 | Rekap | `[SCREENSHOT: halaman_rekap]` | ☐ |
| 9 | Recycle Bin | `[SCREENSHOT: halaman_recycle_bin]` | ☐ |

---

## C. Pelatihan Pengguna

### C1. Sesi Pelatihan

| # | Materi | Status | Peserta |
|---|--------|--------|---------|
| 1 | Login & navigasi dashboard | ☐ | |
| 2 | Input data warga (3 langkah) | ☐ | |
| 3 | Mencari & melihat data di Daftar Warga | ☐ | |
| 4 | Import data massal dari CSV | ☐ | |
| 5 | Melihat rekap & grafik kesehatan | ☐ | |
| 6 | Mengelola Recycle Bin | ☐ | |
| 7 | Reset password | ☐ | |

### C2. Pengetahuan Dasar yang Harus Dimiliki Pengguna

| # | Pengetahuan | Status |
|---|-------------|--------|
| 1 | Buka browser dan akses URL aplikasi | ☐ |
| 2 | Login dan logout | ☐ |
| 3 | Navigasi menggunakan sidebar/menu | ☐ |
| 4 | Isi form input data warga | ☐ |
| 5 | Cari data berdasarkan NIK | ☐ |
| 6 | Export data ke CSV | ☐ |
| 7 | Import data dari file CSV | ☐ |
| 8 | Paham arti status SEHAT/PEMANTAUAN/RUJUKAN | ☐ |

---

## D. Akun & Akses untuk Pihak Penerima

| # | Akun | Email | Password | Role | Status |
|---|------|-------|----------|------|--------|
| 1 | Admin Utama | | | Administrator | ☐ |
| 2 | Staf 1 | | | Administrator | ☐ |
| 3 | Staf 2 | | | Administrator | ☐ |
| 4 | Staf 3 | | | Administrator | ☐ |

> **Catatan:** Semua pengguna CERIA memiliki role Administrator (akses penuh).

---

## E. Akun Hosting yang Perlu Disimpan

| # | Layanan | URL | Email Akun | Password | Keterangan |
|---|---------|-----|------------|----------|------------|
| 1 | GitHub | github.com | | | Source code |
| 2 | Vercel | vercel.com | | | Hosting |
| 3 | Supabase | supabase.com | | | Database |

> ⚠️ **PENTING:** Simpan informasi akun di atas di tempat yang AMAN. Jangan share ke orang yang tidak berkepentingan.

---

## F. Penanganan Masalah (Kontak Darurat)

| Masalah | Solusi | Kontak |
|---------|--------|--------|
| Lupa password login | Reset via link "Lupa Password" | Admin puskesmas |
| Tidak bisa akses aplikasi | Cek koneksi internet, coba browser lain | Developer KKN |
| Data error/hilang | Cek Recycle Bin, hubungi developer | Developer KKN |
| Butuh akun baru | Buat di Supabase Dashboard | Admin IT / Developer |
| Error teknis lainnya | Screenshot error, kirim ke developer | Developer KKN |

### Kontak Developer KKN

| Item | Keterangan |
|------|-----------|
| **Email** | swarya.karanganomugm@gmail.com |
| **Instagram** | @swarya.karanganom |

---

## G. Tanda Tangan Serah Terima

### Pihak Serah (Developer KKN)

| | |
|---|---|
| Nama | : _________________________ |
| Tanda Tangan | : _________________________ |
| Tanggal | : _________________________ |

### Pihak Terima (Puskesmas Karanganom)

| | |
|---|---|
| Nama | : _________________________ |
| Jabatan | : _________________________ |
| Tanda Tangan | : _________________________ |
| Tanggal | : _________________________ |

---

## H. Catatan Tambahan

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

_____________________________________________________________________________

---

*Dikembangkan oleh KKN PPM UGM SWARYA KARANGANOM 2026*
