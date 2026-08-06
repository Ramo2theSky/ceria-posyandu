'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hitungUsia, klasifikasiIMT, klasifikasiTD, klasifikasiGulaDarah, klasifikasiKolesterol, klasifikasiLP, peringatanUsiaRemaja, type JenisGulaDarah } from '@/lib/klasifikasi';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-log';
import { maskNIK } from '@/lib/formatters';
import { cekNIK, RiwayatPemeriksaan } from '@/lib/riwayat';
import { isSuperAdmin, getPosyanduList, type Posyandu } from '@/lib/posyandu';
import RiwayatModal from '@/components/RiwayatModal';
import AppShell from '@/components/AppShell';

interface Pemeriksaan {
  id: string;
  nik: string;
  nama_lengkap: string | null;
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
  jenis_gula_darah: JenisGulaDarah;
  kolesterol_total: number | null;
  tanggal_periksa: string;
  catatan: string;
  dibuat_pada: string;
  posyandu_id: string | null;
}

type SortField = 'nik' | 'usia' | 'jenis_kelamin' | 'berat_badan' | 'tinggi_badan' | 'imt' | 'tanggal_periksa' | 'dibuat_pada' | 'catatan';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <span className="text-[var(--color-tinta-lembut)] ml-1">↕</span>;
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

