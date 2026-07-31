# Product Requirements Document (PRD)
## CERIA — Sistem Pendataan & Skrining Kesehatan Digital Posyandu Remaja & Lansia

| | |
|---|---|
| **Unit** | KKN-PPM UGM 2025-YO002, Sub Unit 1, Desa Jurangjero, Karanganom, Klaten |
| **Pemilik Produk** | [Nama kamu] — Mahasiswa Ilmu Komputer |
| **Status** | Draft v1.0 |
| **Batasan Anggaran** | **Rp 0 — wajib menggunakan tier gratis di seluruh komponen** |

---

## 1. Ringkasan Eksekutif

CERIA adalah sistem pendataan dan skrining kesehatan digital untuk Posyandu Remaja & Lansia di Desa Jurangjero. Sistem menggantikan formulir kertas "Catatan Hasil Pemeriksaan Kesehatan" dengan aplikasi web yang otomatis mengklasifikasikan hasil pemeriksaan (IMT, tensi, gula darah, kolesterol, lingkar pinggang) sesuai standar WHO/Kemenkes, lalu menyimpannya secara terpusat dan tersinkronisasi untuk seluruh kader posyandu.

Seluruh biaya pengembangan dan operasional dirancang **Rp 0**, ditanggung penuh oleh tier gratis platform cloud (lihat Bagian 8), tanpa domain berbayar, tanpa API berbayar, dan tanpa biaya berulang dalam bentuk apa pun.

Implementasi yang sudah aktif saat ini berfokus pada login kader, dashboard ringkas, input 3 langkah, daftar warga, rekap desa, ekspor CSV, dan import CSV untuk migrasi data lama.

---

## 2. Latar Belakang & Masalah

| Kondisi saat ini | Dampak |
|---|---|
| Pencatatan hasil pemeriksaan posyandu masih manual di atas formulir kertas | Data sulit direkap, mudah hilang/rusak, dan tidak ada riwayat per-warga antar sesi |
| Interpretasi hasil (normal/perlu pemantauan/perlu rujukan) dilakukan manual oleh kader | Rawan salah baca tabel ambang batas, terutama oleh kader sepuh |
| Tidak ada rekap otomatis tingkat desa | Pelaporan ke Puskesmas memakan waktu, dan potensi warga berisiko tinggi tidak teridentifikasi cepat |
| Kader posyandu sebagian berusia lanjut, terbatas literasi digital | Sistem yang rumit berisiko tidak terpakai setelah mahasiswa KKN selesai |

---

## 3. Tujuan & Sasaran

**Tujuan Produk**
1. Mempercepat dan menstandarkan proses pencatatan hasil pemeriksaan kesehatan di posyandu.
2. Mengotomatisasi klasifikasi hasil pemeriksaan berdasarkan standar WHO/Kemenkes, mengurangi human error.
3. Menyediakan rekap tingkat desa untuk mendukung keputusan tindak lanjut (rujukan, pemantauan).
4. Memastikan sistem dapat terus dipakai dan dikelola oleh posyandu/puskesmas tanpa bergantung pada mahasiswa KKN setelah program selesai.

**Non-Goals (sengaja tidak dikerjakan di v1)**
- Bukan pengganti rekam medis resmi Puskesmas/SIMPUS.
- Bukan aplikasi diagnosis — sistem hanya mengklasifikasikan angka sesuai ambang batas yang sudah ditetapkan otoritas kesehatan, bukan memberi keputusan medis.
- Tidak menyasar integrasi BPJS atau sistem nasional lain di tahap ini.

---

## 4. Pemangku Kepentingan & Persona

| Peran | Kebutuhan utama |
|---|---|
| **Kader Posyandu** (pengguna utama, mayoritas usia lanjut) | Input cepat, langkah sederhana, tidak butuh pelatihan IT mendalam |
| **Bidan/Puskesmas** (pengguna sekunder) | Rekap warga berisiko untuk tindak lanjut & pelaporan rutin |
| **Warga remaja & lansia** (subjek data) | Data pribadi & kesehatan aman, tidak disalahgunakan |
| **Pemerintah Desa** (pemilik institusional jangka panjang) | Sistem tidak membutuhkan biaya berkelanjutan, mudah diwariskan |
| **Mahasiswa KKN** (developer sementara) | Serah terima yang bersih, tidak terikat maintenance permanen |

---

## 5. Lingkup Fitur (Prioritas MoSCoW)

