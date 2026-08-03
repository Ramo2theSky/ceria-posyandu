'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { hitungUsia, klasifikasiIMT, klasifikasiTD, klasifikasiGulaDarah, klasifikasiKolesterol, klasifikasiLP, type JenisGulaDarah } from '@/lib/klasifikasi';
import { maskNIK } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';

interface Pemeriksaan {
  id: string;
  nik: string;
  tanggal_lahir: string;
  jenis_kelamin: 'L' | 'P';
  alamat: string | null;
  berat_badan: number;
  tinggi_badan: number;
  lingkar_pinggang: number;
  td_sistol: number;
  td_diastol: number;
  gds: number;
  jenis_gula_darah: JenisGulaDarah;
  kolesterol_total: number | null;
  tanggal_periksa: string;
  catatan: string;
  dibuat_pada: string;
}

const STATUS_MAP: Record<string, string> = {
  'all': 'Semua Status',
  'sehat': 'SEHAT',
  'pemantauan': 'PERLU PEMANTAUAN',
  'rujukan': 'PERLU RUJUKAN',
};

const STATUS_COLOR: Record<string, string> = {
  'all': 'var(--color-hutan)',
  'sehat': 'var(--color-hijau-ok)',
  'pemantauan': 'var(--color-kuning-warn)',
  'rujukan': 'var(--color-merah-risiko)',
};

