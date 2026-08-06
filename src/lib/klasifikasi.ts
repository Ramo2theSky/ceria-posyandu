export interface HasilKlasifikasi {
  label: string;
  status: 'ok' | 'warn' | 'risk';
  keterangan: string;
}

export interface HasilKlasifikasiDenganNilai extends HasilKlasifikasi {
  nilai: string;
}

export function klasifikasiIMT(bb: number, tb: number): HasilKlasifikasi {
  const imt = bb / Math.pow(tb / 100, 2);
  if (imt < 18.5) return { label: 'Kurus', status: 'warn', keterangan: 'Perlu peningkatan gizi' };
  if (imt < 23.0) return { label: 'Normal', status: 'ok', keterangan: 'Ideal (cut-off Asia Pasifik)' };
  if (imt < 25.0) return { label: 'Overweight', status: 'warn', keterangan: 'Risiko meningkat' };
  return { label: 'Obesitas', status: 'risk', keterangan: 'Risiko tinggi, konsultasi dokter/ahli gizi' };
}

export function klasifikasiTD(sistol: number, diastol: number): HasilKlasifikasi {
  if (sistol >= 130 || diastol >= 90) return { label: 'Hipertensi', status: 'risk', keterangan: 'Rujuk, kemungkinan terapi obat' };
  return { label: 'Normal', status: 'ok', keterangan: 'Optimal' };
}

export type JenisGulaDarah = 'puasa' | 'sewaktu';

export function klasifikasiGulaDarah(nilai: number, jenis: JenisGulaDarah): HasilKlasifikasi {
  if (jenis === 'puasa') {
    if (nilai >= 126) return { label: 'Diabetes', status: 'risk', keterangan: 'GDP tinggi, rujuk dokter, konfirmasi HbA1c/TTGO' };
    if (nilai >= 110) return { label: 'Pre-diabetes', status: 'warn', keterangan: 'GDP batas atas, perlu pemantauan' };
    return { label: 'Normal', status: 'ok', keterangan: 'GDP normal (puasa)' };
  }
  if (nilai >= 200) return { label: 'Diabetes', status: 'risk', keterangan: 'GDS tinggi, rujuk dokter, konfirmasi HbA1c/TTGO' };
  if (nilai >= 140) return { label: 'Pre-diabetes', status: 'warn', keterangan: 'GDS batas atas, toleransi glukosa terganggu' };
  return { label: 'Normal', status: 'ok', keterangan: 'GDS normal' };
}

export function butuhKlasifikasiGulaDarah(nilai: number): boolean {
  return nilai >= 110 && nilai <= 200;
}

export function klasifikasiGDS(gds: number): HasilKlasifikasi {
  return klasifikasiGulaDarah(gds, 'sewaktu');
}

export function klasifikasiKolesterol(kol: number | null): HasilKlasifikasi | null {
  if (kol === null || kol === undefined) return null;
  if (kol >= 240) return { label: 'Tinggi', status: 'risk', keterangan: 'Risiko tinggi, rujuk dokter' };
  if (kol >= 200) return { label: 'Ambang Batas Tinggi', status: 'warn', keterangan: 'Perlu pemantauan & perubahan gaya hidup' };
  return { label: 'Normal', status: 'ok', keterangan: 'Risiko kardiovaskular rendah' };
}

export function klasifikasiLP(lp: number, jenisKelamin: 'L' | 'P'): HasilKlasifikasi {
  const batas = jenisKelamin === 'L' ? 90 : 80;
  if (lp >= batas) return { label: 'Berisiko', status: 'risk', keterangan: 'Risiko obesitas sentral, konsultasi dokter' };
  return { label: 'Normal', status: 'ok', keterangan: 'Risiko metabolik rendah' };
}

export function statusKeseluruhan(hasilArray: (HasilKlasifikasi | null)[]): string {
  const valid = hasilArray.filter((h): h is HasilKlasifikasi => h !== null);
  if (valid.some(h => h.status === 'risk')) return 'PERLU RUJUKAN';
  if (valid.some(h => h.status === 'warn')) return 'PERLU PEMANTAUAN';
  return 'SEHAT';
}

export function peringatanUsiaRemaja(usia: number): string | null {
  if (usia < 18) return 'Perhatian: untuk usia di bawah 18 tahun, klasifikasi IMT ini menggunakan standar dewasa. Konfirmasi ke tenaga kesehatan untuk penilaian IMT/U (BMI-for-age) yang lebih akurat.';
  return null;
}

export function hitungUsia(tanggalLahir: string, tanggalPeriksa: Date): number {
  const lahir = new Date(tanggalLahir);
  let usia = tanggalPeriksa.getFullYear() - lahir.getFullYear();
  const bulanLahir = lahir.getMonth();
  const tanggalLahir2 = lahir.getDate();
  const bulanPeriksa = tanggalPeriksa.getMonth();
  const tanggalPeriksa2 = tanggalPeriksa.getDate();

  if (bulanPeriksa < bulanLahir || (bulanPeriksa === bulanLahir && tanggalPeriksa2 < tanggalLahir2)) {
    usia--;
  }
  return usia;
}