# Panduan Ketua Posyandu (Super Admin)

Panduan lengkap untuk ketua posyandu menggunakan aplikasi CERIA.

## 1. Login

1. Buka browser di HP atau laptop
2. Kunjungi: **https://ceria-puskesmas.vercel.app**
3. Masukkan **email** dan **password** akun Anda
4. Centang **"Ingat saya"** jika ingin email tersimpan (opsional)
5. Klik **Masuk**

> **Catatan:** Jika lupa password, klik "Lupa Password?" di halaman login. Link reset akan dikirim ke email Anda.

## 2. Dashboard

Setelah login, Anda akan melihat halaman Dashboard dengan:

- **4 kartu statistik:** Total Warga, Pemeriksaan Bulan Ini, Pemeriksaan Hari Ini, Perlu Rujukan
- **Filter Posyandu:** Dropdown untuk melihat data per posyandu atau semua posyandu
- **Grafik Perbandingan per Posyandu:** Bar chart dengan warna:
  - Hijau = Sehat
  - Kuning = Perlu Pemantauan
  - Merah = Perlu Rujukan
- **5 menu aksi cepat:** Input, Daftar, Rekap, Impor CSV, Recycle Bin

### Filter Posyandu

- **Semua Posyandu:** Menampilkan data gabungan dari semua posyandu
- **Pilih posyandu tertentu:** Menampilkan data dari posyandu yang dipilih saja

## 3. Input Data Warga

Klik menu **"Input Data Warga"** di dashboard. Proses input terdiri dari 3 langkah:

### Langkah 1: Identitas

- **NIK** (wajib): Nomor Induk Kependudukan 16 digit
- **Nama Lengkap** (wajib): Nama lengkap warga
- **Tanggal Lahir** (wajib): Format DD/MM/YYYY
- **Jenis Kelamin** (wajib): Laki-laki atau Perempuan
- **No. HP** (opsional): Nomor telepon
- **Alamat** (opsional): Alamat rumah

> **Tips:** Jika NIK sudah pernah diperiksa, semua data identitas akan otomatis terisi.

### Langkah 2: Pengukuran

- **Berat Badan** (kg)
- **Tinggi Badan** (cm)
- **Lingkar Pinggang** (cm)
- **Tekanan Darah:** Sistolik / Diastolik (mmHg)
- **Gula Darah** (mg/dL): Pilih jenis GDP (puasa) atau GDS (sewaktu)
- **Kolesterol** (mg/dL): Opsional

> **Catatan:** IMT (Indeks Massa Tubuh) akan dihitung otomatis.

### Langkah 3: Hasil & Simpan

Sistem akan menampilkan:
- Klasifikasi per indikator (IMT, Tekanan Darah, Gula Darah, Kolesterol, Lingkar Pinggang)
- **Status Keseluruhan:**
  - **SEHAT** (hijau) — Semua indikator normal
  - **PERLU PEMANTAUAN** (kuning) — Ada indikator yang perlu diperhatikan
  - **PERLU RUJUKAN** (merah) — Ada indikator berisiko tinggi

Klik **Simpan** untuk menyimpan data.

> **Penting:** Data yang disimpan otomatis masuk ke posyandu Anda.

## 4. Daftar Warga

Klik menu **"Daftar Warga"** untuk melihat semua data warga.

### Fitur yang Tersedia

| Fitur | Keterangan |
|-------|------------|
| **Cari** | Cari berdasarkan NIK, nama, atau tanggal |
| **Filter Posyandu** | Filter berdasarkan posyandu asal |
| **Urutkan** | Klik kolom untuk mengurutkan (NAik/Turun) |
| **Detail** | Klik "Detail" untuk melihat data lengkap + riwayat |
| **Hapus** | Hapus data (masuk ke Recycle Bin) |

### Kolom Tabel

| Kolom | Keterangan |
|-------|------------|
| NIK | Nomor induk (termasker untuk privasi) |
| Nama | Nama lengkap warga |
| Posyandu | Asal posyandu pemeriksaan |
| Usia | Usia saat pemeriksaan |
| JK | Jenis Kelamin (L/P) |
| BB | Berat Badan (kg) |
| TB | Tinggi Badan (cm) |
| IMT | Indeks Massa Tubuh |
| TD | Tekanan Darah |
| Status | Sehat / Pemantauan / Rujukan |
| Waktu Input | Tanggal pemeriksaan |
| Aksi | Tombol Detail dan Hapus |

### Hapus Data

