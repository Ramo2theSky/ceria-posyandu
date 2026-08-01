import { supabase } from './supabase';
import { hitungUsia } from './klasifikasi';

export interface RiwayatPemeriksaan {
  id: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  berat_badan: number;
  tinggi_badan: number;
  lingkar_pinggang: number;
  td_sistol: number;
  td_diastol: number;
  gds: number;
  kolesterol_total: number | null;
  tanggal_periksa: string;
  catatan: string;
  imt: number;
}

export interface CekNIKResult {
  sudahAda: boolean;
  jumlahPemeriksaan: number;
  terakhirPeriksa: string | null;
  dataTerakhir: RiwayatPemeriksaan | null;
  riwayat: RiwayatPemeriksaan[];
}

export async function cekNIK(nik: string): Promise<CekNIKResult> {
  const empty: CekNIKResult = {
    sudahAda: false,
    jumlahPemeriksaan: 0,
    terakhirPeriksa: null,
    dataTerakhir: null,
    riwayat: [],
  };

  if (!nik || nik.length !== 16) return empty;

  const { data, error } = await supabase
    .from('pemeriksaan')
    .select('*')
    .eq('nik', nik)
    .is('dihapus_pada', null)
    .order('tanggal_periksa', { ascending: false });

  if (error || !data || data.length === 0) return empty;

  const riwayat: RiwayatPemeriksaan[] = data.map((d) => ({
    ...d,
    imt: Number((d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1)),
  }));

  return {
    sudahAda: true,
    jumlahPemeriksaan: data.length,
    terakhirPeriksa: data[0].tanggal_periksa,
    dataTerakhir: riwayat[0],
    riwayat,
  };
}

export function getUsiaLabel(tanggalLahir: string, tanggalPeriksa: string): string {
  const usia = hitungUsia(tanggalLahir, new Date(tanggalPeriksa));
  if (usia < 18) return `${usia} th (Remaja)`;
  if (usia < 60) return `${usia} th (Dewasa)`;
  return `${usia} th (Lansia)`;
}

export function getStatusColor(status: string): string {
  if (status === 'SEHAT') return 'var(--color-hijau-ok)';
  if (status === 'PERLU PEMANTAUAN') return 'var(--color-kuning-warn)';
  return 'var(--color-merah-risiko)';
}

export function getStatusBg(status: string): string {
  if (status === 'SEHAT') return 'bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)]';
  if (status === 'PERLU PEMANTAUAN') return 'bg-[var(--color-kuning-warn-bg)] text-[var(--color-kuning-warn)]';
  return 'bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)]';
}
