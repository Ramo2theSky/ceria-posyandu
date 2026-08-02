# UI/UX Brief
## CERIA — Sistem Pendataan & Skrining Kesehatan Digital Puskesmas
### Puskesmas Karanganom, Karanganom, Klaten

| | |
|---|---|
| **Versi** | 1.0 |
| **Berdasarkan** | PRD v1.0 · TRD v1.0 · User Journey Flow |
| **Platform target** | Mobile-first (HP Android kader) · Desktop fallback (laptop KKN) |
| **Pengguna utama** | Staf Tenaga Kesehatan, sebagian besar usia lanjut, literasi digital terbatas |

---

## 1. Konteks & Tantangan Desain

Ini bukan aplikasi untuk anak muda yang sudah terbiasa berinteraksi dengan layar. Pengguna utama sistem ini adalah staf tenaga kesehatan berusia 40–65 tahun yang terbiasa bekerja dengan formulir kertas, pensil, dan tabel tulis tangan. Mereka mungkin baru pertama kali menggunakan sistem digital untuk pencatatan kesehatan.

Tiga tantangan desain terbesar yang harus dijawab:

1. **Kepercayaan** — kader harus merasa sistem ini "tidak akan merusak data" saat mereka mencoba sesuatu. Setiap aksi destruktif (hapus) harus punya pagar pengaman (recycle bin, konfirmasi). Setiap aksi berhasil harus memberikan umpan balik yang jelas dan meyakinkan.
2. **Orientasi** — kader tidak boleh pernah merasa "tersesat" di dalam sistem. Mereka harus selalu tahu sedang di mana, sudah sampai langkah berapa, dan apa yang harus dilakukan selanjutnya.
3. **Kecepatan yang wajar** — di hari puskesmas, ada 30–60 warga yang mengantri. Satu sesi input per warga idealnya tidak lebih dari 5 menit. Desain tidak boleh memperlambat alur dengan langkah tambahan yang tidak perlu.

---

## 2. Prinsip Desain

Lima prinsip yang menjadi ukuran setiap keputusan desain di sistem ini:

**① Satu hal per layar**
Setiap halaman punya satu pekerjaan. Halaman input tidak merangkap sebagai halaman rekap. Wizard dibagi tiga langkah yang jelas, bukan satu form panjang yang harus di-scroll. Kader tidak perlu memutuskan "mau ngapain dulu" setiap kali membuka layar baru.

**② Ukuran yang ramah jari tua**
Tombol minimum 48×48px. Font body minimum 18px. Spacing antar elemen interaktif minimum 12px supaya tidak salah pencet. Ini bukan sekadar aksesibilitas — ini kebutuhan fungsional untuk konteks pengguna.

**③ Bahasa ibu, bukan bahasa sistem**
Tidak ada istilah teknis yang tidak dimengerti kader: tidak ada "database", "sync", "error 404". Yang ada: "Data berhasil disimpan", "Nomor KTP tidak lengkap — harus 16 angka", "Sedang menyimpan...". Setiap pesan ditulis dari sisi pengguna, bukan dari sisi sistem.

**④ Hasil langsung terlihat**
Setelah kader input data warga, hasil klasifikasi (SEHAT / PERLU PEMANTAUAN / PERLU RUJUKAN) langsung muncul di layar dengan warna yang jelas sebelum data disimpan. Ini bukan cuma fitur — ini yang membuat kader merasa sistem "membantu", bukan sekadar "mencatat".

**⑤ Aman untuk salah**
Semua aksi hapus masuk recycle bin dulu (30 hari). Tidak ada penghapusan permanen yang bisa dilakukan kader biasa. Sistem tidak pernah menghilangkan data tanpa konfirmasi eksplisit.

---

## 3. Persona

### Persona A — Kader Utama (pengguna harian)
**"Bu Sari, 52 tahun, staf tenaga kesehatan sejak 15 tahun lalu"**
- HP Android entry-level (RAM 2–3 GB, layar 5.5 inci)
- Terbiasa WhatsApp dan foto, belum pernah pakai aplikasi formulir digital
- Sering pakai kacamata baca
- Kondisi kerja: ruang puskesmas ramai, pencahayaan kadang kurang, tangan kadang basah/berkeringat
- Kebutuhan: input cepat, tidak panik kalau salah, bisa lihat hasil langsung

