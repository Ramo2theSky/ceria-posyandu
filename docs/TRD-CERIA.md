# Technical Requirements Document (TRD)
## CERIA — Sistem Pendataan & Skrining Kesehatan Digital Puskesmas Remaja & Lansia
### Puskesmas Karanganom, Karanganom, Klaten

| | |
|---|---|
| **Versi** | 1.0 |
| **Berdasarkan** | PRD CERIA v1.0 |
| **Data referensi** | KKN CERIA - 30 Juni.csv (62 warga, sesi pertama) |
| **Stack** | Next.js · Supabase (Postgres + Auth + RLS) · Vercel |
| **Anggaran infrastruktur** | Rp 0 (seluruh tier gratis) |

---

## 1. Struktur Data Riil

Berdasarkan analisis langsung terhadap `KKN_CERIA_-_30_Juni.csv`, berikut adalah pemetaan kolom sumber ke skema sistem:

| Kolom CSV | Nama Sistem | Tipe | Wajib | Catatan |
|---|---|---|---|---|
| `NIK` | `nik` | `VARCHAR(16)` | ✅ | Primary key, wajib 16 digit, simpan sebagai teks bukan angka |
| `TTL` | `tanggal_lahir` | `DATE` | ✅ | Format sumber: `DD/MM/YYYY` — perlu parsing saat import |
| `L/P` | `jenis_kelamin` | `CHAR(1)` | ✅ | Nilai valid: `L` atau `P` — ada typo `.L` di data riil, perlu sanitasi |
| `BB` | `berat_badan` | `NUMERIC(5,1)` | ✅ | Satuan: kg, contoh: `51.0`, `102.1` |
| `TB` | `tinggi_badan` | `NUMERIC(5,1)` | ✅ | Satuan: cm, contoh: `149.5`, `178.5` |
| `LP` | `lingkar_pinggang` | `NUMERIC(5,1)` | ✅ | Satuan: cm |
| `TD` | `tekanan_darah_sistol` + `tekanan_darah_diastol` | `SMALLINT` + `SMALLINT` | ✅ | Format sumber: `"119/116"` — perlu split saat input/import. Catatan: 1 baris di data riil hanya punya sistol tanpa diastol (`"121"`) — wajib divalidasi |
| `GDS` | `gds` | `SMALLINT` | ✅ | Satuan: mg/dL |
| `CL` | `kolesterol_total` | `SMALLINT` | ❌ | Nullable — banyak warga tidak dicek kolesterol (`"-"` di CSV = NULL di DB) |
| *(dihitung sistem)* | `catatan` | `TEXT` | — | Diisi dari hasil klasifikasi keseluruhan, bukan dibaca dari CSV mentah |
| *(dihitung sistem)* | `imt` | `NUMERIC(4,1)` | — | Computed: `BB / (TB/100)²`, tidak disimpan di DB, dihitung saat query |
| *(dihitung sistem)* | `usia` | `SMALLINT` | — | Computed dari `tanggal_lahir` relatif ke `tanggal_periksa` |

> Struktur tabel yang benar-benar dipakai aplikasi saat ini mengikuti migration `001_initial_schema.sql` + hardening `003_harden_pemeriksaan_rls.sql`. Tidak ada tabel `warga` terpisah, tidak ada `terverifikasi`, dan audit trail dipakai lewat `dibuat_oleh`, `dibuat_pada`, `diubah_pada`, `dihapus_pada`, dan `dihapus_oleh`.

---

## 2. Skema Database (Supabase Postgres)

### Tabel: `kader` (dikelola oleh Supabase Auth)
```sql
-- Dikelola otomatis oleh Supabase Auth
-- Tidak perlu dibuat manual
-- Akses via auth.users()
```

