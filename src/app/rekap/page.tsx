'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hitungUsia } from '@/lib/klasifikasi';
import { supabase } from '@/lib/supabase';

interface Pemeriksaan {
  id: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  no_telepon: string | null;
  alamat: string | null;
  berat_badan: number;
  tinggi_badan: number;
  lingkar_pinggang: number;
  td_sistol: number;
  td_diastol: number;
  gds: number;
  kolesterol_total: number | null;
  tanggal_periksa: string;
  catatan: string;
}

export default function RekapPage() {
  const router = useRouter();
  const [data, setData] = useState<Pemeriksaan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: result, error } = await supabase
          .from('pemeriksaan')
          .select('*')
          .is('dihapus_pada', null);

        if (error) throw error;
        if (!cancelled) setData(result || []);
      } catch {
        console.error('Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => { cancelled = true; };
  }, [router]);

  const totalWarga = data.length;
  const sehat = data.filter(d => d.catatan === 'SEHAT').length;
  const perluPemantauan = data.filter(d => d.catatan === 'PERLU PEMANTAUAN').length;
  const perluRujukan = data.filter(d => d.catatan === 'PERLU RUJUKAN').length;

  const remaja = data.filter(d => hitungUsia(d.tanggal_lahir, new Date()) < 18).length;
  const dewasa = data.filter(d => { const u = hitungUsia(d.tanggal_lahir, new Date()); return u >= 18 && u < 60; }).length;
  const lansia = data.filter(d => hitungUsia(d.tanggal_lahir, new Date()) >= 60).length;

  const hipertensi = data.filter(d => d.td_sistol >= 140 || d.td_diastol >= 90).length;
  const diabetes = data.filter(d => d.gds >= 200).length;
  const kolesterolTinggi = data.filter(d => d.kolesterol_total !== null && d.kolesterol_total >= 240).length;
  const obesitas = data.filter(d => {
    const imt = d.berat_badan / Math.pow(d.tinggi_badan / 100, 2);
    return imt >= 25;
  }).length;
  const lpBerisiko = data.filter(d => {
    const batas = d.jenis_kelamin === 'L' ? 90 : 80;
    return d.lingkar_pinggang >= batas;
  }).length;

  const kurus = data.filter(d => {
    const imt = d.berat_badan / Math.pow(d.tinggi_badan / 100, 2);
    return imt < 18.5;
  }).length;
  const imtNormal = data.filter(d => {
    const imt = d.berat_badan / Math.pow(d.tinggi_badan / 100, 2);
    return imt >= 18.5 && imt < 23.0;
  }).length;
  const overweight = data.filter(d => {
    const imt = d.berat_badan / Math.pow(d.tinggi_badan / 100, 2);
    return imt >= 23.0 && imt < 25.0;
  }).length;

  const handleExportCSV = () => {
    const headers = ['NIK', 'Tanggal Lahir', 'Jenis Kelamin', 'No. Telepon', 'Alamat', 'BB', 'TB', 'LP', 'TD Sistol', 'TD Diastol', 'GDS', 'Kolesterol', 'Tanggal Periksa', 'Status'];
    const rows = data.map(d => [
      `'${d.nik}'`,
      d.tanggal_lahir,
      d.jenis_kelamin,
      d.no_telepon || '-',
      d.alamat || '-',
      d.berat_badan,
      d.tinggi_badan,
      d.lingkar_pinggang,
      d.td_sistol,
      d.td_diastol,
      d.gds,
      d.kolesterol_total || '-',
      d.tanggal_periksa,
      d.catatan || '-',
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-desa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-tinta-lembut)]">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header-gradient text-white p-4 flex justify-between items-center shadow-soft">
        <button onClick={() => router.push('/dashboard')} className="text-sm hover:opacity-80">
          ← Kembali
        </button>
        <h1 className="text-lg font-bold">Rekap Desa</h1>
        <a href="/dashboard"><img src="/ceria-logo.png" alt="CERIA" className="h-6 opacity-80" /></a>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-4 border border-[var(--color-garis)] text-center shadow-soft">
            <p className="text-3xl font-bold text-[var(--color-tinta)]">{totalWarga}</p>
            <p className="text-sm text-[var(--color-tinta-lembut)]">Total Warga</p>
          </div>
          <Link href="/rekap/status/sehat" className="badge-sehat rounded-xl p-4 text-center shadow-soft hover:opacity-80 transition">
            <p className="text-3xl font-bold">{sehat}</p>
            <p className="text-sm">Sehat</p>
          </Link>
          <Link href="/rekap/status/pemantauan" className="badge-pemantauan rounded-xl p-4 text-center shadow-soft hover:opacity-80 transition">
            <p className="text-3xl font-bold">{perluPemantauan}</p>
            <p className="text-sm">Perlu Pemantauan</p>
          </Link>
          <Link href="/rekap/status/rujukan" className="badge-rujukan rounded-xl p-4 text-center shadow-soft hover:opacity-80 transition">
            <p className="text-3xl font-bold">{perluRujukan}</p>
            <p className="text-sm">Perlu Rujukan</p>
          </Link>
        </div>

        <div className="glass rounded-xl p-4 border border-[var(--color-garis)] shadow-soft">
          <h2 className="font-bold text-[var(--color-tinta)] mb-3">Indikator Risiko</h2>
          <div className="space-y-3">
            {[
              { name: 'Hipertensi', count: hipertensi, color: 'bg-[var(--color-merah-risiko)]' },
              { name: 'Diabetes', count: diabetes, color: 'bg-[var(--color-merah-risiko)]' },
              { name: 'Kolesterol Tinggi', count: kolesterolTinggi, color: 'bg-[var(--color-merah-risiko)]' },
              { name: 'Obesitas/Overweight', count: obesitas, color: 'bg-[var(--color-kuning-warn)]' },
              { name: 'LP Berisiko', count: lpBerisiko, color: 'bg-[var(--color-kuning-warn)]' },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-tinta)]">{item.name}</span>
                  <span className="font-bold text-[var(--color-tinta)]">{item.count}</span>
                </div>
                <div className="h-3 bg-[var(--color-kertas-dalam)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: totalWarga > 0 ? `${(item.count / totalWarga) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-[var(--color-garis)] shadow-soft">
          <h2 className="font-bold text-[var(--color-tinta)] mb-3">Berdasarkan Usia</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-[var(--color-tinta)]">{remaja}</p>
              <p className="text-xs text-[var(--color-tinta-lembut)]">Remaja (&lt;18)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-tinta)]">{dewasa}</p>
              <p className="text-xs text-[var(--color-tinta-lembut)]">Dewasa (18-59)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-tinta)]">{lansia}</p>
              <p className="text-xs text-[var(--color-tinta-lembut)]">Lansia (≥60)</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-[var(--color-garis)] shadow-soft">
          <h2 className="font-bold text-[var(--color-tinta)] mb-3">Distribusi IMT</h2>
          <div className="space-y-3">
            {[
              { name: 'Kurus (<18.5)', count: kurus, color: 'bg-[var(--color-kuning-warn)]' },
              { name: 'Normal (18.5-23.0)', count: imtNormal, color: 'bg-[var(--color-hijau-ok)]' },
              { name: 'Overweight (23.0-25.0)', count: overweight, color: 'bg-[var(--color-kuning-warn)]' },
              { name: 'Obesitas (≥25.0)', count: obesitas, color: 'bg-[var(--color-merah-risiko)]' },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--color-tinta)]">{item.name}</span>
                  <span className="font-bold text-[var(--color-tinta)]">{item.count}</span>
                </div>
                <div className="h-3 bg-[var(--color-kertas-dalam)] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: totalWarga > 0 ? `${(item.count / totalWarga) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="w-full btn-primary text-white font-bold py-4 px-6 rounded-xl text-lg"
        >
          📥 Ekspor CSV
        </button>
      </main>
    </div>
  );
}