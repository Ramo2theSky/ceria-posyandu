import { describe, it, expect } from 'vitest';
import { parseBarisCSV, BarisCSV } from '../csv-parser';

function makeBaris(overrides: Partial<BarisCSV> = {}): BarisCSV {
  return {
    Nomer: '1',
    NIK: '3309123456780001',
    TTL: '15/05/1990',
    'L/P': 'L',
    BB: '65',
    TB: '165',
    LP: '80',
    TD: '120/80',
    GDS: '100',
    CL: '180',
    ...overrides,
  };
}

describe('parseBarisCSV', () => {
  it('berhasil parse baris valid', () => {
    const result = parseBarisCSV(makeBaris());
    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data?.nik).toBe('3309123456780001');
    expect(result.data?.jenis_kelamin).toBe('L');
    expect(result.data?.berat_badan).toBe(65);
    expect(result.data?.tinggi_badan).toBe(165);
    expect(result.data?.lingkar_pinggang).toBe(80);
    expect(result.data?.td_sistol).toBe(120);
    expect(result.data?.td_diastol).toBe(80);
    expect(result.data?.gds).toBe(100);
    expect(result.data?.kolesterol_total).toBe(180);
  });

  it('return error jika NIK kosong', () => {
    const result = parseBarisCSV(makeBaris({ NIK: '' }));
    expect(result.error).toContain('tidak lengkap');
  });

  it('return error jika TTL kosong', () => {
    const result = parseBarisCSV(makeBaris({ TTL: '' }));
    expect(result.error).toContain('tidak lengkap');
  });

  it('return error jika L/P kosong', () => {
    const result = parseBarisCSV(makeBaris({ 'L/P': '' }));
    expect(result.error).toContain('tidak lengkap');
  });

  it('return error jika NIK bukan 16 angka', () => {
    const result = parseBarisCSV(makeBaris({ NIK: '12345' }));
    expect(result.error).toContain('tidak valid');
  });

  it('strip leading single quote dari NIK', () => {
    const result = parseBarisCSV(makeBaris({ NIK: "'3309123456780001" }));
    expect(result.error).toBeNull();
    expect(result.data?.nik).toBe('3309123456780001');
  });

  it('return error jika tahun lahir terlalu tua', () => {
    const result = parseBarisCSV(makeBaris({ TTL: '01/01/1800' }));
    expect(result.error).toContain('tidak valid');
  });

  it('return error jika BB tidak wajar', () => {
    const result = parseBarisCSV(makeBaris({ BB: '5' }));
    expect(result.error).toContain('tidak wajar');
  });

  it('return error jika TB tidak wajar', () => {
    const result = parseBarisCSV(makeBaris({ TB: '300' }));
    expect(result.error).toContain('tidak wajar');
  });

  it('return error jika LP tidak wajar', () => {
    const result = parseBarisCSV(makeBaris({ LP: '250' }));
    expect(result.error).toContain('tidak wajar');
  });

  it('return error jika GDS tidak wajar', () => {
    const result = parseBarisCSV(makeBaris({ GDS: '10' }));
    expect(result.error).toContain('tidak wajar');
  });

  it('return error jika TD sistolik tidak wajar', () => {
    const result = parseBarisCSV(makeBaris({ TD: '350/80' }));
    expect(result.error).toContain('tidak wajar');
  });

  it('return error jika TD diastolik tidak wajar', () => {
    const result = parseBarisCSV(makeBaris({ TD: '120/250' }));
    expect(result.error).toContain('tidak wajar');
  });

  it('kolesterol null jika CL = "-"', () => {
    const result = parseBarisCSV(makeBaris({ CL: '-' }));
    expect(result.data?.kolesterol_total).toBeNull();
  });

  it('kolesterol null jika CL kosong', () => {
    const result = parseBarisCSV(makeBaris({ CL: '' }));
    expect(result.data?.kolesterol_total).toBeNull();
  });

  it('parse TD tanpa diastol', () => {
    const result = parseBarisCSV(makeBaris({ TD: '120' }));
    expect(result.data?.td_sistol).toBe(120);
    expect(result.data?.td_diastol).toBeNull();
  });

  it('set tanggal_periksa jika diberikan', () => {
    const result = parseBarisCSV(makeBaris(), '2026-07-31');
    expect(result.data?.tanggal_periksa).toBe('2026-07-31');
  });
});