### Tabel: `pemeriksaan`
```sql
CREATE TABLE pemeriksaan (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identitas warga
  nik              VARCHAR(16) NOT NULL,
  tanggal_lahir    DATE NOT NULL,
  jenis_kelamin    CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),

  -- Hasil pengukuran
  berat_badan      NUMERIC(5,1) NOT NULL,
  tinggi_badan     NUMERIC(5,1) NOT NULL,
  lingkar_pinggang NUMERIC(5,1) NOT NULL,
  td_sistol        SMALLINT NOT NULL,
  td_diastol       SMALLINT NOT NULL,
  gds              SMALLINT NOT NULL,
  kolesterol_total SMALLINT,                        -- nullable: tidak semua warga dicek

  -- Metadata sesi
  tanggal_periksa  DATE NOT NULL DEFAULT CURRENT_DATE,
  catatan          TEXT,

  -- Audit
  dibuat_oleh      UUID REFERENCES auth.users(id),
  dibuat_pada      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  diubah_pada      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dihapus_pada     TIMESTAMPTZ,
  dihapus_oleh     UUID REFERENCES auth.users(id)
);
```

### Kenapa tidak ada tabel `warga` terpisah?
Berdasarkan data riil, satu NIK bisa muncul di lebih dari satu sesi pemeriksaan (30 Juni + sesi berikutnya). Daripada memisahkan tabel `warga` dan `pemeriksaan` yang memperumit query untuk skala ini, seluruh data disimpan per-sesi dalam satu tabel `pemeriksaan`. NIK tetap jadi identifier utama untuk pencarian riwayat per-warga, tapi bukan `UNIQUE` constraint karena boleh ada lebih dari satu baris per NIK (multi-sesi).

---

## 3. Row Level Security (RLS)

Seluruh akses data dibatasi di level database — bukan hanya di tampilan frontend.

```sql
-- Aktifkan RLS
ALTER TABLE pemeriksaan ENABLE ROW LEVEL SECURITY;

-- Kader boleh baca data non-deleted
CREATE POLICY "kader_baca" ON pemeriksaan
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND dihapus_pada IS NULL
  );

-- Insert hanya untuk user login dan ownership harus cocok
CREATE POLICY "kader_input" ON pemeriksaan
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND dibuat_oleh = auth.uid()
  );

-- Update hanya untuk data milik sendiri yang belum dihapus
CREATE POLICY "kader_edit_milik_sendiri" ON pemeriksaan
  FOR UPDATE USING (
    auth.role() = 'authenticated'
    AND dibuat_oleh = auth.uid()
    AND dihapus_pada IS NULL
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND dibuat_oleh = auth.uid()
    AND dihapus_pada IS NULL
  );

-- Admin ditentukan oleh custom claim `user_role`
CREATE POLICY "admin_hapus" ON pemeriksaan
  FOR DELETE USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );
```

### 3.1 Hook Auth Admin
- Admin tidak ditentukan dari `user_metadata.role`
- Role admin berasal dari tabel `admin_users` dan custom claim `user_role`
- Setelah admin ditambah atau dihapus, user terkait harus login ulang agar JWT baru terbaca

---

## 4. Logika Klasifikasi Kesehatan

Semua fungsi klasifikasi diimplementasikan sebagai **pure functions** di sisi frontend (bukan di database), agar mudah diuji dan diperbarui kalau ambang batas WHO/Kemenkes berubah.

Status keseluruhan **bukan** dibaca dari CSV, melainkan dihitung ulang dari parameter yang lolos validasi pada saat input/import.

Aturan prioritas di sistem yang sudah jadi:
- Jika ada minimal satu indikator `risk` maka status keseluruhan = `PERLU RUJUKAN`.
- Jika tidak ada `risk` tetapi ada minimal satu indikator `warn` maka status keseluruhan = `PERLU PEMANTAUAN`.
- Jika semua indikator yang tersedia `ok` maka status keseluruhan = `SEHAT`.
- Kolesterol yang kosong/null diabaikan, tidak otomatis membuat status menjadi sehat atau berisiko.

### 4.1 IMT / BMI
```javascript
// Ambang batas: WHO/IOTF 2000 (Asia Pasifik)
function klasifikasiIMT(bb, tb) {
  const imt = bb / Math.pow(tb / 100, 2);
  if (imt < 18.5) return { label: 'Kurus',      status: 'warn', ket: 'Perlu peningkatan gizi' };
  if (imt < 23.0) return { label: 'Normal',     status: 'ok',   ket: 'Ideal (cut-off Asia Pasifik)' };
  if (imt < 25.0) return { label: 'Overweight', status: 'warn', ket: 'Risiko meningkat' };
  return             { label: 'Obesitas',        status: 'risk', ket: 'Risiko tinggi, konsultasi dokter/ahli gizi' };
}
```

