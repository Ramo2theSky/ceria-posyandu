export interface ValidasiError {
  field: string;
  message: string;
}

export function validasiNIK(nik: string): ValidasiError | null {
  if (!nik || nik.trim().length === 0) return { field: 'nik', message: 'NIK wajib diisi' };
  if (nik.length !== 16) return { field: 'nik', message: 'NIK harus 16 angka' };
  if (!/^\d+$/.test(nik)) return { field: 'nik', message: 'NIK hanya boleh berisi angka' };
  return null;
}

export function validasiJenisKelamin(jk: string): ValidasiError | null {
  const clean = jk.replace(/[^LP]/g, '').trim().toUpperCase();
  if (clean !== 'L' && clean !== 'P') return { field: 'jenisKelamin', message: 'Pilih Laki-laki atau Perempuan' };
  return null;
}

export function validasiBeratBadan(bb: number): ValidasiError | null {
  if (bb < 10 || bb > 300) return { field: 'beratBadan', message: 'Berat badan tidak wajar (10-300 kg)' };
  return null;
}

export function validasiTinggiBadan(tb: number): ValidasiError | null {
  if (tb < 50 || tb > 250) return { field: 'tinggiBadan', message: 'Tinggi badan tidak wajar (50-250 cm)' };
  return null;
}

export function validasiGDS(gds: number): ValidasiError | null {
  if (gds < 40 || gds > 600) return { field: 'gds', message: 'GDS tidak wajar (40-600 mg/dL)' };
  return null;
}

export function validasiTanggalLahir(tanggal: string): ValidasiError | null {
  if (!tanggal) return { field: 'tanggalLahir', message: 'Tanggal lahir wajib diisi' };
  const tgl = new Date(tanggal);
  const now = new Date();
  const year = tgl.getFullYear();
  if (year < 1900 || year > now.getFullYear()) {
    return { field: 'tanggalLahir', message: 'Tahun lahir tidak valid (1900-' + now.getFullYear() + ')' };
  }
  return null;
}

export function validasiTD(sistol: number, diastol: number): ValidasiError | null {
  if (sistol <= 0) return { field: 'tdSistol', message: 'Tekanan darah sistolik wajib diisi' };
  if (diastol <= 0) return { field: 'tdDiastol', message: 'Tekanan darah diastolik wajib diisi' };
  if (sistol < 60 || sistol > 300) return { field: 'tdSistol', message: 'Tekanan darah sistolik tidak wajar' };
  if (diastol < 30 || diastol > 200) return { field: 'tdDiastol', message: 'Tekanan darah diastolik tidak wajar' };
  return null;
}

export function sanitasiJenisKelamin(jk: string): 'L' | 'P' {
  const clean = jk.replace(/[^LP]/g, '').trim().toUpperCase();
  return clean as 'L' | 'P';
}

export function formatTanggalDDMMYYYY(tanggal: string): Date | null {
  const clean = tanggal.trim();

  if (!clean) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [year, month, day] = clean.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day ? parsed : null;
  }

  const separator = clean.includes('/') ? '/' : clean.includes('-') ? '-' : clean.includes('.') ? '.' : null;
  if (!separator) return null;

  const parts = clean.split(separator).map((part) => part.trim());
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;

  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day ? parsed : null;
}