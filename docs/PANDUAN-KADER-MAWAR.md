# Panduan Kader Mawar

Panduan penggunaan aplikasi CERIA untuk kader posyandu (Mawar 1-5).

## 1. Login

1. Buka browser di HP
2. Kunjungi: **https://ceria-puskesmas.vercel.app**
3. Masukkan **email** dan **password** akun Anda
4. Centang **"Ingat saya"** jika ingin email tersimpan (opsional)
5. Klik **Masuk**

> **Catatan:** Jika lupa password, hubungi ketua posyandu.

### Akun Anda

| Email | Posyandu |
|-------|----------|
| mawar1@ceria.test | Posyandu Dk. Krajan (Mawar 1) |
| mawar2@ceria.test | Posyandu Dk. Daleman (Mawar 2) |
| mawar3@ceria.test | Posyandu Dk. Jurangjero (Mawar 3) |
| mawar4@ceria.test | Posyandu Dk. Ngawinan (Mawar 4) |
| mawar5@ceria.test | Posyandu Dk. Bungkusan (Mawar 5) |

## 2. Dashboard

Setelah login, Anda akan melihat halaman Dashboard dengan:

- **4 kartu statistik:** Total Warga, Pemeriksaan Bulan Ini, Pemeriksaan Hari Ini, Perlu Rujukan
- **5 menu aksi cepat:** Input, Daftar, Rekap, Impor CSV, Recycle Bin

> **Catatan:** Statistik di dashboard menampilkan **data gabungan dari semua posyandu**.

## 3. Input Data Warga

Klik menu **"Input Data Warga"** di dashboard. Proses input terdiri dari 3 langkah:

### Langkah 1: Identitas

- **NIK** (wajib): Nomor Induk Kependudukan 16 digit
- **Nama Lengkap** (wajib): Nama lengkap warga
- **Tanggal Lahir** (wajib): Pilih tanggal lahir
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

> **Penting:** Data yang disimpan otomatis masuk ke posyandu Anda (Mawar 1/2/3/4/5).

## 4. Daftar Warga

Klik menu **"Daftar Warga"** untuk melihat data warga.

### Fitur yang Tersedia

| Fitur | Keterangan |
|-------|------------|
| **Cari** | Cari berdasarkan NIK, nama, atau tanggal |
| **Urutkan** | Klik kolom untuk mengurutkan (Naik/Turun) |
| **Detail** | Klik "Detail" untuk melihat data lengkap + riwayat |
| **Hapus** | Hapus data (hanya untuk data posyandu sendiri) |

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

> **Penting untuk Kader:**
> - Anda **hanya bisa menghapus data dari posyandu Anda sendiri**
> - Tombol "Hapus" **tidak muncul** untuk data dari posyandu lain
> - Data yang dihapus masuk ke Recycle Bin (bukan hapus permanen)

**Cara menghapus:**
1. Klik **"Daftar Warga"**
2. Cari warga yang ingin dihapus
3. Klik tombol **"Hapus"** di baris yang dipilih
4. Konfirmasi dengan klik **"OK"**

### Melihat Riwayat

Klik tombol **"Detail"** pada baris warga, lalu klik **"Lihat Riwayat"** untuk melihat:
- Semua pemeriksaan yang pernah dilakukan (termasuk dari posyandu lain)
- Grafik tren kesehatan dari waktu ke waktu

> **Anda bisa melihat riwayat lintas posyandu.** Misalnya, jika warga diperiksa di Mawar 4 dan Mawar 5, Anda bisa melihat kedua pemeriksaan.

## 5. Rekap Puskesmas

Klik menu **"Rekap Puskesmas"** untuk melihat ringkasan data.

### Fitur yang Tersedia

| Fitur | Keterangan |
|-------|------------|
| **4 Kartu Statistik** | Total Warga, Sehat, Perlu Pemantauan, Perlu Rujukan |
| **Grafik Donut** | Distribusi status kesehatan & kelompok usia |
| **Grafik Batang** | Tren pemeriksaan 6 bulan terakhir |
| **Indikator Risiko** | Persentase Hipertensi, Diabetes, Kolesterol Tinggi, Obesitas, Risiko LP |
| **Export CSV** | Unduh data dalam format CSV (termasuk kolom Nama) |

### Export CSV

1. Klik tombol **"CSV"**
2. File akan terunduh dengan nama `rekap-puskesmas-TANGGAL.csv`

## 6. Recycle Bin

Klik menu **"Recycle Bin"** untuk melihat data yang terhapus.

### Fitur

| Fitur | Keterangan |
|-------|------------|
| **Cari** | Cari data yang terhapus |
| **Pulihkan** | Kembalikan data ke daftar utama |
| **Hapus Permanen** | Hapus data selamanya |

> **Penting untuk Kader:**
> - Anda **hanya bisa melihat data terhapus dari posyandu Anda sendiri**
> - Anda **hanya bisa memulihkan atau menghapus permanen data dari posyandu Anda sendiri**

## 7. Yang Tidak Bisa Dilakukan Kader

Sebagai kader, Anda **tidak bisa:**

| Tidak Bisa | Keterangan |
|------------|------------|
| Input data ke posyandu lain | Data otomatis masuk ke posyandu Anda |
| Edit data posyandu lain | Tombol edit tidak tersedia |
| Hapus data posyandu lain | Tombol Hapus tidak muncul |
| Melihat Recycle Bin posyandu lain | Data terhapus dari posyandu lain tidak terlihat |

## 8. Klasifikasi Kesehatan

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

## FAQ Kader

**Q: Bagaimana jika data salah input?**
A: Buka Daftar Warga → cari warga → klik Detail → lihat riwayat. Data lama tidak bisa diedit, tapi Anda bisa input data baru dengan data yang benar.

**Q: Saya melihat data dari posyandu lain, apakah saya bisa menghapusnya?**
A: Tidak. Anda hanya bisa menghapus data dari posyandu Anda sendiri. Tombol "Hapus" tidak muncul untuk data dari posyandu lain.

**Q: Bagaimana jika warga pindah posyandu?**
A: Riwayat pemeriksaan akan tetap tercatat di posyandu asal. Anda bisa input data baru di posyandu Anda, dan riwayat sebelumnya akan tetap terlihat.

**Q: Apakah data bisa dipulihkan jika terhapus?**
A: Ya, data yang dihapus masuk ke Recycle Bin dan bisa dipulihkan kapan saja.

**Q: Bagaimana cara mengubah password?**
A: Hubungi ketua posyandu.

**Q: Saya tidak bisa melihat data di dashboard?**
A: Pastikan koneksi internet stabil. Jika masih bermasalah, hubungi ketua posyandu.

---

**KKN PPM UGM SWARYA KARANGANOM 2026**
