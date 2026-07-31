import { describe, it, expect } from 'vitest';
import {
  klasifikasiIMT,
  klasifikasiTD,
  klasifikasiGDS,
  klasifikasiKolesterol,
  klasifikasiLP,
  statusKeseluruhan,
  peringatanUsiaRemaja,
  hitungUsia,
} from '../klasifikasi';

describe('klasifikasiIMT', () => {
  it('Kurus jika IMT < 18.5', () => {
    const result = klasifikasiIMT(45, 160);
    expect(result.label).toBe('Kurus');
    expect(result.status).toBe('warn');
  });

  it('Normal jika IMT 18.5-23.0', () => {
    const result = klasifikasiIMT(60, 165);
    expect(result.label).toBe('Normal');
    expect(result.status).toBe('ok');
  });

  it('Overweight jika IMT 23.0-25.0', () => {
    const result = klasifikasiIMT(66, 165);
    expect(result.label).toBe('Overweight');
    expect(result.status).toBe('warn');
  });

  it('Obesitas jika IMT >= 25.0', () => {
    const result = klasifikasiIMT(80, 160);
    expect(result.label).toBe('Obesitas');
    expect(result.status).toBe('risk');
  });
});

describe('klasifikasiTD', () => {
  it('Normal jika sistol < 120 dan diastol < 80', () => {
    const result = klasifikasiTD(110, 70);
    expect(result.label).toBe('Normal');
    expect(result.status).toBe('ok');
  });

  it('Elevasi jika sistol >= 120', () => {
    const result = klasifikasiTD(125, 75);
    expect(result.label).toBe('Elevasi');
    expect(result.status).toBe('warn');
  });

  it('Hipertensi Tk.1 jika sistol >= 130 atau diastol >= 80', () => {
    const result = klasifikasiTD(135, 85);
    expect(result.label).toBe('Hipertensi Tk.1');
    expect(result.status).toBe('warn');
  });

  it('Hipertensi Tk.2 jika sistol >= 140 atau diastol >= 90', () => {
    const result = klasifikasiTD(150, 95);
    expect(result.label).toBe('Hipertensi Tk.2');
    expect(result.status).toBe('risk');
  });
});

describe('klasifikasiGDS', () => {
  it('Normal jika GDS < 140', () => {
    const result = klasifikasiGDS(100);
    expect(result.label).toBe('Normal');
    expect(result.status).toBe('ok');
  });

  it('Pra-diabetes jika GDS 140-199', () => {
    const result = klasifikasiGDS(160);
    expect(result.label).toBe('Pra-diabetes');
    expect(result.status).toBe('warn');
  });

  it('Diabetes Melitus jika GDS >= 200', () => {
    const result = klasifikasiGDS(220);
    expect(result.label).toBe('Diabetes Melitus');
    expect(result.status).toBe('risk');
  });
});

describe('klasifikasiKolesterol', () => {
  it('return null jika null', () => {
    expect(klasifikasiKolesterol(null)).toBeNull();
  });

  it('Normal jika < 200', () => {
    const result = klasifikasiKolesterol(180);
    expect(result?.label).toBe('Normal');
    expect(result?.status).toBe('ok');
  });

  it('Ambang Batas Tinggi jika 200-239', () => {
    const result = klasifikasiKolesterol(220);
    expect(result?.label).toBe('Ambang Batas Tinggi');
    expect(result?.status).toBe('warn');
  });

  it('Tinggi jika >= 240', () => {
    const result = klasifikasiKolesterol(260);
    expect(result?.label).toBe('Tinggi');
    expect(result?.status).toBe('risk');
  });
});

describe('klasifikasiLP', () => {
  it('Normal untuk LP laki-laki < 90', () => {
    const result = klasifikasiLP(85, 'L');
    expect(result.label).toBe('Normal');
    expect(result.status).toBe('ok');
  });

  it('Berisiko untuk LP laki-laki >= 90', () => {
    const result = klasifikasiLP(95, 'L');
    expect(result.label).toBe('Berisiko');
    expect(result.status).toBe('risk');
  });

  it('Normal untuk LP perempuan < 80', () => {
    const result = klasifikasiLP(75, 'P');
    expect(result.label).toBe('Normal');
    expect(result.status).toBe('ok');
  });

  it('Berisiko untuk LP perempuan >= 80', () => {
    const result = klasifikasiLP(85, 'P');
    expect(result.label).toBe('Berisiko');
    expect(result.status).toBe('risk');
  });
});

describe('statusKeseluruhan', () => {
  it('SEHAT jika semua status ok', () => {
    const results = [
      { label: 'Normal', status: 'ok' as const, keterangan: '' },
      { label: 'Normal', status: 'ok' as const, keterangan: '' },
    ];
    expect(statusKeseluruhan(results)).toBe('SEHAT');
  });

  it('PERLU PEMANTAUAN jika ada status warn', () => {
    const results = [
      { label: 'Normal', status: 'ok' as const, keterangan: '' },
      { label: 'Elevasi', status: 'warn' as const, keterangan: '' },
    ];
    expect(statusKeseluruhan(results)).toBe('PERLU PEMANTAUAN');
  });

  it('PERLU RUJUKAN jika ada status risk', () => {
    const results = [
      { label: 'Normal', status: 'ok' as const, keterangan: '' },
      { label: 'Hipertensi', status: 'risk' as const, keterangan: '' },
    ];
    expect(statusKeseluruhan(results)).toBe('PERLU RUJUKAN');
  });

  it('ignore null values', () => {
    const results = [
      null,
      { label: 'Normal', status: 'ok' as const, keterangan: '' },
    ];
    expect(statusKeseluruhan(results)).toBe('SEHAT');
  });

  it('SEHAT jika semua null', () => {
    expect(statusKeseluruhan([null, null])).toBe('SEHAT');
  });
});

describe('peringatanUsiaRemaja', () => {
  it('return warning jika usia < 18', () => {
    const result = peringatanUsiaRemaja(15);
    expect(result).toContain('usia di bawah 18');
  });

  it('return null jika usia >= 18', () => {
    expect(peringatanUsiaRemaja(18)).toBeNull();
  });

  it('return null jika usia 60', () => {
    expect(peringatanUsiaRemaja(60)).toBeNull();
  });
});

describe('hitungUsia', () => {
  it('hitung usia dengan benar (belum ultah di tahun ini)', () => {
    const lahir = '2000-06-15';
    const periksa = new Date('2026-03-01');
    expect(hitungUsia(lahir, periksa)).toBe(25);
  });

  it('hitung usia dengan benar (sudah ultah di tahun ini)', () => {
    const lahir = '2000-03-01';
    const periksa = new Date('2026-06-15');
    expect(hitungUsia(lahir, periksa)).toBe(26);
  });

  it('usia 0 jika baru lahir', () => {
    const lahir = '2026-07-01';
    const periksa = new Date('2026-07-31');
    expect(hitungUsia(lahir, periksa)).toBe(0);
  });

  it('usia tepat di ulang tahun', () => {
    const lahir = '2000-07-31';
    const periksa = new Date('2026-07-31');
    expect(hitungUsia(lahir, periksa)).toBe(26);
  });
});