- **Hapus satu:** Klik tombol "Hapus" di baris yang dipilih
- **Hapus banyak:** Centang beberapa baris, lalu klik "Hapus X Data"

> **Penting sebagai Super Admin:**
> - Anda bisa **menghapus data dari posyandu mana saja**
> - Data yang dihapus masuk ke Recycle Bin (bukan hapus permanen)

### Melihat Riwayat

Klik tombol **"Detail"** pada baris warga, lalu klik **"Lihat Riwayat"** untuk melihat:
- Semua pemeriksaan yang pernah dilakukan (termasuk dari posyandu lain)
- Grafik tren kesehatan dari waktu ke waktu

## 5. Rekap Puskesmas

Klik menu **"Rekap Puskesmas"** untuk melihat ringkasan data.

### Fitur yang Tersedia

| Fitur | Keterangan |
|-------|------------|
| **4 Kartu Statistik** | Total Warga, Sehat, Perlu Pemantauan, Perlu Rujukan |
| **Grafik Donut** | Distribusi status kesehatan & kelompok usia |
| **Grafik Batang** | Tren pemeriksaan 6 bulan terakhir |
| **Indikator Risiko** | Persentase Hipertensi, Diabetes, Kolesterol Tinggi, Obesitas, Risiko LP |
| **Filter** | Kelompok usia, status kesehatan, rentang tanggal |
| **Export CSV** | Unduh data dalam format CSV (termasuk kolom Nama) |

### Export CSV

1. Atur filter sesuai kebutuhan (opsional)
2. Klik tombol **"CSV"**
3. File akan terunduh dengan nama `rekap-puskesmas-TANGGAL.csv`

### Drill-down Status

Klik salah satu kartu statistik (Sehat / Pemantauan / Rujukan) untuk melihat daftar warga dengan status tersebut.

## 6. Impor CSV

Klik menu **"Impor CSV"** untuk input data massal.

### Format CSV

```
No,NIK,Nama,TTL,L/P,BB,TB,LP,TD,GDS,CL
1,3201011503900001,SITI NURHALIZA,15/03/1990,P,58,155,72,118/75,92,
```

| Kolom | Keterangan | Wajib |
|-------|------------|-------|
| No | Nomor urut | Ya |
| NIK | 16 digit | Ya |
| Nama | Nama lengkap | Tidak (kosong = otomatis dari NIK sebelumnya) |
| TTL | Tanggal lahir DD/MM/YYYY | Ya |
| L/P | Jenis kelamin | Ya |
| BB | Berat badan (kg) | Ya |
| TB | Tinggi badan (cm) | Ya |
| LP | Lingkar pinggang (cm) | Ya |
| TD | Tekanan darah (sistol/diastol) | Ya |
| GDS | Gula darah sewaktu (mg/dL) | Ya |
| CL | Kolesterol (mg/dL) | Tidak |

### Cara Impor

1. Siapkan file CSV sesuai format di atas
2. Buka menu **Impor CSV**
3. Pilih posyandu tujuan (jika Super Admin)
4. Pilih **Tanggal Pemeriksaan**
5. Klik **"Pilih File"** dan pilih file CSV Anda
6. Review data di tabel preview (hijau = valid, merah = error)
7. Klik **"Impor X Data"** untuk menyimpan

> **Tips:** Download template CSV kosong dengan klik "Download Template" di halaman impor.

## 7. Recycle Bin

Klik menu **"Recycle Bin"** untuk melihat data yang terhapus.

### Fitur

| Fitur | Keterangan |
|-------|------------|
| **Cari** | Cari data yang terhapus |
| **Pulihkan** | Kembalikan data ke daftar utama |
| **Hapus Permanen** | Hapus data selamanya |
| **Kosongkan** | Hapus semua data di Recycle Bin |

> **Sebagai Super Admin:** Anda bisa melihat dan mengelola data terhapus dari **semua posyandu**.

## 8. Manajemen User (Akun Kader)

Sebagai Super Admin, Anda dapat membuat akun kader baru.

### Cara Membuat Akun Kader

1. Buka **Supabase Dashboard** → **Authentication** → **Users**
2. Klik **"Add user"**
3. Masukkan **Email** dan **Password**
4. Di bagian **User Metadata**, tambahkan:
   - `nama`: Nama kader
   - `posyandu_id`: UUID posyandu yang diampu
   - `is_super_admin`: `false`
5. Klik **"Create User"**

### Akun yang Tersedia

