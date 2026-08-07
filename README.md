# CERIA - Cek kEsehatan Remaja dan lansIA

Sistem pencatatan dan skrining kesehatan digital untuk **Puskesmas Karanganom**, Desa Jurangjero.

## Tentang CERIA

CERIA membantu kader posyandu dan tenaga kesehatan melakukan pencatatan pemeriksaan kesehatan warga secara digital. Menggantikan formulir kertas dengan aplikasi web yang gratis, mudah digunakan, dan dapat diakses dari HP.

**Target pengguna:** Kader posyandu dan tenaga kesehatan non-IT (usia 40-65 tahun).

## Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| **Input Data Warga** | Wizard 3 langkah: identitas, pengukuran, hasil & simpan |
| **Daftar Warga** | Cari, lihat detail, riwayat pemeriksaan, hapus data |
| **Rekap Puskesmas** | Grafik distribusi usia, status kesehatan, tren bulanan |
| **Impor CSV** | Input data massal dari file Excel/CSV |
| **Recycle Bin** | Pulihkan data yang terhapus |
| **Multi-Posyandu** | 5 posyandu terpisah, data terisolir per posyandu |

## Akses

| Role | Akses |
|------|-------|
| **Super Admin (Ketua Posyandu)** | Lihat semua data, input/edit/hapus semua posyandu, manajemen user |
| **Kader Mawar (1-5)** | Lihat semua data, input/edit/hapus **hanya posyandu sendiri** |

## Login

- **URL:** [https://ceria-puskesmas.vercel.app](https://ceria-puskesmas.vercel.app)
- **Akun:** Diberikan oleh ketua posyandu

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, TypeScript
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting:** Vercel (gratis)
- **Budget:** Rp 0

## Dokumentasi

| Dokumentasi | Untuk Siapa |
|-------------|-------------|
| [Panduan Ketua Posyandu](docs/PANDUAN-KETUA-POSYANDU.md) | Super Admin |
| [Panduan Kader Mawar](docs/PANDUAN-KADER-MAWAR.md) | Kader Posyandu |
| [Deployment Guide](docs/DEPLOYMENT-GUIDE.md) | Developer/Admin |

## Tim

KKN PPM UGM SWARYA KARANGANOM 2026