| Fitur | Prioritas | Keterangan |
|---|---|---|
| Wizard input 3 langkah (Identitas → Pengukuran → Hasil) | **Must** | Alur utama, sudah ada di prototipe |
| Klasifikasi otomatis (IMT, tensi, GDS, kolesterol, lingkar pinggang) berbasis tabel ambang batas WHO/Kemenkes | **Must** | Logika berbasis tabel, bukan if-else bertumpuk, agar mudah diperbarui |
| Catatan kesimpulan otomatis (dapat diedit kader) | **Must** | Mengurangi beban menulis manual |
| Penyimpanan tersinkronisasi multi-perangkat, multi-kader | **Must** | Lihat arsitektur Bagian 9 |
| Login terbatas khusus kader terdaftar (bukan publik) | **Must** | Mencegah akses & pengubahan data sembarangan |
| Daftar warga, pencarian by nama/NIK, riwayat per-warga | **Must** | |
| Ekspor data ke CSV/Excel | **Must** | Sebagai cadangan & bahan lapor ke Puskesmas |
| Rekap tingkat desa (jumlah berisiko per indikator, breakdown usia) | **Should** | Nilai tambah pengambilan keputusan |
| Catatan peringatan khusus untuk usia <18 tahun (IMT/U) | **Should** | Sudah ada di prototipe |
| Import data massal dari CSV/Excel (migrasi data lama) | **Should** | Sudah tersedia sebagai jalur migrasi, bukan alur harian utama |
| Mode PWA / instalasi ke layar HP | **Could** | Nilai tambah kenyamanan, bukan blocker |
| Notifikasi WhatsApp/SMS otomatis ke warga berisiko | **Won't (v1)** | Hampir semua gateway WA/SMS berbayar — bertentangan dengan batasan Rp0 |
| Aplikasi native Android/iOS | **Won't (v1)** | Tidak perlu; web app sudah cukup ringan untuk perangkat low-spec |

**Catatan implementasi saat ini:** fitur inti yang sudah berjalan di kode adalah login, dashboard, input 3 langkah, daftar warga dengan detail expand, rekap desa, export CSV, dan import CSV.

---

## 6. Alur Pengguna Utama (User Flow)

1. Kader login dengan akun yang sudah didaftarkan admin.
2. Kader memilih "Input Data Baru", mengisi identitas warga (nama, NIK, tanggal lahir, jenis kelamin).
3. Kader memasukkan hasil ukur (BB, TB, tensi, GDS, kolesterol, lingkar pinggang) — IMT terhitung otomatis secara live.
4. Sistem menampilkan hasil klasifikasi per parameter + status keseluruhan (Sehat/Perlu Pemantauan/Perlu Rujukan) dengan catatan kesimpulan otomatis.
5. Kader menyimpan data — otomatis tersinkronisasi ke seluruh perangkat kader lain.
6. Kapan saja, kader/bidan dapat membuka "Daftar Warga" untuk mencari riwayat, "Rekap Desa" untuk laporan agregat, atau "Import CSV" untuk migrasi data lama.
7. Untuk cadangan atau pelaporan, kader dapat mengekspor CSV dari data yang sudah tersimpan.

---

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| **Aksesibilitas usia** | Ukuran font besar (≥18px), tombol besar (≥48px), bahasa Indonesia sederhana, navigasi linear tanpa menu bersarang |
| **Performa low-spec** | Tanpa framework JS berat; halaman ringan, dapat dibuka di perangkat dengan RAM/baterai terbatas dan koneksi lambat |
| **Keamanan akses** | Login wajib, tidak ada pendaftaran publik, otorisasi diberlakukan di level database (Row Level Security), bukan hanya di tampilan |
| **Integritas data** | Setiap data tersimpan mencatat siapa & kapan input/edit (audit trail), mencegah perubahan data tanpa jejak |
| **Privasi data** | Data NIK & kesehatan tunduk pada UU PDP — perlu lembar persetujuan (consent) saat pendataan warga, data hanya dipakai untuk keperluan posyandu/Puskesmas |
| **Ketersediaan** | Sistem harus tetap dapat diakses meski tidak dibuka selama beberapa hari (lihat mitigasi tier gratis di Bagian 8) |
| **Portabilitas data** | Data harus selalu dapat diunduh penuh ke format terbuka (CSV/Excel) sebagai jaring pengaman kalau sistem suatu saat tidak terurus |

---

## 8. Batasan Biaya — Arsitektur Tanpa Biaya (Rp 0)

Prinsip: **setiap komponen wajib punya alternatif gratis yang cukup untuk skala satu desa.** Tidak ada komponen yang membutuhkan kartu kredit atau langganan berbayar.

| Komponen | Solusi Rp 0 | Batas tier gratis | Cukup untuk skala desa? |
|---|---|---|---|
| Hosting web app | Vercel (Hobby/Free plan) | Generous untuk trafik kecil-menengah, non-komersial | ✅ Ya, jauh dari batas |
| Domain | Subdomain bawaan `*.vercel.app` (bukan domain custom berbayar) | Gratis selamanya | ✅ Cukup, tidak perlu domain `.id` berbayar |
| Database + Auth | Supabase (Free plan) — Postgres + Row Level Security + Auth | ±500MB database, cukup untuk puluhan ribu baris data teks | ✅ Ya |
| Sertifikat HTTPS | Otomatis dari Vercel | Gratis, bawaan | ✅ |
| Monitor uptime (mencegah project "tertidur" karena tidak dibuka) | UptimeRobot (Free plan) | 50 monitor gratis, cukup 1 untuk project ini | ✅ |
| Backup data | Ekspor CSV manual oleh kader setiap selesai sesi posyandu (bukan layanan backup berbayar) | Tidak terbatas, manual | ✅, menggantikan fitur backup otomatis yang berbayar di tier gratis Supabase |
| Desain/Ikon | SVG/CSS buatan sendiri, tanpa Canva Pro/asset berbayar | — | ✅ |
| Koneksi internet di posyandu | WiFi balai desa/posyandu yang sudah ada, atau hotspot HP kader (operasional KKN, bukan biaya produk) | — | Diluar lingkup biaya produk |

