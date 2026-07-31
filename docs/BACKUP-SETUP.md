# Backup Setup

Endpoint backup tersedia di `GET /api/backup`.

## Environment Variables

Tambahkan nilai berikut ke `.env.local` di environment deployment:

- `BACKUP_SECRET`: secret untuk header `Authorization: Bearer <BACKUP_SECRET>`.
- `SUPABASE_SERVICE_ROLE_KEY`: service role key Supabase untuk membaca seluruh tabel `pemeriksaan`.

Jangan commit `.env.local`. File itu sudah diabaikan lewat `.gitignore`.

## Cara Memakai Endpoint

Contoh request:

```bash
curl -L \
  -H "Authorization: Bearer $BACKUP_SECRET" \
  https://your-domain.com/api/backup \
  -o backup-ceria.csv
```

## Opsi Cron Gratis

### cron-job.org

1. Buat akun di cron-job.org.
2. Tambahkan job baru dengan URL `https://your-domain.com/api/backup`.
3. Set method ke `GET`.
4. Tambahkan header:
   - `Authorization: Bearer <BACKUP_SECRET>`
5. Jadwalkan mingguan, misalnya setiap Senin pagi.

cron-job.org cocok jika Anda hanya perlu memanggil endpoint secara rutin.

### GitHub Actions Scheduled Workflow

1. Simpan `BACKUP_SECRET` sebagai GitHub Actions secret.
2. Buat workflow terjadwal mingguan (`on.schedule`).
3. Jalankan `curl` ke endpoint backup dan upload hasilnya sebagai artifact atau commit ke repo private.

Contoh ringkas workflow:

```yaml
name: Weekly CERIA Backup

on:
  schedule:
    - cron: '0 21 * * 0'
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - name: Download backup CSV
        run: |
          curl -L \
            -H "Authorization: Bearer ${{ secrets.BACKUP_SECRET }}" \
            https://your-domain.com/api/backup \
            -o ceria-backup.csv

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ceria-backup
          path: ceria-backup.csv
```

## Penyimpanan Hasil

Opsi praktis:

1. Upload hasil CSV ke private GitHub repository sebagai artifact atau commit terjadwal.
2. Upload CSV ke Google Drive memakai service account atau automation tool eksternal jika ingin arsip yang lebih mudah dibagikan internal.

## Catatan Keamanan

- Gunakan secret random yang panjang untuk `BACKUP_SECRET`.
- Batasi akses endpoint hanya untuk scheduler yang Anda kontrol.
- Simpan hasil backup di lokasi private.