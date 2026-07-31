import { describe, it, expect } from 'vitest';
import {
  validasiNIK,
  validasiJenisKelamin,
  validasiBeratBadan,
  validasiTinggiBadan,
  validasiGDS,
  validasiTD,
  validasiTanggalLahir,
  sanitasiJenisKelamin,
  formatTanggalDDMMYYYY,
} from '../validasi';

describe('validasiNIK', () => {
  it('return error jika NIK kosong', () => {
    expect(validasiNIK('')).toEqual({ field: 'nik', message: 'NIK wajib diisi' });
  });

  it('return error jika NIK whitespace only', () => {
    expect(validasiNIK('   ')).toEqual({ field: 'nik', message: 'NIK wajib diisi' });
  });

  it('return error jika NIK kurang dari 16 digit', () => {
    expect(validasiNIK('1234567890')).toEqual({ field: 'nik', message: 'NIK harus 16 angka' });
  });

  it('return error jika NIK lebih dari 16 digit', () => {
    expect(validasiNIK('12345678901234567')).toEqual({ field: 'nik', message: 'NIK harus 16 angka' });
  });

  it('return error jika NIK mengandung huruf', () => {
    expect(validasiNIK('123456789012345a')).toEqual({ field: 'nik', message: 'NIK hanya boleh berisi angka' });
  });

  it('return null jika NIK valid 16 angka', () => {
    expect(validasiNIK('3309123456780001')).toBeNull();
  });
});

describe('validasiJenisKelamin', () => {
  it('return error jika input kosong', () => {
    expect(validasiJenisKelamin('')).toEqual({ field: 'jenisKelamin', message: 'Pilih Laki-laki atau Perempuan' });
  });

  it('return error jika input bukan L atau P', () => {
    expect(validasiJenisKelamin('X')).toEqual({ field: 'jenisKelamin', message: 'Pilih Laki-laki atau Perempuan' });
  });

  it('return null untuk L', () => {
    expect(validasiJenisKelamin('L')).toBeNull();
  });

  it('return null untuk P', () => {
    expect(validasiJenisKelamin('P')).toBeNull();
  });

  it('return error untuk l (lowercase tidak diterima)', () => {
    expect(validasiJenisKelamin('l')).toEqual({ field: 'jenisKelamin', message: 'Pilih Laki-laki atau Perempuan' });
  });

  it('return error untuk p (lowercase tidak diterima)', () => {
    expect(validasiJenisKelamin('p')).toEqual({ field: 'jenisKelamin', message: 'Pilih Laki-laki atau Perempuan' });
  });
});

describe('validasiBeratBadan', () => {
  it('return error jika bb < 10', () => {
    expect(validasiBeratBadan(5)).toEqual({ field: 'beratBadan', message: 'Berat badan tidak wajar (10-300 kg)' });
  });

  it('return error jika bb > 300', () => {
    expect(validasiBeratBadan(350)).toEqual({ field: 'beratBadan', message: 'Berat badan tidak wajar (10-300 kg)' });
  });

  it('return null untuk bb valid', () => {
    expect(validasiBeratBadan(65)).toBeNull();
  });

  it('return null untuk batas bawah', () => {
    expect(validasiBeratBadan(10)).toBeNull();
  });

  it('return null untuk batas atas', () => {
    expect(validasiBeratBadan(300)).toBeNull();
  });
});

describe('validasiTinggiBadan', () => {
  it('return error jika tb < 50', () => {
    expect(validasiTinggiBadan(40)).toEqual({ field: 'tinggiBadan', message: 'Tinggi badan tidak wajar (50-250 cm)' });
  });

  it('return error jika tb > 250', () => {
    expect(validasiTinggiBadan(260)).toEqual({ field: 'tinggiBadan', message: 'Tinggi badan tidak wajar (50-250 cm)' });
  });

  it('return null untuk tb valid', () => {
    expect(validasiTinggiBadan(165)).toBeNull();
  });
});

describe('validasiGDS', () => {
  it('return error jika gds < 40', () => {
    expect(validasiGDS(30)).toEqual({ field: 'gds', message: 'GDS tidak wajar (40-600 mg/dL)' });
  });

  it('return error jika gds > 600', () => {
    expect(validasiGDS(700)).toEqual({ field: 'gds', message: 'GDS tidak wajar (40-600 mg/dL)' });
  });

  it('return null untuk gds valid', () => {
    expect(validasiGDS(100)).toBeNull();
  });
});