### 4.2 Tekanan Darah
```javascript
// Ambang batas: WHO 2023
function klasifikasiTD(sistol, diastol) {
  if (sistol >= 140 || diastol >= 90) return { label: 'Hipertensi Tk.2', status: 'risk', ket: 'Rujuk, kemungkinan terapi obat' };
  if (sistol >= 130 || diastol >= 80) return { label: 'Hipertensi Tk.1', status: 'warn', ket: 'Konsultasi dokter' };
  if (sistol >= 120)                  return { label: 'Elevasi',         status: 'warn', ket: 'Perlu pemantauan' };
  return                                     { label: 'Normal',          status: 'ok',   ket: 'Optimal' };
}
```

### 4.3 Gula Darah Sewaktu (GDS)
```javascript
// Ambang batas: P2PTM Kemenkes RI
function klasifikasiGDS(gds) {
  if (gds >= 200) return { label: 'Diabetes Melitus', status: 'risk', ket: 'Rujuk dokter, konfirmasi HbA1c/TTGO' };
  if (gds >= 140) return { label: 'Pra-diabetes',     status: 'warn', ket: 'Toleransi glukosa terganggu' };
  return                 { label: 'Normal',           status: 'ok',   ket: 'Kadar gula terkontrol' };
}
```

### 4.4 Kolesterol Total
```javascript
// Ambang batas: P2PTM Kemenkes RI
// CATATAN: nullable — wajib cek null sebelum memanggil fungsi ini
function klasifikasiKolesterol(kol) {
  if (kol === null || kol === undefined) return null; // tidak dicek, tidak diklasifikasikan
  if (kol >= 240) return { label: 'Tinggi',               status: 'risk', ket: 'Risiko tinggi, rujuk dokter' };
  if (kol >= 200) return { label: 'Ambang Batas Tinggi',  status: 'warn', ket: 'Perlu pemantauan & perubahan gaya hidup' };
  return                 { label: 'Normal',               status: 'ok',   ket: 'Risiko kardiovaskular rendah' };
}
```

### 4.5 Lingkar Pinggang
```javascript
// Ambang batas: Kemenkes RI 2013
function klasifikasiLP(lp, jk) {
  const batas = jk === 'L' ? 90 : 80;
  if (lp >= batas) return { label: 'Berisiko', status: 'risk', ket: 'Risiko obesitas sentral, konsultasi dokter' };
  return                  { label: 'Normal',   status: 'ok',   ket: 'Risiko metabolik rendah' };
}
```

### 4.6 Status Keseluruhan
```javascript
function statusKeseluruhan(hasilArray) {
  // hasilArray: array hasil dari semua fungsi klasifikasi di atas (null diabaikan)
  const valid = hasilArray.filter(h => h !== null);
  if (valid.some(h => h.status === 'risk')) return 'PERLU RUJUKAN';
  if (valid.some(h => h.status === 'warn')) return 'PERLU PEMANTAUAN';
  return 'SEHAT';
}
```

### 4.7 Peringatan Usia Remaja
```javascript
// IMT standar dewasa tidak valid untuk usia < 18 tahun
// Wajib tampilkan peringatan, bukan blokir input
function peringatanUsiaRemaja(usia) {
  if (usia < 18) return 'Perhatian: untuk usia di bawah 18 tahun, klasifikasi IMT ini menggunakan standar dewasa. Konfirmasi ke tenaga kesehatan untuk penilaian IMT/U (BMI-for-age) yang lebih akurat.';
  return null;
}
```

---

## 5. Validasi Data Input

Berdasarkan anomali yang ditemukan di data riil 30 Juni:

| Field | Aturan Validasi | Dasar Temuan |
|---|---|---|
| `nik` | Wajib 16 digit angka, simpan sebagai string (VARCHAR bukan INTEGER) | NIK wajib tidak boleh dikonversi ke angka — Excel dan beberapa input numerik akan membulatkan digit terakhir |
| `jenis_kelamin` | Hanya `L` atau `P`, trim whitespace dan strip karakter non-alfabet sebelum validasi | Ditemukan `.L` di baris 29 data riil |
| `td_diastol` | Wajib ada pada input manual; import CSV legacy harus divalidasi per-baris | Baris 32 data riil hanya punya `"121"` tanpa diastol |
| `kolesterol_total` | Boleh kosong/null — jangan paksa isi, tampilkan "Tidak Diperiksa" | Mayoritas warga di data riil tidak dicek kolesterol (`"-"`) |
| `tanggal_lahir` | Format input: `DD/MM/YYYY` (sesuai kebiasaan Indonesia) — konversi ke `YYYY-MM-DD` sebelum simpan ke DB | Format CSV sumber |
| `berat_badan` | Range wajar: 10–300 kg | Cegah input tidak masuk akal |
| `tinggi_badan` | Range wajar: 50–250 cm | Cegah input tidak masuk akal |
| `gds` | Range wajar: 40–600 mg/dL | Cegah input tidak masuk akal |