| Email | Role | Posyandu |
|-------|------|----------|
| admin@ceria.test | Super Admin | Semua |
| developer@ceria.test | Super Admin | Semua |
| mawar1@ceria.test | Kader | Posyandu Dk. Krajan (Mawar 1) |
| mawar2@ceria.test | Kader | Posyandu Dk. Daleman (Mawar 2) |
| mawar3@ceria.test | Kader | Posyandu Dk. Jurangjero (Mawar 3) |
| mawar4@ceria.test | Kader | Posyandu Dk. Ngawinan (Mawar 4) |
| mawar5@ceria.test | Kader | Posyandu Dk. Bungkusan (Mawar 5) |

## 9. Perbedaan Akses: Super Admin vs Kader

| Fitur | Super Admin | Kader |
|-------|-------------|-------|
| Lihat semua data | Ya | Ya |
| Lihat kolom Posyandu | Ya | Ya |
| Input data | Semua posyandu | Hanya posyandu sendiri |
| Edit data | Semua posyandu | Hanya posyandu sendiri |
| Hapus data | Semua posyandu | Hanya posyandu sendiri |
| Riwayat warga | Lintas posyandu | Lintas posyandu |
| Filter posyandu di Dashboard | Ya | Tidak |
| Grafik perbandingan posyandu | Ya | Tidak |
| Recycle Bin | Semua posyandu | Hanya posyandu sendiri |
| Export CSV | Ya | Ya |

## 10. Klasifikasi Kesehatan

### Tekanan Darah

| Kategori | Sistolik | Diastolik | Keterangan |
|----------|----------|-----------|------------|
| Normal | < 130 | < 90 | Optimal |
| Hipertensi | ≥ 130 | ≥ 90 | Rujuk, kemungkinan terapi obat |

### Gula Darah Puasa (GDP)

| Kategori | Nilai (mg/dL) | Keterangan |
|----------|---------------|------------|
| Normal | < 110 | Normal |
| Pre-diabetes | 110 - 125 | Perlu pemantauan |
| Diabetes | ≥ 126 | Rujuk dokter |

### Gula Darah Sewaktu (GDS)

| Kategori | Nilai (mg/dL) | Keterangan |
|----------|---------------|------------|
| Normal | < 140 | Normal |
| Pre-diabetes | 140 - 199 | Perlu pemantauan |
| Diabetes | ≥ 200 | Rujuk dokter |

### IMT (Indeks Massa Tubuh)

| Kategori | IMT (kg/m²) | Keterangan |
|----------|-------------|------------|
| Kurus | < 18.5 | Perlu peningkatan gizi |
| Normal | 18.5 - 22.9 | Ideal |
| Overweight | 23.0 - 24.9 | Risiko meningkat |
| Obesitas | ≥ 25.0 | Risiko tinggi, konsultasi dokter |

### Kolesterol

| Kategori | Nilai (mg/dL) | Keterangan |
|----------|---------------|------------|
| Normal | < 200 | Risiko rendah |
| Ambang Batas | 200 - 239 | Perlu pemantauan |
| Tinggi | ≥ 240 | Risiko tinggi, rujuk dokter |

### Lingkar Pinggang

| Jenis Kelamin | Batas Risiko | Keterangan |
|---------------|-------------|------------|
| Laki-laki | ≥ 90 cm | Risiko obesitas sentral |
| Perempuan | ≥ 80 cm | Risiko obesitas sentral |

### Status Keseluruhan

- **SEHAT:** Semua indikator normal
- **PERLU PEMANTAUAN:** Ada indikator dengan status "warn" (perlu perhatian)
- **PERLU RUJUKAN:** Ada indikator dengan status "risk" (risiko tinggi)

## FAQ

**Q: Bagaimana jika data salah input?**
A: Buka Daftar Warga → cari warga → klik Detail → lihat riwayat. Data lama tidak bisa diedit, tapi Anda bisa input data baru dengan data yang benar.

**Q: Bagaimana jika warga diperiksa di posyandu yang berbeda?**
A: Riwayat pemeriksaan akan otomatis tergabung. Kader bisa melihat semua riwayat warga dari posyandu mana saja.

**Q: Apakah data bisa dipulihkan jika terhapus?**
A: Ya, data yang dihapus masuk ke Recycle Bin dan bisa dipulihkan kapan saja.

**Q: Bagaimana cara mengubah password?**
A: Hubungi developer atau reset melalui fitur "Lupa Password" di halaman login.

---

**KKN PPM UGM SWARYA KARANGANOM 2026**