### Persona B — Admin Lokal (pengguna sesekali)
**"Pak Hendra, 35 tahun, staf puskesmas / kader muda yang melek HP"**
- HP Android mid-range, kadang laptop
- Bisa baca dashboard dan rekap tanpa perlu diajari panjang
- Tugas: buat akun kader baru, pulihkan data dari recycle bin, unduh rekap untuk laporan
- Kebutuhan: akses ke fitur manajemen tanpa mengganggu tampilan kader biasa

### Persona C — Peninjau (pengguna baca saja)
**"Bidan Desa, 40 tahun"**
- Melihat rekap desa dan daftar warga berisiko untuk tindak lanjut klinis
- Tidak perlu input data
- Kebutuhan: rekap yang bisa dibaca cepat, bisa diekspor untuk laporan ke puskesmas

---

## 4. Arsitektur Informasi

```
CERIA
│
├── Login                          ← semua pengguna masuk di sini
│
├── Dashboard                      ← landing setelah login
│   ├── [Kartu] Input Data Baru
│   ├── [Kartu] Daftar Warga
│   ├── [Kartu] Rekap Desa
│   └── [Kartu] Impor CSV
│
├── Input Data (wizard 3 langkah)
│   ├── Langkah 1 — Identitas (NIK, TTL, L/P)
│   ├── Langkah 2 — Pengukuran (BB, TB, LP, TD, GDS, CL)
│   └── Langkah 3 — Hasil & Simpan
│
├── Daftar Warga
│   ├── Cari (nama / NIK)
│   ├── Detail per warga (riwayat multi-sesi)
│   ├── Impor CSV (inline modal)
│   └── Hapus (→ masuk recycle bin)
│
├── Rekap Desa
│   ├── Ringkasan statistik (total, berisiko, sehat)
│   ├── Bar chart indikator risiko
│   └── Ekspor CSV
│
└── Pengaturan (admin only)
    ├── Manajemen akun kader
    └── Recycle bin
```

---

## 5. Sistem Visual

### 5.1 Palet Warna

Palet dirancang di sekitar tiga makna semantik yang harus langsung terbaca tanpa legenda: **hijau = aman, kuning/oranye = perhatian, merah = tindakan segera**. Ini mengikuti konvensi visual kesehatan yang sudah dipahami secara intuitif bahkan oleh pengguna non-digital.

| Nama | Hex | Peran |
|---|---|---|
| Hutan | `#1F4E4A` | Warna utama brand, header, tombol primer |
| Hutan Gelap | `#143733` | Hover state tombol primer |
| Daun Muda | `#DCEAE4` | Background aksen brand, chip info |
| Padi | `#D9A23B` | Aksen sekunder, CTA simpan, highlight |
| Kertas | `#F6F7F1` | Background halaman utama |
| Kertas Dalam | `#EEF1E8` | Background kartu, input field |
| Tinta | `#292924` | Teks utama |
| Tinta Lembut | `#62625A` | Teks sekunder, label, hint |
| Garis | `#D8DCCF` | Border, divider |
| Hijau OK | `#2F7D52` | Status sehat, teks pada bg hijau |
| Hijau OK BG | `#E4F2E9` | Background status sehat |
| Kuning Warn | `#C9821D` | Status perlu pemantauan, teks pada bg kuning |
| Kuning Warn BG | `#FBEFD9` | Background status perlu pemantauan |
| Merah Risiko | `#B23A2E` | Status perlu rujukan, teks pada bg merah |
| Merah Risiko BG | `#F8E2DF` | Background status perlu rujukan |

> **Catatan aksesibilitas:** seluruh pasangan warna teks-background di atas memenuhi rasio kontras minimum WCAG AA (4.5:1). Jangan gunakan warna status sebagai satu-satunya pembeda — selalu sertakan ikon atau label teks.

### 5.2 Tipografi

Font utama yang dipakai di implementasi saat ini adalah Inter, dimuat lewat `next/font/google` agar konsisten di semua perangkat.

```css
--font-body: Inter, "Segoe UI", Roboto, Arial, sans-serif;
```

| Peran | Ukuran | Berat | Penggunaan |
|---|---|---|---|
| Judul halaman | 22px | 800 | H1 tiap halaman, maks 1 per halaman |
| Judul kartu / langkah | 20px | 800 | Judul wizard, judul section |
| Label field | 14–15px | 700 | Label di atas input, semua caps dihindari |
| Body / isi | 18px | 400 | Teks paragraf, deskripsi |
| Nilai ukuran (angka) | 20–22px | 700 | Angka hasil pemeriksaan di kartu hasil |
| Stempel status | 11–12px | 800 | Label SEHAT / PERLU RUJUKAN, uppercase |
| Hint / keterangan | 13px | 400 | Teks bantuan di bawah input |