**Yang sengaja dihindari karena berbayar:**
- Domain custom (`.id`/`.com` berbayar)
- Gateway WhatsApp/SMS API otomatis (hampir semua berbayar per pesan)
- Supabase/Vercel paket Pro (tidak dibutuhkan di skala ini)
- Layanan desain/ikon premium (Canva Pro, dst.)
- Layanan backup otomatis pihak ketiga

> **Catatan jujur:** kalau suatu saat skala data jauh melebihi satu desa (misal diadopsi multi-kecamatan), tier gratis ini akan butuh upgrade berbayar. Untuk skala satu Desa Jurangjero, ini tidak akan terjadi dalam waktu dekat.

---

## 9. Arsitektur Teknis (Ringkas)

```
Staf Posyandu (HP/Laptop, dimana saja)
        │  login (akun terdaftar)
        ▼
   Vercel — Frontend ringan (PWA-ready)
        │  request data via API
        ▼
   Supabase — Backend terkelola
        ├── Auth (akun staf terdaftar, bukan publik)
        └── Database Postgres + Row Level Security
        │
        ▼
   Ekspor CSV/Excel → Laporan ke Puskesmas
```

Detail keamanan akses & desain database dibahas lebih lengkap di diskusi arsitektur sebelumnya (lihat percakapan terkait Vercel + Supabase).

---

## 10. Rencana Keberlanjutan & Kepemilikan

1. Seluruh akun (Vercel, Supabase, GitHub) didaftarkan dengan **email institusional** (posyandu/desa), bukan email pribadi mahasiswa — sejak awal, bukan ditransfer belakangan.
2. Sebelum KKN selesai, dilakukan handover resmi: manual penggunaan tertulis + pelatihan singkat ke 1 admin lokal (kader yang melek HP atau staf Puskesmas).
3. Fitur ekspor CSV menjadi jaring pengaman permanen — data kesehatan warga tidak akan "terkubur" di sistem meski suatu saat tidak ada yang melanjutkan pengembangan.
4. Monitor uptime gratis dipasang agar sistem tidak perlu "dibangunkan" manual oleh siapa pun.

---

## 11. Metrik Keberhasilan (Success Metrics)

| Metrik | Target selama masa KKN |
|---|---|
| % warga remaja & lansia sasaran yang berhasil terdata | ≥ 80% dari estimasi populasi sasaran |
| Jumlah kader yang aktif menggunakan sistem secara mandiri (tanpa didampingi mahasiswa) | ≥ 2 orang sebelum penarikan KKN |
| Rata-rata waktu input per warga | ≤ 5 menit, sebanding/lebih cepat dari pencatatan manual |
| Insiden kesalahan klasifikasi (dibandingkan perhitungan manual) | 0 kasus pada uji verifikasi |
| Biaya operasional bulanan setelah KKN selesai | Rp 0 |

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Project Supabase "tertidur" karena tidak diakses 7 hari | Pasang UptimeRobot gratis untuk ping rutin |
| Tidak ada backup otomatis di tier gratis | Wajibkan ekspor CSV manual setiap akhir sesi posyandu |
| Kader kesulitan login pertama kali | Sediakan akun yang sudah dibuatkan admin + manual bergambar, bukan self-registration |
| Tidak ada yang melanjutkan maintenance setelah KKN | Akun institusional dari awal + 1 admin lokal terlatih + dokumentasi handover |
| Data NIK & kesehatan rentan disalahgunakan | RLS di level database, lembar persetujuan warga, data tidak dibagikan ke pihak luar tanpa izin |
| Kebutuhan melebihi tier gratis di masa depan | Di luar lingkup KKN ini — didokumentasikan sebagai catatan untuk pengelola berikutnya, bukan ditangani sekarang |

---

## 13. Roadmap Setelah v1 (Di Luar Lingkup KKN)

- Import Excel untuk migrasi data lama (pelengkap, bukan pengganti wizard).
- Mode PWA penuh dengan caching offline untuk area minim sinyal.
- Integrasi pelaporan otomatis ke format yang diminta Puskesmas/Dinkes.
- Grafik IMT/U (BMI-for-age) khusus untuk kategori usia remaja/anak, menggantikan estimasi dewasa yang dipakai di v1.

---

## 14. Garis Waktu (Selaras Durasi KKN)

| Minggu | Aktivitas |
|---|---|
| 1–2 | Setup infrastruktur (akun institusional, Vercel, Supabase), migrasi prototipe ke versi production |
| 3–4 | Uji coba bersama 1–2 kader, perbaikan UX berdasarkan feedback langsung |
| 5–6 | Rollout penuh ke seluruh kader posyandu, pendataan warga berjalan |
| 7 | Pelatihan admin lokal, penyusunan manual handover |
| 8 | Serah terima resmi ke posyandu/desa, evaluasi akhir |
