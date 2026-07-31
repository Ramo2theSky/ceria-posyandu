# CERIA — Implementation Plan & Progress Report

> **CERIA** = Cek Kesehatan Interaktif & Aplikatif
> Platform pengumpulan dan klasifikasi data kesehatan warga untuk Posyandu Remaja & Lansia
> Desa Jurangjero, Karanganom, Klaten

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Constraints](#2-tech-stack--constraints)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Implementation Progress](#5-implementation-progress)
6. [Classification Engine](#6-classification-engine)
7. [UI/UX Design System](#7-uiux-design-system)
8. [Pages & Features](#8-pages--features)
9. [Data Import](#9-data-import)
10. [Remaining Work](#10-remaining-work)
11. [Deployment Plan](#11-deployment-plan)

---

## 1. Project Overview

**Problem:** Posyandu Remaja & Lansia di Desa Jurangjero masih menggunakan formulir kertas (CKG) untuk mencatat data kesehatan warga. Proses manual ini rentan terhadap kesalahan, sulit dilacak, dan tidak memiliki riwayat data yang terstruktur.

**Solution:** Aplikasi web CERIA yang memungkinkan kader posyandu:
- Input data pemeriksaan kesehatan warga secara digital
- Klasifikasi otomatis berdasarkan standar WHO & Kemenkes RI
- Melihat daftar warga dengan pencarian dan filter
- Mencetak rekap data per desa
- Mengimpor data dari file CSV (eksport dari Google Sheets)

**Users:** Kader posyandu berusia 40-65 tahun dengan tingkat literasi digital terbatas, menggunakan perangkat Android kelas menengah ke bawah (RAM 2-3GB, layar 5.5").

---

## 2. Tech Stack & Constraints

| Layer | Technology | Reason |
|---|---|---|
| **Framework** | Next.js 16+ (App Router, TypeScript) | React ecosystem, SSR/SSG, TypeScript safety |
| **Styling** | Tailwind CSS v4 | Utility-first, no CSS-in-JS overhead |
| **Database** | Supabase (PostgreSQL) | Free tier, built-in Auth, RLS, real-time |
| **Auth** | Supabase Auth (email + password) | Free, JWT-based, custom claims |
| **Hosting** | Vercel (Hobby plan) | Free, zero-config Next.js deploy |

### Hard Constraints
- **Budget: Rp 0** — all free tiers only
- **No heavy JS frameworks** — app must run on low-end devices with poor connectivity
- **No paid fonts, icons, or external services**
- **Indonesian language** for all UI text
- **Offline-tolerant** — pages should load even with intermittent connectivity

### Supabase Configuration
- **Region:** Singapore (closest to Indonesia)
- **URL:** `https://bywewiyiernmjkazihjs.supabase.co`
- **Credentials:** stored in `.env.local`

---

## 3. Architecture

```
ceria-app/
├── src/
│   ├── app/
│   │   ├── globals.css          # Design tokens + component styles
│   │   ├── layout.tsx           # Root layout with viewport/metadata
│   │   ├── page.tsx             # Login page
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Main menu (3 action cards)
│   │   ├── input/
│   │   │   └── page.tsx         # 3-step data entry wizard
│   │   ├── daftar/
│   │   │   └── page.tsx         # CRUD table + CSV import modal
│   │   ├── rekap/
│   │   │   └── page.tsx         # Statistics dashboard + CSV export
│   │   └── import/
│   │       └── page.tsx         # Standalone import (legacy, now in daftar)
│   └── lib/
│       ├── supabase.ts          # Supabase client singleton
│       ├── klasifikasi.ts       # Classification engine (WHO/Kemenkes)
│       ├── validasi.ts          # Input validation + sanitization
│       └── csv-parser.ts        # CSV parser with date parameter
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # DB schema, RLS, views, triggers
├── .env.local                   # Supabase credentials
├── .gitignore
├── package.json
├── tsconfig.json
└── next.config.ts
```

### Data Flow
```
User Input → Validation → Classification → Supabase DB
                                                  ↓
CSV File → Parser → Validation → Classification → Supabase DB
                                                  ↓
Supabase DB → Dashboard (stats) / Daftar (table) / Rekap (export)
```

---

## 4. Database Schema

### Table: `pemeriksaan`

| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `nik` | VARCHAR(16) | Nomor Induk Kependudukan |
| `tanggal_lahir` | DATE | Tanggal lahir |
| `jenis_kelamin` | CHAR(1) CHECK ('L','P') | Jenis kelamin |
| `berat_badan` | NUMERIC(5,1) | Berat badan dalam kg |
| `tinggi_badan` | NUMERIC(5,1) | Tinggi badan dalam cm |
| `lingkar_pinggang` | NUMERIC(5,1) | Lingkar pinggang dalam cm |
| `td_sistol` | SMALLINT | Tekanan darah sistolik (mmHg) |
| `td_diastol` | SMALLINT | Tekanan darah diastolik (mmHg) |
| `gds` | SMALLINT | Glukosa Darah Sewaktu (mg/dL) |
| `kolesterol_total` | SMALLINT | Kolesterol total (mg/dL), nullable |
| `tanggal_periksa` | DATE | Tanggal pemeriksaan |
| `catatan` | TEXT | Status: "SEHAT", "PERLU PEMANTAUAN", "PERLU RUJUKAN" |
| `dibuat_oleh` | UUID (FK auth.users) | User yang input data |
| `dibuat_pada` | TIMESTAMPTZ | Waktu pembuatan record |
| `diubah_pada` | TIMESTAMPTZ | Waktu terakhir diubah |
| `dihapus_pada` | TIMESTAMPTZ | Waktu soft delete (nullable) |
| `dihapus_oleh` | UUID (FK auth.users) | User yang hapus (nullable) |

### Row Level Security (RLS)
- **Authenticated users** can SELECT, INSERT, UPDATE, DELETE
- Policies enforce authentication for all operations

### Views
- **`v_pemeriksaan_aktif`** — main view (excludes soft-deleted)
- **`v_pemeriksaan_recycle_bin`** — soft-deleted records

### Triggers
- `updated_at` auto-update on row modification

---

## 5. Implementation Progress

### ✅ Completed

| # | Feature | Status | Notes |
|---|---|---|---|
| 1 | Project initialization | ✅ Done | Next.js 16, Tailwind v4, TypeScript |
| 2 | Supabase migration | ✅ Done | Schema + RLS + views + triggers |
| 3 | `.env.local` configured | ✅ Done | Real Supabase URL + anon key |
| 4 | Auth system | ✅ Done | Login page, localStorage session, logout |
| 5 | Dashboard | ✅ Done | 3 action cards with modern UI |
| 6 | Input page (3-step wizard) | ✅ Done | Identitas → Pengukuran → Hasil |
| 7 | Classification engine | ✅ Done | IMT, TD, GDS, Kolesterol, LP |
| 8 | Validation module | ✅ Done | NIK, ranges, sanitization |
| 9 | CSV parser | ✅ Done | 29 & 30 Juni format, date param |
| 10 | Rekap Desa page | ✅ Done | 4 stat cards, 5 risk bars, age + BMI, CSV export |
| 11 | Daftar Warga page | ✅ Done | CRUD table, pagination, sort, search, soft delete |
| 12 | CSV import integration | ✅ Done | Date picker modal in Daftar Warga |
| 13 | UI/UX modernization | ✅ Done | Gradients, glassmorphism, hover effects, soft shadows |
| 14 | Build verification | ✅ Done | `npm run build` passes clean |
| 15 | CSV import classification | ✅ Done | Status dihitung otomatis saat import |

### ⏳ Pending

| # | Feature | Status | Notes |
|---|---|---|---|
| 16 | Vercel deployment | Blocked | Waiting for custom domain setup |
| 17 | Admin user metadata | May need SQL update | `UPDATE auth.users SET raw_user_meta_data = '{"role": "admin"}'::jsonb WHERE email = 'rama@ceria.local';` |

---

## 6. Classification Engine

Located in `src/lib/klasifikasi.ts`. Pure functions, no side effects. Thresholds from WHO/Kemenkes RI.

### IMT (Indeks Massa Tubuh)
| Status | Condition (Asia) |
|---|---|
| Kurus | < 18.5 |
| Normal | 18.5 – 23.0 |
| Overweight | 23.0 – 25.0 |
| Obesitas | ≥ 25.0 |

### Tekanan Darah
| Status | Sistolik | Diastolik |
|---|---|---|
| Normal | < 120 | < 80 |
| Pre-hipertensi | 120–139 | 80–89 |
| Hipertensi | ≥ 140 | ≥ 90 |

### Glukosa Darah Sewaktu
| Status | Level (mg/dL) |
|---|---|
| Normal | < 140 |
| Pre-diabetes | 140–199 |
| Diabetes | ≥ 200 |

### Kolesterol Total
| Status | Level (mg/dL) |
|---|---|
| Normal | < 200 |
| Borderline | 200–239 |
| Tinggi | ≥ 240 |

### Lingkar Pinggang (cm)
| Status | Laki-laki | Perempuan |
|---|---|---|
| Normal | < 90 | < 80 |
| Berisiko | 90–102 | 80–88 |
| Sangat berisiko | > 102 | > 88 |

### Status Keseluruhan
- **SEHAT** — semua indikator normal
- **PERLU PEMANTAUAN** — ada indikator borderline/pre-hipertensi/pre-diabetes
- **PERLU RUJUKAN** — ada indikator kritis (hipertensi/obesitas/lingkar pinggang sangat berisiko)

---

## 7. UI/UX Design System

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `--color-hutan` | #1F4E4A | Primary (header, buttons, accents) |
| `--color-hutan-gelap` | #143733 | Darker accent |
| `--color-daun-muda` | #DCEAE4 | Light background |
| `--color-padi` | #D9A23B | Gold accent (import, save) |
| `--color-kertas` | #F6F7F1 | Page background |
| `--color-tinta` | #292924 | Body text |
| `--color-tinta-lembut` | #62625A | Secondary text |
| `--color-hijau-ok` | #2F7D52 | Status: healthy |
| `--color-kuning-warn` | #C9821D | Status: needs monitoring |
| `--color-merah-risiko` | #B23A2E | Status: needs referral |

### Design Tokens (globals.css)
- `.glass` — simplified glassmorphism (`rgba(255,255,255,0.85)`, no blur for performance)
- `.gradient-text` — hutan-to-padi gradient text
- `.badge-sehat/pemantauan/rujukan` — gradient status badges
- `.header-gradient` — deep gradient for navigation bars
- `.btn-primary` — hutan gradient with soft shadow
- `.btn-gold` — padi gradient for import/save actions
- `.card-hover` — lift on hover with shadow
- `.shadow-soft` / `.shadow-soft-lg` — soft multi-layer shadows

### UI Principles
1. **Large touch targets** — minimum 48x48px tap area
2. **High contrast text** — WCAG AA compliant
3. **Minimal cognitive load** — one task per screen (wizard)
4. **No scroll-triggered animations** — performance-safe
5. **`prefers-reduced-motion`** respected — all animations disabled for accessibility

---

## 8. Pages & Features

### Login (`/login`)
- Email + password authentication via Supabase Auth
- Stores user in localStorage for session
- Shows error messages for invalid credentials

### Dashboard (`/dashboard`)
- 4 action cards: Input, Daftar, Rekap, Import
- Glassmorphism cards with hover lift effect
- Gradient header with user info + logout

### Input (`/input`)
- **Step 1 — Identitas:** NIK, nama, usia, tanggal lahir, jenis kelamin, no HP, alamat
  - Usia otomatis dihitung dari tanggal lahir
  - Peringatan otomatis untuk remaja (< 18 tahun)
- **Step 2 — Pengukuran:** berat badan, tinggi badan, lingkar pinggang, TD sistolik/diastolik, GDS, kolesterol
  - IMT real-time dihitung saat input berat + tinggi
  - Semua field wajib kecuali kolesterol
- **Step 3 — Hasil & Simpan:**
  - Klasifikasi otomatis per indikator
  - Status keseluruhan (SEHAT / PERLU PEMANTAUAN / PERLU RUJUKAN)
  - Badge gradient warna sesuai status
  - Tombol simpan ke Supabase DB

### Daftar Warga (`/daftar`)
- Tabel data warga dengan kolom: NIK, Usia, Jenis Kelamin, BB, TB, Tgl Periksa, Status
- Pencarian by NIK atau tanggal
- Sorting multi-kolom (asc/desc)
- Pagination: 5 / 25 / 50 baris
- Expand row untuk detail lengkap
- Soft delete dengan notifikasi
- **CSV Import Modal:**
  - Pilih tanggal periksa
  - Upload file CSV
  - Preview data dengan error highlighting
  - Validasi per baris
  - Import ke Supabase

### Rekap Desa (`/rekap`)
- **4 Stat Cards:** Total Warga, Sehat, Perlu Pemantauan, Perlu Rujukan (gradient badges)
- **5 Risk Indicators:** Hipertensi, Diabetes, Kolesterol Tinggi, Obesitas, LP Berisiko (progress bars)
- **Age Breakdown:** Remaja (<18), Dewasa (18-59), Lansia (≥60)
- **BMI Distribution:** Kurus, Normal, Overweight, Obesitas
- **Export CSV** button (gradient primary button)

---

## 9. Data Import

### Source Files
| File | Records | Session Date |
|---|---|---|
| `KKN CERIA - 29 Juni.csv` | 50 | 2025-06-29 |
| `KKN CERIA - 30 Juni.csv` | 62 | 2025-06-30 |

### CSV Format
```csv
Nomer, NIK, TTL, L/P, BB, TB, LP, TD, GDS, CL
1, 3309074508810001, 06/22/1980, L, 63, 160, 75, 118/78, 202, 165
```

### Parser Features
- Semicolon (`;`) delimiter support
- TD split into sistolik/diastolik
- `.L` → `L` sanitization for gender
- `-` → `null` for missing cholesterol
- `tanggalPeriksa` parameter for batch import
- Per-row error reporting

### Import Flow
1. User clicks "Impor CSV" on Daftar Warga page
2. Selects tanggal periksa (e.g., 2025-06-29)
3. Uploads CSV file
4. Parser processes each row with validation
5. Classification engine calculates status for each row
6. Preview shows all rows with error indicators
7. User clicks "Impor X Data" to confirm
8. Rows inserted to Supabase DB with classification status in `catatan` field

---

## 10. Remaining Work

### High Priority
1. **Import CSV data** — 112 records across 2 sessions perlu diimpor ke database
2. **Verify admin user** — pastikan admin sudah terdaftar di `admin_users` table

### Medium Priority
3. **Vercel deployment** — requires custom domain setup
4. **Test on low-end Android** — verify performance on target devices

### Low Priority (Post-v1)
5. **Google Sheets sync** — optional read-only integration
6. **Print/export to PDF** — for kader who want paper backup
7. **Offline support** — Service worker for intermittent connectivity

---

## 11. Deployment Plan

### Step 1: Set Up Custom Domain (User)
- Buy or configure domain (e.g., `ceria-kkn.id`)
- Add DNS records to point to Vercel

### Step 2: Deploy to Vercel
```bash
# From project root
vercel --prod
```

### Step 3: Configure Environment Variables
Set in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Verify
- Test login with dummy account
- Test data entry + classification
- Test CSV import
- Test export
- Test on mobile devices

---

## Appendix: Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Database | Supabase over Google Sheets | Better RLS, SQL queries, TypeScript client |
| Auth | Supabase Auth over custom | Built-in, free, secure |
| Styling | Tailwind CSS over CSS Modules | Faster development, consistent tokens |
| Classification | Pure functions over DB triggers | Easier to test, debug, modify |
| UI Enhancement | CSS-only (no framer-motion) | Zero JS overhead, performance on low-end |
| Glassmorphism | `rgba` without `blur` | `backdrop-filter` causes lag on old devices |
| Animations | Only `:hover` transitions | No scroll/intersection observers for perf |

---

*Last updated: July 10, 2025*
*Project location: `D:\KKN CERIA\ceria-app`*
