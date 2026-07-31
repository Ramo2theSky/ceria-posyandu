'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { hitungUsia, klasifikasiIMT, klasifikasiTD, klasifikasiGDS, klasifikasiKolesterol, klasifikasiLP } from '@/lib/klasifikasi';
import { maskNIK } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';

interface Pemeriksaan {
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
  dibuat_pada: string;
}

const STATUS_MAP: Record<string, string> = {
  'sehat': 'SEHAT',
  'pemantauan': 'PERLU PEMANTAUAN',
  'rujukan': 'PERLU RUJUKAN',
};

const STATUS_COLORS: Record<string, string> = {
  'sehat': 'badge-sehat',
  'pemantauan': 'badge-pemantauan',
  'rujukan': 'badge-rujukan',
};

export default function RekapStatusPage() {
  const router = useRouter();
  const params = useParams();
  const statusKey = params.status as string;
  const statusLabel = STATUS_MAP[statusKey] || statusKey;
  const badgeColor = STATUS_COLORS[statusKey] || 'badge-sehat';

  const [data, setData] = useState<Pemeriksaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: result, error } = await supabase
          .from('pemeriksaan')
          .select('*')
          .is('dihapus_pada', null)
          .eq('catatan', statusLabel)
          .order('tanggal_periksa', { ascending: false });

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
  }, [statusLabel]);

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
        <button onClick={() => router.push('/rekap')} className="text-sm hover:opacity-80">
          ← Kembali
        </button>
        <h1 className="text-lg font-bold">{statusLabel}</h1>
        <a href="/dashboard"><img src="/ceria-logo.png" alt="CERIA" className="h-6 opacity-80" /></a>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <div className={`${badgeColor} rounded-xl p-4 text-center shadow-soft`}>
          <p className="text-3xl font-bold">{data.length}</p>
          <p className="text-sm">Warga dengan status {statusLabel}</p>
        </div>

        {data.length === 0 ? (
          <div className="glass rounded-xl p-6 border border-[var(--color-garis)] text-center">
            <p className="text-[var(--color-tinta-lembut)]">Tidak ada warga dengan status ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((d) => {
              const usia = hitungUsia(d.tanggal_lahir, new Date());
              const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
              const td = klasifikasiTD(d.td_sistol, d.td_diastol);
              const gds = klasifikasiGDS(d.gds);
              const kol = klasifikasiKolesterol(d.kolesterol_total);
              const lp = klasifikasiLP(d.lingkar_pinggang, d.jenis_kelamin);
              const isExpanded = expandedId === d.id;

              const badgeClass = (s: string) => s === 'ok' ? 'badge-sehat' : s === 'warn' ? 'badge-pemantauan' : 'badge-rujukan';
              const textClass = (s: string) => s === 'ok' ? 'text-[var(--color-hijau-ok)]' : s === 'warn' ? 'text-[var(--color-kuning-warn)]' : 'text-[var(--color-merah-risiko)]';

              return (
                <div key={d.id} className="glass rounded-xl border border-[var(--color-garis)] shadow-soft overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : d.id)}
                    className="w-full p-4 text-left flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-[var(--color-tinta)]">{maskNIK(d.nik)}</p>
                      <p className="text-xs text-[var(--color-tinta-lembut)]">
                        {usia} tahun · {d.jenis_kelamin} · {d.tanggal_periksa}
                      </p>
                    </div>
                    <span className="text-[var(--color-tinta-lembut)]">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-[var(--color-garis)]">
                      <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-tinta-lembut)]">BB</span>
                          <span className="font-bold">{d.berat_badan} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-tinta-lembut)]">TB</span>
                          <span className="font-bold">{d.tinggi_badan} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-tinta-lembut)]">LP</span>
                          <span className="font-bold">{d.lingkar_pinggang} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-tinta-lembut)]">IMT</span>
                          <span className="font-bold">{(d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`${badgeClass(imt.status)} px-2 py-0.5 rounded font-bold`}>IMT</span>
                          <span className={textClass(imt.status)}>{imt.label}</span>
                          {imt.keterangan && <span className="text-[var(--color-tinta-lembut)]">— {imt.keterangan}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`${badgeClass(td.status)} px-2 py-0.5 rounded font-bold`}>TD</span>
                          <span className={textClass(td.status)}>{td.label}</span>
                          {td.keterangan && <span className="text-[var(--color-tinta-lembut)]">— {td.keterangan}</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`${badgeClass(gds.status)} px-2 py-0.5 rounded font-bold`}>GDS</span>
                          <span className={textClass(gds.status)}>{gds.label}</span>
                          {gds.keterangan && <span className="text-[var(--color-tinta-lembut)]">— {gds.keterangan}</span>}
                        </div>
                        {kol && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`${badgeClass(kol.status)} px-2 py-0.5 rounded font-bold`}>KOL</span>
                            <span className={textClass(kol.status)}>{kol.label}</span>
                            {kol.keterangan && <span className="text-[var(--color-tinta-lembut)]">— {kol.keterangan}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`${badgeClass(lp.status)} px-2 py-0.5 rounded font-bold`}>LP</span>
                          <span className={textClass(lp.status)}>{lp.label}</span>
                          {lp.keterangan && <span className="text-[var(--color-tinta-lembut)]">— {lp.keterangan}</span>}
                        </div>
                      </div>

                      <p className="text-xs text-[var(--color-tinta-lembut)] pt-1">
                        Diinput: {d.dibuat_pada ? new Date(d.dibuat_pada).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