---

## 6. Fitur Import CSV (Opsional, Tahap Lanjut)

Berdasarkan struktur `KKN_CERIA_-_30_Juni.csv`, berikut spesifikasi parser import untuk migrasi data lama:

### Template kolom yang diterima sistem:
```
Nomer, NIK, TTL, L/P, BB, TB, LP, TD, GDS, CL
```

### Aturan parsing:
```javascript
function parseBarisCSV(baris) {
  return {
    nik:              baris.NIK?.toString().trim(),
    tanggal_lahir:    parseTanggal(baris.TTL),          // DD/MM/YYYY → Date
    jenis_kelamin:    baris['L/P']?.replace(/[^LP]/g, '').trim().toUpperCase(),  // strip ".L" → "L"
    berat_badan:      parseFloat(baris.BB),
    tinggi_badan:     parseFloat(baris.TB),
    lingkar_pinggang: parseFloat(baris.LP),
    td_sistol:        parseInt(baris.TD?.split('/')[0]),
    td_diastol:       parseInt(baris.TD?.split('/')[1]) || null,  // handle kasus tanpa diastol
    gds:              parseInt(baris.GDS),
    kolesterol_total: baris.CL === '-' || !baris.CL ? null : parseInt(baris.CL),
  };
}

function parseTanggal(str) {
  // Handle format DD/MM/YYYY dari CSV
  const [d, m, y] = str.split('/');
  return new Date(`${y}-${m}-${d}`);
}
```

### Baris yang ditolak otomatis (ditampilkan ke pengguna sebagai error per-baris):
- NIK bukan 16 digit
- NIK sudah ada di database (duplikat sesi yang sama)
- `jenis_kelamin` bukan `L` atau `P` setelah sanitasi
- `BB`, `TB`, `LP`, `GDS` bukan angka valid
- `TD` tidak punya format `angka/angka` (sistol dan diastol keduanya harus ada)
- Baris kosong (seperti baris 63–81 di data riil) diabaikan diam-diam

### 6.1 CSV yang dipakai sistem sekarang
- Header yang diterima: `Nomer, NIK, TTL, L/P, BB, TB, LP, TD, GDS, CL`
- Delimiter dideteksi otomatis: koma atau titik koma
- Baris header, baris pembuka kosong, dan baris kosong di tengah file diabaikan
- Baris hasil import dihitung statusnya ulang memakai fungsi klasifikasi di Bagian 4
- Field `catatan` diisi otomatis berdasarkan hasil klasifikasi keseluruhan (SEHAT / PERLU PEMANTAUAN / PERLU RUJUKAN)

---

## 7. Arsitektur Aplikasi

```
/src
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── input/
│   ├── daftar/
│   ├── rekap/
│   ├── import/
│   ├── lupa-password/
│   └── reset-password/
├── app/api/
│   └── backup/
├── lib/
│   ├── klasifikasi.ts
│   ├── validasi.ts
│   ├── csv-parser.ts
│   └── supabase.ts
└── middleware.ts
```

---

## 8. Infrastruktur & Deployment (Rp 0)

| Komponen | Platform | Tier | Batas yang relevan |
|---|---|---|---|
| Frontend + hosting | Vercel | Hobby (Free) | Bandwidth generous untuk trafik kecil |
| Database | Supabase | Free | 500 MB storage — cukup untuk ribuan baris data teks |
| Autentikasi | Supabase Auth | Free (bawaan) | Termasuk dalam tier gratis Supabase |
| Domain | `*.vercel.app` | Gratis selamanya | Tidak perlu domain custom berbayar |
| HTTPS/SSL | Vercel (otomatis) | Gratis (bawaan) | |
| Monitor uptime | UptimeRobot | Free | 1 monitor untuk cegah Supabase tertidur setelah 7 hari tidak aktif |
| Version control | GitHub | Free | Repository private untuk keamanan |