**Aturan ukuran minimum:** tidak ada teks di bawah 13px di seluruh sistem. Ini non-negotiable untuk konteks kader berusia lanjut.

### 5.3 Komponen Inti

**Tombol Primer**
```
Background: #1F4E4A (Hutan)
Teks: putih, 16.5px, berat 800
Padding: 15px 18px
Border radius: 11px
Min-height: 52px
Hover: #143733
```

**Tombol Aksi (Simpan)**
```
Background: #D9A23B (Padi)
Teks: putih, 16.5px, berat 800
Identik dengan tombol primer secara ukuran
```

**Input Field**
```
Font: 18px (wajib — bukan 14px atau 16px default browser)
Padding: 13px 14px
Border: 1.5px solid #D8DCCF
Border radius: 10px
Focus: border-color #1F4E4A + outline 3px solid #D9A23B
```

**Stepper Angka (± tombol)**
```
Tombol − dan +: 46×46px minimum
Posisi: kiri dan kanan input angka
Tujuan: kader tidak perlu mengetik angka desimal di keyboard kecil
```

**Kartu Hasil Pemeriksaan**
```
Layout: nama parameter (kiri) + stempel status (kanan)
Nilai + keterangan: di bawah nama parameter
Warna background kartu: sesuai status (ok-bg / warn-bg / risk-bg)
Border: 1.5px solid warna yang sesuai
Border radius: 12px
```

**Stempel Status (gaya cap stempel)**
```
Font: Georgia / Times New Roman (serif) — sengaja berbeda dari UI
Berat: 800
Ukuran: 11.5px
Transformasi: uppercase + rotate(-2deg) — kesan cap fisik
Border: 2px solid currentColor
Border radius: 7px
Warna: mengikuti status (ok / warn / risk)
```

**Stempel Keseluruhan (header hasil)**
```
Layout: terpusat, teks besar
Border: 3px double currentColor — kesan dokumen resmi
Background: bg warna status
Font stempel: Georgia, 26px, 800
Transformasi: rotate(-2deg) pada teks besar
```

### 5.4 Signature Visual

Elemen visual yang paling menonjol di implementasi sekarang adalah **kartu-kartu ringkas dengan status berwarna** dan hierarki informasi yang jelas. Hasil skrining ditampilkan lewat label status, kartu statistik, dan panel yang bersih, bukan melalui gaya stempel formal. Pendekatan ini lebih sesuai dengan versi yang sudah jadi: ringan dibaca, tidak ramai, dan mudah dipindai oleh kader usia lanjut.

---

## 6. Spesifikasi Layar per Halaman

### 6.1 Login
- Ilustrasi/ikon sederhana di atas (bukan foto atau gambar berat)
- Judul: "CERIA Puskesmas" dengan subjudul nama desa
- Dua field: Email + Password
- Satu tombol: "Masuk"
- **Tidak ada** link "Daftar akun baru" — pendaftaran hanya lewat admin
- Pesan error jika gagal login: "Email atau kata sandi salah. Hubungi admin puskesmas untuk bantuan."

### 6.2 Dashboard
- Sidebar navigasi dengan 4 kartu aksi utama: Input Data, Daftar Warga, Rekap Desa, Impor CSV
- Kartu statistik ringkas di bagian atas untuk memberi konteks cepat
- Quick action cards yang menonjol untuk alur paling sering dipakai
- Info pengguna dan tombol keluar tetap tersedia, tetapi tidak mendominasi layar

