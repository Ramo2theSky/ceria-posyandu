# Panduan Pengguna CERIA

**CERIA — Cek kEsehatan Remaja dan lansIA**
Sistem Pendataan & Skrining Kesehatan Digital untuk Puskesmas Karanganom

Dikembangkan oleh: KKN PPM UGM SWARYA KARANGANOM 2026

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Login & Lupa Password](#2-login--lupa-password)
3. [Dashboard](#3-dashboard)
4. [Input Data Warga](#4-input-data-warga)
5. [Daftar Warga](#5-daftar-warga)
6. [Impor CSV](#6-impor-csv)
7. [Rekap Puskesmas](#7-rekap-puskesmas)
8. [Recycle Bin](#8-recycle-bin)
9. [Standar Klasifikasi Kesehatan](#9-standar-klasifikasi-kesehatan)
10. [Pertanyaan Umum (FAQ)](#10-pertanyaan-umum-faq)

---

## 1. Pendahuluan

**CERIA** adalah aplikasi web untuk mencatat dan memantau data kesehatan warga di Puskesmas Karanganom. Aplikasi ini berjalan di browser (Chrome, Edge, Firefox) dan bisa diakses dari komputer maupun HP.

### Yang Perlu Disiapkan

- **Perangkat:** Komputer/laptop atau HP dengan browser
- **Koneksi Internet:** Wajib ada (untuk menyimpan data)
- **Akun Login:** Hubungi admin puskesmas untuk mendapatkan email dan kata sandi

### Akses Aplikasi

Buka browser, ketik alamat berikut:

```
https://ceria-puskesmas.vercel.app
```

> **Catatan:** Simpan alamat ini di bookmark/favorit agar mudah diakses kapan saja.

---

## 2. Login & Lupa Password

### 2.1 Cara Login

[SCREENSHOT: halaman_login]

1. Buka alamat aplikasi di browser
2. Klik tombol **"Masuk"** pada halaman utama
3. Masukkan **Email** dan **Kata Sandi** yang sudah diberikan admin
4. *(Opsional)* Centang **"Ingat saya"** agar tidak perlu login ulang setiap kali membuka aplikasi
5. Klik tombol **"Masuk"**

> **Peringatan:** Jika menggunakan komputer bersama (warnet, kantor), JANGAN centang "Ingat saya" demi keamanan akun Anda.

### 2.2 Lupa Kata Sandi

1. Pada halaman login, klik **"Lupa kata sandi?"**
2. Masukkan email yang terdaftar
3. Klik **"Kirim Link Reset"**
4. Buka email Anda (periksa folder **Spam/Junk** jika tidak ada di kotak masuk)
5. Klik link reset password di dalam email
6. Masukkan kata sandi baru (minimal 6 karakter)
7. Klik **"Simpan Kata Sandi"**
8. Anda akan diarahkan ke dashboard

---

## 3. Dashboard

[SCREENSHOT: halaman_dashboard]

Dashboard adalah halaman utama setelah login. Di sini Anda bisa melihat ringkasan data dan mengakses semua fitur.

### 3.1 Statistik

Di bagian atas dashboard terdapat 4 kartu statistik:

| Kartu Warna | Keterangan |
|-------------|------------|
| **Hijau Tua** | Total jumlah data warga yang tercatat |
| **Biru Langit** | Jumlah pemeriksaan bulan ini |
| **Kuning Emas** | Jumlah pemeriksaan hari ini |
| **Abu-abu** | Jumlah data yang perlu dirujuk |

### 3.2 Menu Cepat

Di bawah statistik terdapat 5 kartu menu yang bisa diklik:

| Menu | Kegunaan |
|------|----------|
| **Input Data Warga** | Tambah data pemeriksaan baru |
| **Daftar Warga** | Lihat semua data yang sudah tersimpan |
| **Rekap Puskesmas** | Lihat grafik dan ringkasan kesehatan |
| **Impor CSV** | Import data massal dari file Excel/CSV |
| **Recycle Bin** | Lihat data yang terhapus (bisa dipulihkan) |

### 3.3 Log Aktivitas

Klik tombol **"Log Aktivitas"** di bagian bawah untuk melihat riwayat aktivitas terakhir (siapa yang input data, hapus data, dll).

---

## 4. Input Data Warga

[SCREENSHOT: halaman_input_step1]

Fitur utama untuk mencatat data pemeriksaan kesehatan warga. Proses input dibagi menjadi **3 langkah** yang mudah diikuti.

### Langkah 1: Identitas Warga

Isi data diri warga yang diperiksa:

| Field | Cara Mengisi | Keterangan |
|-------|-------------|------------|
| **NIK** | Ketik 16 digit NIK | Wajib diisi, hanya angka |
| **Tanggal Lahir** | Pilih tanggal lahir | Klik kolom tanggal, pilih tahun-bulan-tanggal |
| **Jenis Kelamin** | Klik **L** atau **P** | L = Laki-laki, P = Perempuan |
| **No. HP** | Ketik nomor HP | *(Opsional)* Bisa dikosongkan |
| **Alamat** | Ketik alamat lengkap | *(Opsional)* Bisa dikosongkan |

> **Tips:** Setelah NIK terisi 16 digit, sistem akan otomatis mengecek apakah warga ini sudah pernah diperiksa. Jika sudah, data Nomor HP dan Alamat akan terisi otomatis dari data sebelumnya.

**Tanda centang hijau:** NIK baru, belum pernah diperiksa sebelumnya.
**Tanda kuning:** NIK sudah pernah diperiksa sebelumnya, dengan jumlah dan tanggal terakhir.

Klik **"Lanjut"** untuk masuk ke langkah berikutnya.

### Langkah 2: Pengukuran

[SCREENSHOT: halaman_input_step2]

Isi data pengukuran kesehatan:

| Field | Satuan | Cara Mengisi |
|-------|--------|-------------|
| **Tanggal Periksa** | - | Pilih tanggal pemeriksaan (otomatis hari ini) |
| **Berat Badan** | kg | Ketik berat badan (contoh: 65) |
| **Tinggi Badan** | cm | Ketik tinggi badan (contoh: 170) |
| **Lingkar Pinggang** | cm | Ukur lingkar pinggang, ketik angkanya |
| **TD Sistolik** | mmHg | Angka atas dari tensi (contoh: 120) |
| **TD Diastolik** | mmHg | Angka bawah dari tensi (contoh: 80) |
| **Gula Darah** | mg/dL | Hasil pemeriksaan gula darah |
| **Jenis Gula Darah** | Puasa/Sewaktu | Hanya muncul jika gula darah 110-200 |
| **Kolesterol Total** | mg/dL | *(Opsional)* Bisa dikosongkan |

> **Perhatian:** Jika hasil gula darah antara 110-200, akan muncul tombol pilihan **Puasa (GDP)** atau **Sewaktu (GDS)**. Pilih sesuai kondisi pemeriksaan.

Klik **"Lihat Hasil"** untuk melihat hasil klasifikasi.

### Langkah 3: Hasil & Simpan

[SCREENSHOT: halaman_input_step3]

Di langkah ini Anda akan melihat hasil analisis kesehatan:

**Status Utama** (tampil besar di atas):
- 🟢 **SEHAT** — Semua indikator dalam batas normal
- 🟡 **PERLU PEMANTAUAN** — Ada indikator yang perlu diperhatikan
- 🔴 **PERLU RUJUKAN** — Ada indikator yang harus dirujuk ke dokter

**Detail Indikator:**

| Indikator | Yang Dilihat |
|-----------|-------------|
| **IMT** | Berat badan ideal atau tidak |
| **Tekanan Darah** | Normal atau tinggi |
| **Gula Darah** | Normal, pradiabetes, atau diabetes |
| **Lingkar Pinggang** | Risiko obesitas sentral atau tidak |
| **Kolesterol** | Normal atau tinggi (jika diisi) |

Klik **"Simpan Data"** untuk menyimpan. Data akan langsung muncul di Daftar Warga dan Dashboard.

> **Tips:** Jika ada kesalahan, klik **"Kembali"** untuk mengedit data sebelum disimpan.

---

## 5. Daftar Warga

[SCREENSHOT: halaman_daftar_warga]

Halaman untuk melihat, mencari, dan mengelola semua data pemeriksaan yang sudah tersimpan.

### 5.1 Mencari Data

- Ketik **NIK** atau **tanggal** di kolom pencarian
- Data akan langsung terfilter secara otomatis

### 5.2 Mengurutkan Data

Klik nama kolom di tabel untuk mengurutkan:
- Klik sekali = urut naik (A→Z, kecil→besar)
- Klik lagi = urut turun (Z→A, besar→kecil)
- Kolom yang bisa diurutkan: NIK, Usia, Jenis Kelamin, Berat Badan, Tinggi Badan, IMT, Tanggal, Status

### 5.3 Melihat Detail

Klik tombol **"Detail"** pada baris data untuk melihat:
- Data identitas lengkap (NIK utuh, tanggal lahir, usia, jenis kelamin, no HP, alamat)
- Hasil klasifikasi detail untuk setiap indikator kesehatan
- Riwayat pemeriksaan sebelumnya (jika ada)

### 5.4 Menghapus Data

**Hapus satu data:**
1. Klik tombol **"Hapus"** pada baris yang dipilih
2. Konfirmasi dengan klik **"OK"**

**Hapus banyak data sekaligus:**
1. Centang data yang ingin dihapus (bisa centang beberapa sekaligus)
2. Tombol **"Hapus X Data"** akan muncul di atas tabel
3. Klik tombol tersebut dan konfirmasi

> **Catatan:** Data yang dihapus tidak hilang permanen. Data akan masuk ke **Recycle Bin** dan bisa dipulihkan kapan saja.

---

## 6. Impor CSV

[SCREENSHOT: halaman_import_csv]

Fitur untuk menginput data warga secara massal menggunakan file CSV (dari Excel atau Google Sheets).

### 6.1 Persiapan File CSV

Buat file CSV dengan format kolom berikut:

```
No,NIK,TTL,L/P,BB,TB,LP,TD,GDS,CL
1,3309123456789012,15/03/1990,L,65,170,80,120/80,95,210
2,3309123456789013,20/07/1985,P,55,158,72,130/85,110,
```

| Kolom | Keterangan | Contoh |
|-------|-----------|--------|
| No | Nomor urut (diabaikan) | 1 |
| NIK | 16 digit NIK | 3309123456789012 |
| TTL | Tanggal lahir (DD/MM/YYYY) | 15/03/1990 |
| L/P | Jenis kelamin | L atau P |
| BB | Berat badan (kg) | 65 |
| TB | Tinggi badan (cm) | 170 |
| LP | Lingkar pinggang (cm) | 80 |
| TD | Tekanan darah (sistol/diastol) | 120/80 |
| GDS | Gula darah (mg/dL) | 95 |
| CL | Kolesterol (mg/dL) *(opsional)* | 210 |

> **Tips:** Klik tombol **"Download Template CSV"** untuk mendownload template siap pakai.

### 6.2 Cara Import

1. Buka menu **Impor CSV** dari sidebar
2. Atur **Tanggal Periksa** yang diinginkan
3. Klik **"Pilih File CSV"** dan pilih file yang sudah disiapkan
4. Periksa hasil parsing:
   - 🟢 Hijau = data valid
   - 🔴 Merah = ada error (perlu diperbaiki)
5. Klik **"Impor X Data"** untuk mengimpor semua data valid

---

## 7. Rekap Puskesmas

[SCREENSHOT: halaman_rekap]

Halaman untuk melihat ringkasan dan grafik data kesehatan secara keseluruhan.

### 7.1 Filter Data

Klik **"Filter"** untuk menampilkan panel filter:

| Filter | Kegunaan |
|--------|----------|
| **Kelompok Usia** | Remaja (<18), Dewasa (18-59), Lansia (≥60) |
| **Status Kesehatan** | Sehat, Perlu Pemantauan, Perlu Rujukan |
| **Tanggal Periksa** | Dari tanggal ... sampai tanggal ... |

Klik **"Reset Filter"** untuk menghapus semua filter.

### 7.2 Grafik

| Grafik | Keterangan |
|--------|------------|
| **Distribusi Status** | Donut chart: Sehat, Perlu Pemantauan, Perlu Rujukan |
| **Distribusi Usia** | Donut chart: Remaja, Dewasa, Lansia |
| **Pemeriksaan per Bulan** | Bar chart: jumlah pemeriksaan 6 bulan terakhir |
| **Indikator Risiko** | Progress bar: Hipertensi, Diabetes, Kolesterol Tinggi, Obesitas |

### 7.3 Tabel Data Terakhir

10 data pemeriksaan terbaru ditampilkan di bawah grafik.

### 7.4 Unduh Data (Export CSV)

Klik tombol **"CSV"** untuk mengunduh semua data yang sedang ditampilkan (sesuai filter) dalam format file CSV.

### 7.5 Drill-Down Status

Klik kartu statistik **Sehat**, **Perlu Pemantauan**, atau **Perlu Rujukan** untuk melihat daftar lengkap warga dengan status tersebut. Gunakan kolom pencarian untuk filter lebih lanjut.

---

## 8. Recycle Bin

[SCREENSHOT: halaman_recycle_bin]

Tempat penyimpanan sementara data yang dihapus. Data di sini belum hilang permanen dan bisa dipulihkan.

### 8.1 Memulihkan Data

1. Cari data yang ingin dipulihkan (bisa cari berdasarkan NIK)
2. Klik tombol **"Pulihkan"** pada data yang dipilih
3. Konfirmasi dengan klik **"OK"**
4. Data akan kembali ke Daftar Warga

### 8.2 Menghapus Permanen

> ⚠️ **HATI-HATI!** Data yang dihapus permanen TIDAK BISA dikembalikan lagi.

**Hapus satu data:**
1. Klik tombol **"Hapus"** pada data yang dipilih
2. Konfirmasi dengan sangat hati-hati

**Kosongkan semua:**
1. Klik tombol **"Kosongkan Semua"**
2. Semua data di Recycle Bin akan hilang permanen
3. Hanya lakukan ini jika sudah YAKIN

---

## 9. Standar Klasifikasi Kesehatan

Berikut standar yang digunakan CERIA untuk menentukan status kesehatan:

### 9.1 IMT (Indeks Massa Tubuh)

| Rentang | Keterangan | Status |
|---------|-----------|--------|
| < 18.5 | Kurus | ⚠️ Perlu peningkatan gizi |
| 18.5 – 22.9 | Normal | ✅ Ideal |
| 23.0 – 24.9 | Overweight | ⚠️ Risiko meningkat |
| ≥ 25.0 | Obesitas | 🔴 Risiko tinggi, konsultasi dokter |

> **Catatan:** Standar ini menggunakan batas Asia Pasifik (lebih rendah dari standar WHO internasional).

### 9.2 Tekanan Darah

| Kondisi | Keterangan | Status |
|---------|-----------|--------|
| Sistol ≥ 140 **atau** Diastol ≥ 90 | Hipertensi Tingkat 2 | 🔴 Rujuk ke dokter |
| Sistol ≥ 130 **atau** Diastol ≥ 80 | Hipertensi Tingkat 1 | ⚠️ Konsultasi dokter |
| Sistol ≥ 120 | Elevasi | ⚠️ Perlu pemantauan |
| Di bawah semua ambang | Normal | ✅ Optimal |

### 9.3 Gula Darah

**GDP (Gula Darah Puasa):**

| Rentang (mg/dL) | Keterangan | Status |
|-----------------|-----------|--------|
| ≥ 126 | Diabetes | 🔴 Rujuk dokter |
| 110 – 125 | Pre-diabetes | ⚠️ Perlu pemantauan |
| < 110 | Normal | ✅ |

**GDS (Gula Darah Sewaktu):**

| Rentang (mg/dL) | Keterangan | Status |
|-----------------|-----------|--------|
| ≥ 200 | Diabetes | 🔴 Rujuk dokter |
| 140 – 199 | Pre-diabetes | ⚠️ Perlu pemantauan |
| < 140 | Normal | ✅ |

### 9.4 Kolesterol Total

| Rentang (mg/dL) | Keterangan | Status |
|-----------------|-----------|--------|
| ≥ 240 | Tinggi | 🔴 Risiko tinggi, rujuk dokter |
| 200 – 239 | Ambang Batas Tinggi | ⚠️ Perlu pemantauan |
| < 200 | Normal | ✅ |

### 9.5 Lingkar Pinggang

| Kondisi | Keterangan | Status |
|---------|-----------|--------|
| Laki-laki ≥ 90 cm **atau** Perempuan ≥ 80 cm | Berisiko | 🔴 Risiko obesitas sentral |
| Di bawah ambang | Normal | ✅ |

### 9.6 Status Keseluruhan

| Kondisi | Status |
|---------|--------|
| Ada indikator **🔴 Risiko** | **PERLU RUJUKAN** |
| Ada indikator **⚠️ Waspada** (tanpa risiko) | **PERLU PEMANTAUAN** |
| Semua indikator **✅ Normal** | **SEHAT** |

---

## 10. Pertanyaan Umum (FAQ)

### Bagaimana jika lupa kata sandi?

Buka halaman login → klik "Lupa kata sandi?" → masukkan email → buka email dari CERIA (periksa folder Spam) → klik link → buat kata sandi baru.

### Bagaimana jika salah input data?

Buka **Daftar Warga** → cari data yang salah → hapus data tersebut → input ulang data yang benar. Data yang dihapus bisa dipulihkan dari **Recycle Bin**.

### Apa yang terjadi jika data dihapus?

Data tidak langsung hilang. Data masuk ke **Recycle Bin** dan bisa dipulihkan kapan saja. Hanya data yang dikosongkan dari Recycle Bin yang hilang permanen.

### Bisa impor data dari Excel?

Bisa. Simpan file Excel sebagai format CSV, lalu impor menggunakan menu **Impor CSV**.

### Bagaimana cara melihat riwayat kesehatan satu orang?

Buka **Daftar Warga** → cari NIK yang diinginkan → klik **Detail** → klik **"Lihat Riwayat Pemeriksaan"**.

### Kenapa status gula darah tidak bisa dipilih?

Jika angka gula darah di luar range 110-200, jenis gula darah otomatis diatur ke "Sewaktu" karena hasilnya sudah jelas (Normal atau Diabetes). Pilihan Puasa/Sewaktu hanya muncul saat hasilnya ambigu (110-200).

### Bagaimana cara mengunduh data untuk laporan?

Buka **Rekap Puskesmas** → atur filter sesuai kebutuhan → klik tombol **"CSV"** untuk mengunduh data dalam format CSV.

---

*Dikembangkan oleh KKN PPM UGM SWARYA KARANGANOM 2026*
*Untuk pertanyaan, hubungi: swarya.karanganomugm@gmail.com / Instagram @swarya.karanganom*