### Catatan kritis tier gratis Supabase:
- Project di-pause otomatis setelah **7 hari tidak ada aktivitas** → pasang UptimeRobot ping setiap 3 hari
- **Tidak ada backup otomatis bawaan** → sistem menyediakan ekspor CSV dan endpoint backup terproteksi, tetapi ekspor CSV manual tetap jaring pengaman utama
- Maksimal **2 project aktif** per akun gratis → pastikan hanya 1 project CERIA yang aktif

---

## 9. Keamanan Data

| Ancaman | Mitigasi |
|---|---|
| Akses tidak sah ke data warga | RLS Supabase: query selalu gagal untuk user tidak terlogin, bahkan jika URL API diakses langsung |
| Kader tidak sengaja hapus data massal | Kebijakan hapus hanya untuk role `admin`, bukan kader biasa |
| NIK dibulatkan oleh Excel saat import | Parser selalu baca NIK sebagai string, bukan angka |
| Data kesehatan bocor via URL | Tidak ada data sensitif di URL parameter — seluruhnya via POST/body |
| Sesi login tidak berakhir | Supabase Auth punya token expiry — kader wajib login ulang setelah periode tertentu |
| Tidak ada yang tahu password akun institusional | Simpan di password manager gratis (Bitwarden) yang diserahkan saat handover |
| Status semua data terlihat sehat saat import CSV | Status dihitung ulang dari IMT, TD, GDS, kolesterol, dan LP saat import; `catatan` field diisi otomatis berdasarkan hasil klasifikasi |

---

## 10. Temuan Data Riil yang Perlu Ditindaklanjuti

Dari analisis `KKN_CERIA_-_30_Juni.csv` — ini bukan keputusan teknis, tapi perlu dikonfirmasi ke bidan puskesmas:

| # | Temuan | Baris | Rekomendasi |
|---|---|---|---|
| 1 | Jenis kelamin `.L` (ada titik) | Baris 29 | Konfirmasi ke bidan: kemungkinan `L`, perlu koreksi manual |
| 2 | Tekanan darah hanya `"121"` tanpa diastol | Baris 32 | Tanyakan ke bidan: apakah alat tensimeter rusak atau memang tidak tercatat |
| 3 | GDS = 372 mg/dL (sangat tinggi) | Baris 22 | Pastikan ini bukan salah ketik — kalau benar, warga ini perlu rujukan segera |
| 4 | GDS = 302 mg/dL | Baris 16 | Sama dengan di atas |
| 5 | BB = 102.1 kg dengan TD 134/85 | Baris 29 | Data valid secara format, tapi perlu perhatian klinis |
| 6 | Baris 63–81 kosong | Baris 63–81 | Abaikan saat import — bukan data |
| 7 | Kolesterol `-` untuk mayoritas warga | Banyak baris | Kolesterol hanya dicek untuk warga tertentu — sistem wajib mengizinkan kolom ini kosong |

---

## 11. Definisi Selesai (Definition of Done)

Sistem dinyatakan siap diserahterimakan ke puskesmas apabila:

- [ ] Seluruh data contoh CSV di `docs/` berhasil diimpor ke database tanpa error yang tidak perlu
- [ ] Data sesi berikutnya bisa diinput manual dan hasilnya tersinkronisasi
- [ ] Klasifikasi otomatis menghasilkan hasil yang identik dengan perhitungan manual untuk baris data riil yang valid
- [ ] Login hanya bisa dilakukan dengan akun yang sudah dibuat admin
- [ ] Ekspor CSV berfungsi dan menghasilkan file yang bisa dibuka di Excel tanpa NIK rusak
- [ ] Sistem dapat diakses dari HP Android/iOS yang biasa dipakai kader
- [ ] Minimal 2 kader berhasil menggunakan sistem secara mandiri tanpa pendampingan mahasiswa
- [ ] Manual penggunaan bergambar sudah diserahkan dalam bentuk cetak dan digital
- [ ] Akun Vercel dan Supabase sudah dipindahkan ke email institusional puskesmas/desa