export default function DaftarPage() {
  const router = useRouter();

  const [data, setData] = useState<Pemeriksaan[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('dibuat_pada');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [riwayatOpen, setRiwayatOpen] = useState(false);
  const [riwayatData, setRiwayatData] = useState<RiwayatPemeriksaan[] | null>(null);
  const [riwayatLoading, setRiwayatLoading] = useState(false);

  // Posyandu state
  const [isAdmin, setIsAdmin] = useState(false);
  const [posyanduList, setPosyanduList] = useState<Posyandu[]>([]);
  const [filterPosyandu, setFilterPosyandu] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const admin = await isSuperAdmin();
        if (!cancelled) setIsAdmin(admin);

        let query = supabase
          .from('pemeriksaan')
          .select('*')
          .is('dihapus_pada', null);

        if (admin) {
          const list = await getPosyanduList();
          if (!cancelled) setPosyanduList(list);
        }

        const { data: result, error } = await query.order('tanggal_periksa', { ascending: false });

        if (error) throw error;
        if (!cancelled) setData(result || []);
      } catch {
        console.error('Gagal memuat data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Pindahkan data ini ke recycle bin?')) return;

    try {
      const target = data.find((d) => d.id === id);
      const { error } = await supabase
        .from('pemeriksaan')
        .update({ dihapus_pada: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      if (target) logActivity('delete', target.nik, `Data warga ${target.nik} dipindahkan ke recycle bin`);
      setData(data.filter((d) => d.id !== id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      alert('Gagal menghapus data');
    }
  };

  const handleLihatRiwayat = async (nik: string) => {
    setRiwayatLoading(true);
    setRiwayatOpen(true);
    setRiwayatData(null);
    const result = await cekNIK(nik);
    setRiwayatData(result?.riwayat || []);
    setRiwayatLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pagedIds = paged.map((d) => d.id);
    const allSelected = pagedIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Pindahkan ${selectedIds.size} data ke recycle bin?`)) return;

    try {
      const ids = Array.from(selectedIds);
      const targets = data.filter((d) => selectedIds.has(d.id));
      const { error } = await supabase
        .from('pemeriksaan')
        .update({ dihapus_pada: new Date().toISOString() })
        .in('id', ids);

      if (error) throw error;
      targets.forEach((t) => logActivity('delete', t.nik, `Data warga ${t.nik} dipindahkan ke recycle bin`));
      setData(data.filter((d) => !selectedIds.has(d.id)));
      setSelectedIds(new Set());
    } catch {
      alert('Gagal menghapus data');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = data.filter((d) => {
    // Filter by posyandu for admin
    if (isAdmin && filterPosyandu && d.posyandu_id !== filterPosyandu) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return d.nik.includes(q) || d.nama_lengkap?.toLowerCase().includes(q) || d.tanggal_periksa.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case 'nik':
        aVal = a.nik;
        bVal = b.nik;
        break;
      case 'usia':
        aVal = hitungUsia(a.tanggal_lahir, new Date());
        bVal = hitungUsia(b.tanggal_lahir, new Date());
        break;
      case 'jenis_kelamin':
        aVal = a.jenis_kelamin;
        bVal = b.jenis_kelamin;
        break;
      case 'berat_badan':
        aVal = a.berat_badan;
        bVal = b.berat_badan;
        break;
      case 'tinggi_badan':
        aVal = a.tinggi_badan;
        bVal = b.tinggi_badan;
        break;
      case 'imt':
        aVal = a.berat_badan / Math.pow(a.tinggi_badan / 100, 2);
        bVal = b.berat_badan / Math.pow(b.tinggi_badan / 100, 2);
        break;
      case 'tanggal_periksa':
        aVal = a.tanggal_periksa;
        bVal = b.tanggal_periksa;
        break;
      case 'dibuat_pada':
        aVal = a.dibuat_pada || '';
        bVal = b.dibuat_pada || '';
        break;
      case 'catatan': {
        const statusOrder: Record<string, number> = { 'SEHAT': 1, 'PERLU PEMANTAUAN': 2, 'PERLU RUJUKAN': 3 };
        const aOrder = statusOrder[a.catatan || ''] ?? 99;
        const bOrder = statusOrder[b.catatan || ''] ?? 99;
        return sortDir === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
      default:
        aVal = a.dibuat_pada || '';
        bVal = b.dibuat_pada || '';
    }

    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }

    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  const getStatusColor = (catatan: string) => {
    if (catatan?.includes('PERLU RUJUKAN')) return 'bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)]';
    if (catatan?.includes('PERLU PEMANTAUAN')) return 'bg-[var(--color-kuning-warn-bg)] text-[var(--color-kuning-warn)]';
    return 'bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)]';
  };

  const getStatusLabel = (catatan: string) => {
    if (catatan?.includes('PERLU RUJUKAN')) return 'RUJUKAN';
    if (catatan?.includes('PERLU PEMANTAUAN')) return 'PEMANTAUAN';
    return 'SEHAT';
  };

  const getStatusIcon = (catatan: string) => {
    if (catatan?.includes('PERLU RUJUKAN')) return '!!';
    if (catatan?.includes('PERLU PEMANTAUAN')) return '!';
    return '★';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-tinta-lembut)]">Memuat data warga...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="bg-[var(--color-kertas)] min-h-[calc(100vh-52px)] md:min-h-screen">
      <main className="px-4 py-6 pb-20 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--color-tinta)]">Daftar Warga</h1>
          <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">Kelola data warga yang sudah diperiksa</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-3 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all"
            placeholder="Cari NIK, nama, atau tanggal..."
          />
          {isAdmin && posyanduList.length > 0 && (
            <select
              value={filterPosyandu}
              onChange={(e) => { setFilterPosyandu(e.target.value); setPage(1); }}
              className="px-4 py-3 pr-10 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.2em] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]"
            >
              <option value="">Semua Posyandu</option>
              {posyanduList.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[var(--color-tinta-lembut)]">{sorted.length} data ditemukan</p>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-[var(--color-merah-risiko)]/90 text-white font-semibold text-sm rounded-lg"
              >
                Hapus {selectedIds.size} Data
              </button>
            )}
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); setSelectedIds(new Set()); }}
              className="px-3 py-1 border border-[var(--color-garis)] rounded-lg text-sm bg-white text-[var(--color-tinta)]"
            >
              <option value={5}>5 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded-2xl border border-[var(--color-garis)]">
            <thead>
              <tr className="border-b border-[var(--color-garis)]">
                <th className="px-3 py-2.5 text-center w-10">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && paged.every((d) => selectedIds.has(d.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-[var(--color-hutan)] cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('nik')}>
                  NIK <SortIcon field="nik" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--color-tinta-lembut)]">
                  Nama
                </th>
                {isAdmin && (
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[var(--color-tinta-lembut)]">
                    Posyandu
                  </th>
                )}
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('usia')}>
                  Usia <SortIcon field="usia" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('jenis_kelamin')}>
                  JK <SortIcon field="jenis_kelamin" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('berat_badan')}>
                  BB <SortIcon field="berat_badan" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('tinggi_badan')}>
                  TB <SortIcon field="tinggi_badan" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('imt')}>
                  IMT <SortIcon field="imt" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--color-tinta-lembut)]">TD</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('catatan')}>
                  Status <SortIcon field="catatan" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--color-tinta-lembut)] cursor-pointer" onClick={() => handleSort('dibuat_pada')}>
                  Waktu Input <SortIcon field="dibuat_pada" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-[var(--color-tinta-lembut)]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => {
                const imt = (d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1);
                const usia = hitungUsia(d.tanggal_lahir, new Date());
                const isExpanded = expandedId === d.id;
                const isRujukan = d.catatan?.includes('PERLU RUJUKAN');
                const isPemantauan = d.catatan?.includes('PERLU PEMANTAUAN');
                const imtKlas = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
                const tdKlas = klasifikasiTD(d.td_sistol, d.td_diastol);

                const rowBg = isRujukan
                  ? 'bg-[var(--color-merah-risiko-bg)]/30'
                  : isPemantauan
                  ? 'bg-[var(--color-kuning-warn-bg)]/30'
                  : '';

                const dotClass = (s: string) => s === 'ok' ? 'bg-[var(--color-hijau-ok)]' : s === 'warn' ? 'bg-[var(--color-kuning-warn)]' : 'bg-[var(--color-merah-risiko)]';

                return (
                  <Fragment key={d.id}>
                    <tr className={`border-t border-[var(--color-garis)] ${rowBg} ${selectedIds.has(d.id) ? 'bg-[var(--color-daun-muda)]' : ''}`}>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(d.id)}
                          onChange={() => toggleSelect(d.id)}
                          className="w-4 h-4 rounded accent-[var(--color-hutan)] cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{maskNIK(d.nik)}</td>
                      <td className="px-3 py-2 text-xs font-semibold">{d.nama_lengkap || '-'}</td>
                      {isAdmin && (
                        <td className="px-3 py-2 text-xs text-[var(--color-tinta-lembut)]">
                          {posyanduList.find(p => p.id === d.posyandu_id)?.nama || '-'}
                        </td>
                      )}
                      <td className="px-3 py-2 text-center">{usia}</td>
                      <td className="px-3 py-2 text-center">{d.jenis_kelamin}</td>
                      <td className="px-3 py-2 text-right">{d.berat_badan}</td>
                      <td className="px-3 py-2 text-right">{d.tinggi_badan}</td>
                      <td className="px-3 py-2 text-right">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotClass(imtKlas.status)}`} />
                          {imt}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${dotClass(tdKlas.status)}`} />
                          {d.td_sistol}/{d.td_diastol}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(d.catatan)}`}>
                          <span className="font-bold">{getStatusIcon(d.catatan)}</span>
                          {getStatusLabel(d.catatan)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-[var(--color-tinta-lembut)]">
                        {d.dibuat_pada ? new Date(d.dibuat_pada).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : d.id)}
                            className="px-2 py-1 text-xs border border-[var(--color-garis)] rounded-lg text-[var(--color-tinta)] hover:bg-[var(--color-kertas-dalam)] transition-colors"
                          >
                            {isExpanded ? 'Tutup' : 'Detail'}
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="px-2 py-1 text-xs text-[var(--color-merah-risiko)] hover:bg-[var(--color-merah-risiko-bg)] rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (() => {
                      const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
                      const td = klasifikasiTD(d.td_sistol, d.td_diastol);
                      const jenisGD = d.jenis_gula_darah || 'sewaktu';
                      const gds = klasifikasiGulaDarah(d.gds, jenisGD);
                      const kol = klasifikasiKolesterol(d.kolesterol_total);
                      const lp = klasifikasiLP(d.lingkar_pinggang, d.jenis_kelamin);
                      const usia = hitungUsia(d.tanggal_lahir, new Date());
                      const peringatanRemaja = peringatanUsiaRemaja(usia);

                      const badgeClass = (s: string) => s === 'ok' ? 'bg-[var(--color-hijau-ok-bg)] border-[var(--color-hijau-ok)]/20' : s === 'warn' ? 'bg-[var(--color-kuning-warn-bg)] border-[var(--color-kuning-warn)]/20' : 'bg-[var(--color-merah-risiko-bg)] border-[var(--color-merah-risiko)]/20';
                      const textClass = (s: string) => s === 'ok' ? 'text-[var(--color-hijau-ok)]' : s === 'warn' ? 'text-[var(--color-kuning-warn)]' : 'text-[var(--color-merah-risiko)]';

                      return (
                        <tr className="bg-[var(--color-kertas-dalam)]/70 border-t border-[var(--color-garis)]">
                          <td colSpan={isAdmin ? 12 : 11} className="px-3 py-4 text-sm space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">NIK Penuh</p>
                                <p className="font-mono font-bold text-[var(--color-tinta)]">{d.nik}</p>
                              </div>
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">Nama Lengkap</p>
                                <p className="font-bold text-[var(--color-tinta)]">{d.nama_lengkap || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">Tanggal Lahir</p>
                                <p className="font-bold text-[var(--color-tinta)]">{d.tanggal_lahir}</p>
                              </div>
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">Usia</p>
                                <p className="font-bold text-[var(--color-tinta)]">{usia} tahun ({usia < 18 ? 'Remaja' : usia < 60 ? 'Dewasa' : 'Lansia'})</p>
                              </div>
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">Jenis Kelamin</p>
                                <p className="font-bold text-[var(--color-tinta)]">{d.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">Tanggal Periksa</p>
                                <p className="font-bold text-[var(--color-tinta)]">{d.tanggal_periksa}</p>
                              </div>
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">No. Telepon</p>
                                <p className="font-bold text-[var(--color-tinta)]">{d.no_telepon || '-'}</p>
                              </div>
                              <div className="sm:col-span-2 lg:col-span-3">
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">Alamat</p>
                                <p className="font-bold text-[var(--color-tinta)]">{d.alamat || '-'}</p>
                              </div>
                            </div>

                            {peringatanRemaja && (
                              <div className="p-3 bg-[var(--color-kuning-warn-bg)] text-[var(--color-kuning-warn)] border border-[var(--color-kuning-warn)]/20 rounded-xl text-sm">{peringatanRemaja}</div>
                            )}

                            <div>
                              <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide mb-2">Detail Klasifikasi Kesehatan</p>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                <div className={`p-3 rounded-xl border ${badgeClass(imt.status)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[var(--color-tinta)]">IMT</span>
                                    <span className={`text-xs font-bold uppercase ${textClass(imt.status)}`}>{imt.label}</span>
                                  </div>
                                  <p className="text-sm text-[var(--color-tinta)]">{(d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1)} kg/m²</p>
                                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{imt.keterangan}</p>
                                </div>

                                <div className={`p-3 rounded-xl border ${badgeClass(td.status)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[var(--color-tinta)]">Tekanan Darah</span>
                                    <span className={`text-xs font-bold uppercase ${textClass(td.status)}`}>{td.label}</span>
                                  </div>
                                  <p className="text-sm text-[var(--color-tinta)]">{d.td_sistol}/{d.td_diastol} mmHg</p>
                                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{td.keterangan}</p>
                                </div>

                                <div className={`p-3 rounded-xl border ${badgeClass(gds.status)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[var(--color-tinta)]">{jenisGD === 'puasa' ? 'GDP' : 'GDS'}</span>
                                    <span className={`text-xs font-bold uppercase ${textClass(gds.status)}`}>{gds.label}</span>
                                  </div>
                                  <p className="text-sm text-[var(--color-tinta)]">{d.gds} mg/dL ({jenisGD === 'puasa' ? 'Puasa' : 'Sewaktu'})</p>
                                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{gds.keterangan}</p>
                                </div>

                                {kol ? (
                                  <div className={`p-3 rounded-xl border ${badgeClass(kol.status)}`}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-[var(--color-tinta)]">Kolesterol</span>
                                      <span className={`text-xs font-bold uppercase ${textClass(kol.status)}`}>{kol.label}</span>
                                    </div>
                                    <p className="text-sm text-[var(--color-tinta)]">{d.kolesterol_total} mg/dL</p>
                                    <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{kol.keterangan}</p>
                                  </div>
                                ) : (
                                  <div className="p-3 rounded-xl border border-[var(--color-garis)] bg-[var(--color-kertas-dalam)]">
                                    <span className="font-bold text-[var(--color-tinta)]">Kolesterol</span>
                                    <p className="text-sm text-[var(--color-tinta-lembut)] mt-1">Tidak Diperiksa</p>
                                  </div>
                                )}

                                <div className={`p-3 rounded-xl border ${badgeClass(lp.status)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[var(--color-tinta)]">Lingkar Pinggang</span>
                                    <span className={`text-xs font-bold uppercase ${textClass(lp.status)}`}>{lp.label}</span>
                                  </div>
                                  <p className="text-sm text-[var(--color-tinta)]">{d.lingkar_pinggang} cm</p>
                                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{lp.keterangan}</p>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleLihatRiwayat(d.nik)}
                              disabled={riwayatLoading}
                              className="w-full px-4 py-2.5 bg-[var(--color-padi)]/10 border border-[var(--color-padi)]/30 text-[var(--color-padi)] font-semibold text-sm rounded-lg hover:bg-[var(--color-padi)]/20 transition-colors disabled:opacity-50"
                            >
                              📊 Lihat Riwayat Pemeriksaan
                            </button>
                          </td>
                        </tr>
                      );
                    })()}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-white border border-[var(--color-garis)] rounded-lg text-sm text-[var(--color-tinta)] disabled:opacity-50"
            >
              ←
            </button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-white border border-[var(--color-garis)] rounded-lg text-sm text-[var(--color-tinta)] disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </main>

      {(riwayatOpen || riwayatLoading) && (
        <>
          {riwayatLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[var(--color-hutan)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--color-tinta)]">Memuat riwayat...</span>
              </div>
            </div>
          )}
          {!riwayatLoading && riwayatData && riwayatData.length > 0 && (
            <RiwayatModal riwayat={riwayatData} onClose={() => { setRiwayatOpen(false); setRiwayatData(null); }} />
          )}
        </>
      )}

    </div>
    </AppShell>
  );
}