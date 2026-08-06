import { sanitasiJenisKelamin, formatTanggalDDMMYYYY } from './validasi';

export interface BarisCSV {
  Nomer?: string;
  NIK?: string;
  Nama?: string;
  TTL?: string;
  'L/P'?: string;
  BB?: string;
  TB?: string;
  LP?: string;
  TD?: string;
  GDS?: string;
  CL?: string;
}

export interface DataParsed {
  nik: string;
  nama_lengkap: string | null;
  tanggal_lahir: Date;
  jenis_kelamin: 'L' | 'P';
  berat_badan: number;
  tinggi_badan: number;
  lingkar_pinggang: number;
  td_sistol: number;
  td_diastol: number | null;
  gds: number;
  kolesterol_total: number | null;
  tanggal_periksa?: string;
}

export function parseBarisCSV(baris: BarisCSV, tanggalPeriksa?: string): { data: DataParsed | null; error: string | null } {
  if (!baris.NIK || !baris.TTL || !baris['L/P']) {
    return { data: null, error: 'Baris kosong atau tidak lengkap' };
  }

  const nik = baris.NIK.toString().replace(/^'/, '').trim();
  if (nik.length !== 16 || !/^\d+$/.test(nik)) {
    return { data: null, error: `NIK ${nik} tidak valid (harus 16 angka)` };
  }

  const tanggalLahir = formatTanggalDDMMYYYY(baris.TTL);
  if (!tanggalLahir) {
    return { data: null, error: `Format tanggal lahir ${baris.TTL} tidak valid` };
  }

  const year = tanggalLahir.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return { data: null, error: `Tahun lahir ${year} tidak valid (1900-${currentYear})` };
  }

  const jenisKelamin = sanitasiJenisKelamin(baris['L/P']);
  if (!jenisKelamin || (jenisKelamin !== 'L' && jenisKelamin !== 'P')) {
    return { data: null, error: `Jenis kelamin ${baris['L/P']} tidak valid` };
  }

  const bb = parseFloat(baris.BB || '0');
  const tb = parseFloat(baris.TB || '0');
  const lp = parseFloat(baris.LP || '0');
  const gds = parseInt(baris.GDS || '0');

  if (isNaN(bb) || bb < 10 || bb > 300) return { data: null, error: `BB ${baris.BB} tidak wajar` };
  if (isNaN(tb) || tb < 50 || tb > 250) return { data: null, error: `TB ${baris.TB} tidak wajar` };
  if (isNaN(lp) || lp < 30 || lp > 200) return { data: null, error: `LP ${baris.LP} tidak wajar` };
  if (isNaN(gds) || gds < 40 || gds > 600) return { data: null, error: `GDS ${baris.GDS} tidak wajar` };

  const tdParts = (baris.TD || '').split('/');
  const tdSistol = parseInt(tdParts[0] || '0');
  const tdDiastol = tdParts[1] ? parseInt(tdParts[1]) : null;

  if (tdSistol < 60 || tdSistol > 300) return { data: null, error: `TD sistolik ${tdSistol} tidak wajar` };
  if (tdDiastol !== null && (tdDiastol < 30 || tdDiastol > 200)) {
    return { data: null, error: `TD diastolik ${tdDiastol} tidak wajar` };
  }

  const kolesterol = baris.CL === '-' || !baris.CL ? null : parseInt(baris.CL);

  return {
    data: {
      nik,
      nama_lengkap: baris.Nama?.toUpperCase() || null,
      tanggal_lahir: tanggalLahir,
      jenis_kelamin: jenisKelamin,
      berat_badan: bb,
      tinggi_badan: tb,
      lingkar_pinggang: lp,
      td_sistol: tdSistol,
      td_diastol: tdDiastol,
      gds,
      kolesterol_total: kolesterol,
      tanggal_periksa: tanggalPeriksa,
    },
    error: null,
  };
}