export default function RekapStatusPage() {
  const router = useRouter();
  const params = useParams();
  const statusKey = params.status as string;
  const statusLabel = STATUS_MAP[statusKey] || statusKey;
  const statusColor = STATUS_COLOR[statusKey] || 'var(--color-hutan)';

  const [data, setData] = useState<Pemeriksaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        let query = supabase
          .from('pemeriksaan')
          .select('*')
          .is('dihapus_pada', null)
          .order('tanggal_periksa', { ascending: false });

        if (statusKey !== 'all') {
          query = query.eq('catatan', statusLabel);
        }

        const { data: result, error } = await query;
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
  }, [statusKey, statusLabel]);

  const filtered = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(d => d.nik.includes(q) || (d.alamat && d.alamat.toLowerCase().includes(q)));
  }, [data, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, Pemeriksaan[]> = {};
    filtered.forEach(d => {
      const key = d.catatan || 'TANPA STATUS';
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }, [filtered]);

  const sehatCount = filtered.filter(d => d.catatan === 'SEHAT').length;
  const pemantauanCount = filtered.filter(d => d.catatan === 'PERLU PEMANTAUAN').length;
  const rujukanCount = filtered.filter(d => d.catatan === 'PERLU RUJUKAN').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-tinta-lembut)]">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-kertas)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => router.push('/rekap')} className="flex items-center gap-2 text-sm text-[var(--color-tinta-lembut)] hover:text-[var(--color-tinta)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          <span className="font-semibold">Kembali ke Rekap</span>
        </button>
        <button onClick={() => router.push('/dashboard')} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-tinta-lembut)] hover:bg-white">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <div className="px-4 pb-20 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
            <h1 className="text-xl font-bold text-[var(--color-tinta)]">{statusLabel}</h1>
          </div>
          <p className="text-xs text-[var(--color-tinta-lembut)] ml-6">
            {filtered.length} warga{statusKey !== 'all' ? ` dengan status ${statusLabel.toLowerCase()}` : ''}
          </p>
        </div>

        {/* Status summary cards (only for "all") */}
        {statusKey === 'all' && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <button
              onClick={() => router.push('/rekap/status/sehat')}
              className="bg-white rounded-xl border border-[var(--color-hijau-ok)]/20 p-3 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-hijau-ok)]" />
                <span className="text-xs font-semibold text-[var(--color-hijau-ok)]">Sehat</span>
              </div>
              <p className="text-2xl font-bold text-[var(--color-hijau-ok)]">{sehatCount}</p>
            </button>
            <button
              onClick={() => router.push('/rekap/status/pemantauan')}
              className="bg-white rounded-xl border border-[var(--color-kuning-warn)]/20 p-3 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-kuning-warn)]" />
                <span className="text-xs font-semibold text-[var(--color-kuning-warn)]">Pemantauan</span>
              </div>
              <p className="text-2xl font-bold text-[var(--color-kuning-warn)]">{pemantauanCount}</p>
            </button>
            <button
              onClick={() => router.push('/rekap/status/rujukan')}
              className="bg-white rounded-xl border border-[var(--color-merah-risiko)]/20 p-3 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-merah-risiko)]" />
                <span className="text-xs font-semibold text-[var(--color-merah-risiko)]">Rujukan</span>
              </div>
              <p className="text-2xl font-bold text-[var(--color-merah-risiko)]">{rujukanCount}</p>
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari NIK atau alamat..."
            className="w-full px-4 py-2.5 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-8 text-center">
            <p className="text-sm text-[var(--color-tinta-lembut)]">
              {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : 'Tidak ada data untuk status ini.'}
            </p>
          </div>
        ) : statusKey === 'all' ? (
          /* Grouped by status for "all" view */
          <div className="space-y-5">
            {(['SEHAT', 'PERLU PEMANTAUAN', 'PERLU RUJUKAN'] as const).map((status) => {
              const items = grouped[status] || [];
              if (items.length === 0) return null;
              const color = status === 'SEHAT' ? 'var(--color-hijau-ok)' : status === 'PERLU PEMANTAUAN' ? 'var(--color-kuning-warn)' : 'var(--color-merah-risiko)';
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <h2 className="text-sm font-bold text-[var(--color-tinta)]">{status}</h2>
                    <span className="text-xs text-[var(--color-tinta-lembut)]">({items.length})</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((d) => (
                      <WargaCard key={d.id} data={d} expandedId={expandedId} setExpandedId={setExpandedId} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat list for specific status */
          <div className="space-y-2">
            {filtered.map((d) => (
              <WargaCard key={d.id} data={d} expandedId={expandedId} setExpandedId={setExpandedId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Warga Card ─── */
function WargaCard({
  data: d,
  expandedId,
  setExpandedId,
}: {
  data: Pemeriksaan;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  const usia = hitungUsia(d.tanggal_lahir, new Date());
  const isExpanded = expandedId === d.id;
  const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
  const td = klasifikasiTD(d.td_sistol, d.td_diastol);
  const jenisGD = d.jenis_gula_darah || 'sewaktu';
  const gds = klasifikasiGulaDarah(d.gds, jenisGD);
  const kol = klasifikasiKolesterol(d.kolesterol_total);
  const lp = klasifikasiLP(d.lingkar_pinggang, d.jenis_kelamin);

  const badgeClass = (s: string) => s === 'ok' ? 'bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)]' : s === 'warn' ? 'bg-[var(--color-kuning-warn-bg)] text-[var(--color-kuning-warn)]' : 'bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)]';

  const statusColor = d.catatan === 'SEHAT' ? 'var(--color-hijau-ok)' : d.catatan === 'PERLU PEMANTAUAN' ? 'var(--color-kuning-warn)' : 'var(--color-merah-risiko)';

  return (
    <div className="bg-white rounded-xl border border-[var(--color-garis)] overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={() => setExpandedId(isExpanded ? null : d.id)}
        className="w-full p-4 text-left flex items-center gap-3"
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-[var(--color-tinta)]">{maskNIK(d.nik)}</p>
          </div>
          <p className="text-xs text-[var(--color-tinta-lembut)] mt-0.5">
            {usia} tahun · {d.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {d.tanggal_periksa}
          </p>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-tinta-lembut)" strokeWidth="2"
          className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-garis)]/50">
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { label: 'BB', value: `${d.berat_badan} kg` },
              { label: 'TB', value: `${d.tinggi_badan} cm` },
              { label: 'LP', value: `${d.lingkar_pinggang} cm` },
              { label: 'IMT', value: (d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1) },
            ].map((item) => (
              <div key={item.label} className="text-center p-2 bg-[var(--color-kertas-dalam)] rounded-lg">
                <p className="text-[10px] text-[var(--color-tinta-lembut)]">{item.label}</p>
                <p className="text-xs font-bold text-[var(--color-tinta)]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            {[
              { label: 'IMT', data: imt },
              { label: 'TD', data: td },
              { label: jenisGD === 'puasa' ? 'GDP' : 'GDS', data: gds },
              ...(kol ? [{ label: 'KOL', data: kol }] : []),
              { label: 'LP', data: lp },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass(item.data.status)}`}>
                  {item.label}
                </span>
                <span className={`font-semibold ${item.data.status === 'ok' ? 'text-[var(--color-hijau-ok)]' : item.data.status === 'warn' ? 'text-[var(--color-kuning-warn)]' : 'text-[var(--color-merah-risiko)]'}`}>
                  {item.data.label}
                </span>
                {item.data.keterangan && (
                  <span className="text-[var(--color-tinta-lembut)]">— {item.data.keterangan}</span>
                )}
              </div>
            ))}
          </div>

          {d.dibuat_pada && (
            <p className="text-[10px] text-[var(--color-tinta-lembut)]">
              Diinput: {new Date(d.dibuat_pada).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