describe('validasiTD', () => {
  it('return error jika sistol <= 0', () => {
    expect(validasiTD(0, 80)).toEqual({ field: 'tdSistol', message: 'Tekanan darah sistolik wajib diisi' });
  });

  it('return error jika diastol <= 0', () => {
    expect(validasiTD(120, 0)).toEqual({ field: 'tdDiastol', message: 'Tekanan darah diastolik wajib diisi' });
  });

  it('return error jika sistol < 60', () => {
    expect(validasiTD(50, 80)).toEqual({ field: 'tdSistol', message: 'Tekanan darah sistolik tidak wajar' });
  });

  it('return error jika sistol > 300', () => {
    expect(validasiTD(310, 80)).toEqual({ field: 'tdSistol', message: 'Tekanan darah sistolik tidak wajar' });
  });

  it('return error jika diastol < 30', () => {
    expect(validasiTD(120, 20)).toEqual({ field: 'tdDiastol', message: 'Tekanan darah diastolik tidak wajar' });
  });

  it('return error jika diastol > 200', () => {
    expect(validasiTD(120, 210)).toEqual({ field: 'tdDiastol', message: 'Tekanan darah diastolik tidak wajar' });
  });

  it('return null untuk TD valid', () => {
    expect(validasiTD(120, 80)).toBeNull();
  });
});

describe('validasiTanggalLahir', () => {
  it('return error jika kosong', () => {
    expect(validasiTanggalLahir('')).toEqual({ field: 'tanggalLahir', message: 'Tanggal lahir wajib diisi' });
  });

  it('return error jika tahun < 1900', () => {
    expect(validasiTanggalLahir('1899-01-01')).toEqual({ field: 'tanggalLahir', message: expect.stringContaining('Tahun lahir tidak valid') });
  });

  it('return error jika tahun > tahun sekarang', () => {
    const nextYear = new Date().getFullYear() + 1;
    expect(validasiTanggalLahir(`${nextYear}-01-01`)).toEqual({ field: 'tanggalLahir', message: expect.stringContaining('Tahun lahir tidak valid') });
  });

  it('return null untuk tanggal valid', () => {
    expect(validasiTanggalLahir('1990-05-15')).toBeNull();
  });
});

describe('sanitasiJenisKelamin', () => {
  it('return L dari "Laki-laki"', () => {
    expect(sanitasiJenisKelamin('Laki-laki')).toBe('L');
  });

  it('return P dari "Perempuan"', () => {
    expect(sanitasiJenisKelamin('Perempuan')).toBe('P');
  });

  it('strip non-LP chars, lowercase l menjadi kosong', () => {
    expect(sanitasiJenisKelamin('l')).toBe('');
  });

  it('strip non-LP chars, lowercase p menjadi kosong', () => {
    expect(sanitasiJenisKelamin('p')).toBe('');
  });
});

describe('formatTanggalDDMMYYYY', () => {
  it('return null untuk string kosong', () => {
    expect(formatTanggalDDMMYYYY('')).toBeNull();
  });

  it('parse format YYYY-MM-DD', () => {
    const result = formatTanggalDDMMYYYY('1990-05-15');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(1990);
    expect(result?.getMonth()).toBe(4);
    expect(result?.getDate()).toBe(15);
  });

  it('parse format DD/MM/YYYY', () => {
    const result = formatTanggalDDMMYYYY('15/05/1990');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(1990);
  });

  it('parse format DD-MM-YYYY', () => {
    const result = formatTanggalDDMMYYYY('15-05-1990');
    expect(result).toBeInstanceOf(Date);
    expect(result?.getFullYear()).toBe(1990);
  });

  it('return null untuk format invalid', () => {
    expect(formatTanggalDDMMYYYY('abc')).toBeNull();
  });

  it('return null untuk tanggal tidak valid (31 Feb)', () => {
    expect(formatTanggalDDMMYYYY('31/02/1990')).toBeNull();
  });

  it('return null untuk format tanpa separator', () => {
    expect(formatTanggalDDMMYYYY('19900515')).toBeNull();
  });
});