```
┌─────────────────────────────┐
│  CERIA  [nama kader] [→]    │
├─────────────────────────────┤
│                             │
│  ┌───────────────────────┐  │
│  │  ➕  Input Data       │  │
│  │      Warga Baru       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  📋  Daftar           │  │
│  │      Warga            │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  📊  Rekap            │  │
│  │      Desa             │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  📥  Impor CSV        │  │
│  │      Data Massal      │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

### 6.3 Wizard Input — Langkah 1 (Identitas)
- Indikator langkah di atas: tiga lingkaran bernomor (1 aktif, 2–3 abu)
- Field: NIK (inputmode numeric), Tanggal Lahir (date picker), Jenis Kelamin (toggle L/P besar), No. HP (opsional), Alamat (textarea)
- Live feedback usia + kategori (remaja/dewasa/lansia) muncul otomatis saat tanggal lahir diisi
- Peringatan kuning muncul jika usia < 18 tahun (catatan IMT/U)
- Tombol navigasi: "Lanjut ke Pengukuran →" (penuh lebar)
- Validasi dilakukan saat tombol Lanjut ditekan, bukan real-time — supaya tidak mengganggu saat kader masih mengetik

### 6.4 Wizard Input — Langkah 2 (Pengukuran)
- Setiap parameter punya tombol − dan + di kiri dan kanan input
- Urutan field: BB → TB → (IMT live muncul di sini) → LP → TD Sistol / TD Diastol → GDS → Kolesterol Total
- Kolesterol Total ditandai "(opsional)" dan tidak memblokir langkah berikutnya jika kosong
- TD Sistol dan Diastol dalam satu baris berdampingan dengan label jelas
- Live chip IMT muncul segera setelah BB dan TB terisi, tanpa harus tekan tombol
- Tanggal pemeriksaan dan nama petugas diisi sekali di awal langkah ini (bukan per warga)
- Tombol navigasi: "← Kembali" (ghost) + "Lihat Hasil →" (primer)

### 6.5 Wizard Input — Langkah 3 (Hasil & Simpan)
- Stempel keseluruhan di posisi paling atas — terbaca dalam 1 detik tanpa scroll
- Kartu per parameter di bawahnya (IMT, TD, GDS, Kolesterol, LP)
- Kartu kolesterol ditampilkan sebagai "Tidak Diperiksa" jika kosong — tidak disembunyikan
- Textarea catatan dokter (auto-isi dari kesimpulan otomatis, bisa diedit)
- Tombol: "← Kembali" (ghost) + "💾 Simpan Data" (padi/gold)
- Setelah simpan berhasil: muncul notifikasi singkat "Data [Nama] tersimpan ✓" lalu kembali ke dashboard

### 6.6 Daftar Warga
- Search bar di paling atas (cari nama atau NIK)
- Setiap item daftar menampilkan NIK yang dimask, usia, tanggal periksa, dan status ringkas
- Tap item → expand detail in-place (bukan halaman baru)
- Detail expanded menampilkan riwayat hasil, data identitas yang tersedia, dan aksi hapus soft delete
- Tombol Hapus tetap perlu konfirmasi, tetapi tidak ada recycle bin terpisah pada versi saat ini
- Empty state (belum ada data): teks sederhana yang mengarahkan ke Input Data

### 6.7 Rekap Desa
- Empat kotak statistik di grid 2×2: Total Warga, Perlu Rujukan, Perlu Pemantauan, Sehat
- Bar horizontal per indikator risiko (Hipertensi, Diabetes, Kolesterol, Obesitas, LP Berisiko)
- Breakdown per kategori usia (Remaja / Dewasa / Lansia)
- Tombol ekspor CSV di bagian bawah
- Semua angka besar, mudah dibaca dari jarak setengah meter

### 6.8 Soft Delete
- Penghapusan data pada implementasi saat ini bersifat soft delete
- Data yang dihapus tidak tampil di daftar aktif dan rekap aktif
- Tidak ada layar recycle bin terpisah pada versi yang sudah jadi
- Jika nanti dibutuhkan, recycle bin dapat dijadikan fase lanjutan

---

## 7. Pola Interaksi

### Navigasi
- Tidak ada menu hamburger tersembunyi — navigasi utama adalah empat kartu aksi di dashboard
- Tombol Kembali browser/native selalu berfungsi dan tidak menyebabkan kehilangan data (form di-cache di state)
- Breadcrumb minimal: hanya di wizard ("Langkah 2 dari 3"), tidak di halaman lain

### Feedback & State
| Kondisi | Tampilan |
|---|---|
| Sedang menyimpan | Tombol simpan: spinner + teks "Menyimpan..." |
| Berhasil disimpan | Toast hijau di bawah layar: "Data [Nama] tersimpan ✓" (2 detik) |
| Gagal simpan (koneksi) | Toast merah: "Gagal menyimpan. Periksa koneksi internet." |
| Field tidak valid | Border merah + teks error di bawah field (spesifik, bukan generik) |
| Loading data | Skeleton screen (bukan spinner penuh layar) |
| Data kosong | Empty state dengan ilustrasi + instruksi singkat |

Pada implementasi sekarang, beberapa alur masih menggunakan alert atau banner sederhana untuk menjaga kesederhanaan dan mengurangi kompleksitas UI bagi kader.

### Konfirmasi Aksi Destruktif
Tiga level konfirmasi berdasarkan risiko:
1. **Hapus ke recycle bin** — dialog konfirmasi satu kali ("Pindahkan ke recycle bin?")
2. **Hapus permanen dari recycle bin** — dialog konfirmasi dengan nama warga ditampilkan eksplisit
3. **Kosongkan semua recycle bin** — ketik ulang kata "HAPUS" sebelum bisa eksekusi

---

## 8. Responsivitas

| Breakpoint | Layout |
|---|---|
| < 480px (HP kecil) | Single column, padding 16px, tombol full-width |
| 480–760px (HP besar / tablet kecil) | Single column, padding 18px, elemen sedikit lebih lega |
| > 760px (tablet / laptop) | Max-width 760px, centered, padding horizontal lebih besar |

Sistem ini **mobile-first** — desktop adalah fallback, bukan target utama. Seluruh logika interaksi (ukuran tap target, stepper angka, toggle L/P) dirancang untuk jari di layar sentuh, bukan kursor mouse.

---

## 9. Aksesibilitas

| Aspek | Implementasi |
|---|---|
| Ukuran tap target | Minimum 48×48px untuk semua elemen interaktif |
| Kontras warna | Semua pasangan teks-background memenuhi WCAG AA (4.5:1) |
| Focus indicator | Outline 3px solid #D9A23B (warna padi) pada semua elemen fokus |
| Reduced motion | Animasi (loading, transisi) dibungkus `@media (prefers-reduced-motion)` |
| Label field | Setiap input punya `<label>` eksplisit — tidak hanya placeholder |
| Error message | Dihubungkan ke input via `aria-describedby` |
| Bahasa | Seluruh UI dalam Bahasa Indonesia, tanpa istilah teknis asing |

---

## 10. Copy Guidelines (Panduan Penulisan UI)

**Prinsip:** tulis dari sisi pengguna, bukan dari sisi sistem.

| ❌ Hindari | ✅ Gunakan |
|---|---|
| "Data berhasil di-submit ke database" | "Data [Nama] tersimpan" |
| "Error: NIK invalid format" | "Nomor KTP harus 16 angka" |
| "Unauthorized access" | "Silakan masuk terlebih dahulu" |
| "Sync failed" | "Gagal menyimpan. Periksa koneksi internet." |
| "Delete record?" | "Pindahkan data ini ke recycle bin?" |
| "N/A" | "Tidak Diperiksa" |
| "Loading..." | "Memuat data warga..." |
| "Submit" | "Simpan Data" |
| "Cancel" | "Batal" atau "Kembali" (sesuai konteks) |

**Pesan error harus selalu menjawab dua pertanyaan:** apa yang salah + apa yang harus dilakukan.
- Buruk: "Terjadi kesalahan"
- Baik: "Nomor KTP harus 16 angka. Cek kembali KTP warga dan isi ulang."

---

## 11. Yang Sengaja Tidak Ada

Beberapa keputusan desain berupa penghilangan yang disengaja:

- **Tidak ada dark mode** — menambah kompleksitas visual testing tanpa manfaat signifikan untuk konteks puskesmas siang hari. Bisa ditambah di iterasi berikutnya.
- **Tidak ada animasi page transition** — koneksi di lapangan bisa lambat, transisi halus bisa terasa lag dan mengecohkan kader bahwa ada yang salah.
- **Tidak ada fitur kamera / scan KTP** — butuh permission browser + handling gagal scan + library tambahan. Verifikasi NIK tetap manual (ketik dari fotokopi KTP).
- **Tidak ada notifikasi push** — semua gateway push notification berbayar atau butuh service worker yang kompleks. Rekap desa sudah cukup sebagai mekanisme tindak lanjut.
- **Tidak ada grafik interaktif kompleks** — bar horizontal sederhana di rekap desa lebih dapat dibaca oleh semua persona dibanding chart library berat.
- **Tidak ada onboarding walkthrough** — digantikan oleh manual bergambar yang dicetak dan diserahkan saat pelatihan. Walkthrough in-app membutuhkan maintenance saat UI berubah.
