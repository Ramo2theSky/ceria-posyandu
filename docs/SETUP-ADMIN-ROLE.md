# Setup Role Admin CERIA

Dokumen ini menjelaskan langkah manual di Supabase Dashboard yang **tidak bisa** diotomasi lewat migration SQL saja.

## Latar belakang

Role admin **tidak lagi** dibaca dari `user_metadata` / klaim JWT `role` (bisa diubah user via `supabase.auth.updateUser`). Admin ditentukan oleh tabel `admin_users` dan disuntikkan ke JWT sebagai klaim `user_role` (`admin` | `kader`) lewat Auth Hook.

## 1. Terapkan migration

Jalankan migration `002_admin_users_and_auth_hook.sql` ke database proyek:

**Opsi A — Supabase CLI (disarankan)**

```bash
supabase db push
```

**Opsi B — SQL Editor di Dashboard**

1. Buka **SQL Editor** di [Supabase Dashboard](https://supabase.com/dashboard).
2. Salin isi `supabase/migrations/002_admin_users_and_auth_hook.sql`.
3. Jalankan query.

Pastikan function `public.custom_access_token_hook` dan tabel `public.admin_users` sudah ada sebelum langkah berikutnya.

## 2. Aktifkan Auth Hook "Customize Access Token"

Langkah ini **wajib** — tanpa hook, klaim `user_role` tidak akan muncul di JWT dan policy admin RLS tidak akan pernah lolos.

1. Buka proyek di Supabase Dashboard.
2. Navigasi ke **Authentication** → **Hooks** (atau **Auth Hooks**).
3. Pada hook **Customize Access Token** (Custom Access Token):
   - Aktifkan hook.
   - Pilih tipe **Postgres function**.
   - Pilih function: `public.custom_access_token_hook`.
4. Simpan perubahan.

> **Catatan:** Setelah hook diaktifkan, user yang sudah login perlu **login ulang** atau **refresh session** agar JWT baru memuat klaim `user_role`.

## 3. Daftarkan user admin pertama

Insert ke `admin_users` **hanya** via Dashboard SQL Editor (berjalan sebagai `postgres` / service role) atau backend dengan **service_role key** — jangan pernah expose service key di client.

### Cari UUID user dari email

```sql
SELECT id, email
FROM auth.users
WHERE email = 'admin@contoh.com';
```

### Tambahkan sebagai admin

```sql
INSERT INTO public.admin_users (user_id)
VALUES ('<UUID-dari-query-di-atas>')
ON CONFLICT (user_id) DO NOTHING;
```

### Hapus hak admin

```sql
DELETE FROM public.admin_users
WHERE user_id = '<UUID-user>';
```

## 4. Bersihkan role lama di user_metadata (jika pernah dipakai)

Jika sebelumnya admin ditetapkan lewat `user_metadata.role`, hapus agar tidak membingungkan (klaim ini **tidak lagi** dipakai RLS):

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE raw_user_meta_data ? 'role';
```

Atau via Dashboard: **Authentication** → **Users** → edit user → hapus field `role` di User Metadata.

## 5. Verifikasi

### Cek hook dan function

Di SQL Editor:

```sql
SELECT proname, prosecdef
FROM pg_proc
WHERE proname = 'custom_access_token_hook';
```

### Cek admin terdaftar

```sql
SELECT au.user_id, u.email
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id;
```

### Cek klaim JWT setelah login ulang

1. Login sebagai user admin di aplikasi CERIA.
2. Di browser DevTools → Application → Local Storage (atau decode `access_token` dari session Supabase).
3. Pastikan payload JWT memuat `"user_role": "admin"` (bukan `"role": "admin"` di root/metadata).

User kader biasa harus memuat `"user_role": "kader"`.

### Cek RLS

- Kader: tidak bisa hard-delete; soft-delete hanya record milik sendiri.
- Admin: bisa baca record terhapus, hard-delete, dan soft-delete record siapa pun.

## Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|--------|----------------------|--------|
| Login gagal setelah aktifkan hook | Function error atau grant kurang | Cek **Logs** → **Auth**; pastikan migration 002 sudah lengkap |
| Admin tidak bisa hard-delete | JWT lama / hook belum aktif | Logout, login ulang; pastikan hook terpilih di Dashboard |
| `user_role` tidak ada di JWT | Hook belum diaktifkan | Ulangi langkah 2 |
| Kader masih bisa jadi admin | Masih pakai klaim lama | Pastikan migration 002 sudah apply; jangan set `role` di user_metadata |

## Keamanan

- **Jangan** simpan `service_role` key di frontend atau repo publik.
- **Jangan** buat RLS policy `authenticated` pada tabel `admin_users`.
- Rotasi session: setelah menambah/menghapus admin, minta user terkait login ulang agar JWT diperbarui.
