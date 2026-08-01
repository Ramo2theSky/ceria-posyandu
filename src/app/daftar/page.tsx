'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hitungUsia, klasifikasiIMT, klasifikasiTD, klasifikasiGDS, klasifikasiKolesterol, klasifikasiLP, peringatanUsiaRemaja } from '@/lib/klasifikasi';
import { parseBarisCSV, DataParsed, BarisCSV } from '@/lib/csv-parser';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-log';
import { maskNIK } from '@/lib/formatters';
import { cekNIK, RiwayatPemeriksaan } from '@/lib/riwayat';
import RiwayatModal from '@/components/RiwayatModal';

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
  dibuat_pada: string;
}

interface CSVRow {
  data: DataParsed | null;
  error: string | null;
  line: number;
}

type SortField = 'nik' | 'usia' | 'jenis_kelamin' | 'berat_badan' | 'tinggi_badan' | 'tanggal_periksa' | 'catatan';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <span className="text-[var(--color-tinta-lembut)] ml-1">↕</span>;
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

function detectDelimiter(line: string) {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function splitCsvLine(line: string, delimiter: ',' | ';') {
  return line
    .split(delimiter)
    .map((value) => value.trim().replace(/^"|"$/g, ''));
}

function isEmptyCsvRow(values: string[]) {
  return values.every((value) => value.trim().length === 0);
}

export default function DaftarPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<Pemeriksaan[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('tanggal_periksa');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [riwayatOpen, setRiwayatOpen] = useState(false);
  const [riwayatData, setRiwayatData] = useState<RiwayatPemeriksaan[] | null>(null);
  const [riwayatLoading, setRiwayatLoading] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importDate, setImportDate] = useState('2025-06-30');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: result, error } = await supabase
          .from('pemeriksaan')
          .select('*')
          .is('dihapus_pada', null)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        setCsvData([]);
        return;
      }

      const delimiter = detectDelimiter(lines[0]);

      const parsed: CSVRow[] = lines.map((line, i) => {
        const cleaned = line.trim();
        if (/^(Nomer|Nomor|No|NIK)\b/i.test(cleaned)) return { data: null, error: null, line: i + 1 };
        if (/^29\s+Juni/i.test(cleaned)) return { data: null, error: null, line: i + 1 };
        if (/^,+$/.test(cleaned)) return { data: null, error: null, line: i + 1 };

        const values = splitCsvLine(cleaned, delimiter as ',' | ';');
        if (isEmptyCsvRow(values)) return { data: null, error: null, line: i + 1 };

        const baris: BarisCSV = {
          Nomer: values[0],
          NIK: values[1],
          TTL: values[2],
          'L/P': values[3],
          BB: values[4],
          TB: values[5],
          LP: values[6],
          TD: values[7],
          GDS: values[8],
          CL: values[9],
        };

        const result = parseBarisCSV(baris, importDate);
        return { data: result.data, error: result.error, line: i + 1 };
      });

      setCsvData(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validData = csvData.filter((d) => d.data && !d.error);
    if (validData.length === 0) return;

    setImporting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) {
        alert('Sesi login tidak valid. Silakan login ulang sebelum mengimpor.');
        return;
      }

      const { klasifikasiIMT, klasifikasiTD, klasifikasiGDS, klasifikasiKolesterol, klasifikasiLP, statusKeseluruhan } = await import('@/lib/klasifikasi');

      const rows = validData.map((item) => {
        const d = item.data!;
        const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
        const td = d.td_diastol !== null ? klasifikasiTD(d.td_sistol, d.td_diastol) : { status: 'warn' as const, label: 'Data tidak lengkap', keterangan: '' };
        const gds = klasifikasiGDS(d.gds);
        const kol = d.kolesterol_total !== null ? klasifikasiKolesterol(d.kolesterol_total) : null;
        const lp = klasifikasiLP(d.lingkar_pinggang, d.jenis_kelamin);
        const keseluruhan = statusKeseluruhan([imt, td, gds, kol, lp]);

        return {
          nik: d.nik,
          tanggal_lahir: d.tanggal_lahir instanceof Date ? d.tanggal_lahir.toISOString().split('T')[0] : String(d.tanggal_lahir),
          jenis_kelamin: d.jenis_kelamin,
          berat_badan: d.berat_badan,
          tinggi_badan: d.tinggi_badan,
          lingkar_pinggang: d.lingkar_pinggang,
          td_sistol: d.td_sistol,
          td_diastol: d.td_diastol ?? 0,
          gds: d.gds,
          kolesterol_total: d.kolesterol_total,
          tanggal_periksa: importDate,
          catatan: keseluruhan,
          dibuat_oleh: userId,
        };
      });

      const { error } = await supabase.from('pemeriksaan').insert(rows);
      if (error) throw error;

      alert(`Berhasil mengimpor ${rows.length} data`);
      setShowImport(false);
      setCsvData([]);

      const { data: result } = await supabase
        .from('pemeriksaan')
        .select('*')
        .is('dihapus_pada', null)
        .order('tanggal_periksa', { ascending: false });
      setData(result || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengimpor data';
      alert(`Gagal mengimpor data: ${message}`);
    } finally {
      setImporting(false);
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
    if (!search) return true;
    const q = search.toLowerCase();
    return d.nik.includes(q) || d.tanggal_periksa.includes(q);
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
      case 'tanggal_periksa':
        aVal = a.tanggal_periksa;
        bVal = b.tanggal_periksa;
        break;
      case 'catatan': {
        const statusOrder: Record<string, number> = { 'SEHAT': 1, 'PERLU PEMANTAUAN': 2, 'PERLU RUJUKAN': 3 };
        const aOrder = statusOrder[a.catatan || ''] ?? 99;
        const bOrder = statusOrder[b.catatan || ''] ?? 99;
        return sortDir === 'asc' ? aOrder - bOrder : bOrder - aOrder;
      }
      default:
        aVal = a.tanggal_periksa;
        bVal = b.tanggal_periksa;
    }

    if (typeof aVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
    }

    return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  const getStatusColor = (catatan: string) => {
    if (catatan?.includes('PERLU RUJUKAN')) return 'badge-rujukan';
    if (catatan?.includes('PERLU PEMANTAUAN')) return 'badge-pemantauan';
    return 'badge-sehat';
  };

  const getStatusLabel = (catatan: string) => {
    if (catatan?.includes('PERLU RUJUKAN')) return 'RUJUKAN';
    if (catatan?.includes('PERLU PEMANTAUAN')) return 'PEMANTAUAN';
    return 'SEHAT';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-tinta-lembut)]">Memuat data warga...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header-gradient text-white p-4 flex justify-between items-center shadow-soft">
        <button onClick={() => router.push('/dashboard')} className="text-sm hover:opacity-80">
          ← Kembali
        </button>
        <h1 className="text-lg font-bold">Daftar Warga</h1>
        <a href="/dashboard"><img src="/ceria-logo.png" alt="CERIA" className="h-6 opacity-80" /></a>
      </header>

      <main className="flex-1 p-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg glass"
            placeholder="Cari NIK atau tanggal..."
          />
          <button onClick={() => setShowImport(true)} className="px-6 py-3 btn-gold text-white font-bold rounded-xl min-h-12">
            📥 Impor CSV
          </button>
        </div>

        {showImport && (
          <div className="mb-4 glass rounded-xl p-4 border border-[var(--color-garis)] shadow-soft">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-[var(--color-tinta)]">Impor Data CSV</h3>
              <button onClick={() => { setShowImport(false); setCsvData([]); }} className="text-[var(--color-tinta-lembut)] min-h-12 min-w-12 flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-sm font-bold text-[var(--color-tinta)] mb-1">Tanggal Periksa</label>
                <input
                  type="date"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[var(--color-garis)] rounded-lg glass min-h-12"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-[var(--color-tinta)] mb-1">File CSV</label>
                <input
                  type="file"
                  ref={fileRef}
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-2 border-2 border-dashed border-[var(--color-garis)] rounded-lg text-[var(--color-tinta-lembut)] text-sm min-h-12"
                >
                  Pilih File
                </button>
              </div>
            </div>

            {csvData.length > 0 && (
              <div>
                <p className="text-sm mb-2">
                  <span className="text-[var(--color-hijau-ok)] font-bold">{csvData.filter((d) => d.data).length} valid</span>
                  {' · '}
                  <span className="text-[var(--color-merah-risiko)] font-bold">{csvData.filter((d) => d.error).length} error</span>
                </p>

                <div className="max-h-64 overflow-y-auto space-y-1 mb-3">
                  {csvData.map((item, i) => (
                    <p key={i} className={item.error ? 'text-[var(--color-merah-risiko)]' : 'text-[var(--color-hijau-ok)]'}>
                      Baris {item.line}: {item.error ? item.error : item.data?.nik}
                    </p>
                  ))}
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing || csvData.filter((d) => d.data && !d.error).length === 0}
                  className="w-full btn-primary text-white font-bold py-3 rounded-xl disabled:opacity-50 min-h-12"
                >
                  {importing ? 'Mengimpor...' : `Impor ${csvData.filter((d) => d.data && !d.error).length} Data`}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[var(--color-tinta-lembut)]">{sorted.length} data ditemukan</p>
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 badge-rujukan text-white font-bold rounded-xl text-sm min-h-12"
              >
                🗑 Hapus {selectedIds.size} Data
              </button>
            )}
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); setSelectedIds(new Set()); }}
              className="px-3 py-1 border-2 border-[var(--color-garis)] rounded-lg text-sm glass min-h-12"
            >
              <option value={5}>5 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm glass rounded-xl border border-[var(--color-garis)]">
            <thead>
              <tr className="bg-[var(--color-hutan)] text-white">
                <th className="px-3 py-2 text-center w-10">
                  <input
                    type="checkbox"
                    checked={paged.length > 0 && paged.every((d) => selectedIds.has(d.id))}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-white cursor-pointer"
                  />
                </th>
                <th className="px-3 py-2 text-left cursor-pointer" onClick={() => handleSort('nik')}>
                  NIK <SortIcon field="nik" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2 text-center cursor-pointer" onClick={() => handleSort('usia')}>
                  Usia <SortIcon field="usia" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2 text-center cursor-pointer" onClick={() => handleSort('jenis_kelamin')}>
                  JK <SortIcon field="jenis_kelamin" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2 text-right cursor-pointer" onClick={() => handleSort('berat_badan')}>
                  BB <SortIcon field="berat_badan" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2 text-right cursor-pointer" onClick={() => handleSort('tinggi_badan')}>
                  TB <SortIcon field="tinggi_badan" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2 text-right">IMT</th>
                <th className="px-3 py-2 text-center">TD</th>
                <th className="px-3 py-2 text-center cursor-pointer" onClick={() => handleSort('catatan')}>
                  Status <SortIcon field="catatan" sortField={sortField} sortDir={sortDir} />
                </th>
                <th className="px-3 py-2 text-center">Waktu Input</th>
                <th className="px-3 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => {
                const imt = (d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1);
                const usia = hitungUsia(d.tanggal_lahir, new Date());
                const isExpanded = expandedId === d.id;

                return (
                  <Fragment key={d.id}>
                    <tr className={`border-t border-[var(--color-garis)] ${selectedIds.has(d.id) ? 'bg-[var(--color-daun-muda)]' : ''}`}>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(d.id)}
                          onChange={() => toggleSelect(d.id)}
                          className="w-4 h-4 rounded accent-[var(--color-hutan)] cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{maskNIK(d.nik)}</td>
                      <td className="px-3 py-2 text-center">{usia}</td>
                      <td className="px-3 py-2 text-center">{d.jenis_kelamin}</td>
                      <td className="px-3 py-2 text-right">{d.berat_badan}</td>
                      <td className="px-3 py-2 text-right">{d.tinggi_badan}</td>
                      <td className="px-3 py-2 text-right">{imt}</td>
                      <td className="px-3 py-2 text-center text-xs">{d.td_sistol}/{d.td_diastol}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(d.catatan)}`}>
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
                            className="px-2 py-1 text-xs glass border border-[var(--color-garis)] rounded min-h-12"
                          >
                            {isExpanded ? 'Tutup' : 'Detail'}
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="px-2 py-1 text-xs badge-rujukan rounded min-h-12"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (() => {
                      const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
                      const td = klasifikasiTD(d.td_sistol, d.td_diastol);
                      const gds = klasifikasiGDS(d.gds);
                      const kol = klasifikasiKolesterol(d.kolesterol_total);
                      const lp = klasifikasiLP(d.lingkar_pinggang, d.jenis_kelamin);
                      const usia = hitungUsia(d.tanggal_lahir, new Date());
                      const peringatanRemaja = peringatanUsiaRemaja(usia);

                      const badgeClass = (s: string) => s === 'ok' ? 'badge-sehat' : s === 'warn' ? 'badge-pemantauan' : 'badge-rujukan';
                      const textClass = (s: string) => s === 'ok' ? 'text-[var(--color-hijau-ok)]' : s === 'warn' ? 'text-[var(--color-kuning-warn)]' : 'text-[var(--color-merah-risiko)]';

                      return (
                        <tr className="bg-[var(--color-kertas-dalam)]/70 border-t border-[var(--color-garis)]">
                          <td colSpan={10} className="px-3 py-4 text-sm space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide">NIK Penuh</p>
                                <p className="font-mono font-bold text-[var(--color-tinta)]">{d.nik}</p>
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
                              <div className="p-3 badge-pemantauan rounded-xl text-sm">{peringatanRemaja}</div>
                            )}

                            <div>
                              <p className="text-[var(--color-tinta-lembut)] text-xs uppercase tracking-wide mb-2">Detail Klasifikasi Kesehatan</p>
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                <div className={`p-3 rounded-xl border-2 ${badgeClass(imt.status)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[var(--color-tinta)]">IMT</span>
                                    <span className={`text-xs font-bold uppercase ${textClass(imt.status)}`}>{imt.label}</span>
                                  </div>
                                  <p className="text-sm text-[var(--color-tinta)]">{(d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1)} kg/m²</p>
                                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{imt.keterangan}</p>
                                </div>

                                <div className={`p-3 rounded-xl border-2 ${badgeClass(td.status)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[var(--color-tinta)]">Tekanan Darah</span>
                                    <span className={`text-xs font-bold uppercase ${textClass(td.status)}`}>{td.label}</span>
                                  </div>
                                  <p className="text-sm text-[var(--color-tinta)]">{d.td_sistol}/{d.td_diastol} mmHg</p>
                                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{td.keterangan}</p>
                                </div>

                                <div className={`p-3 rounded-xl border-2 ${badgeClass(gds.status)}`}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-[var(--color-tinta)]">Gula Darah</span>
                                    <span className={`text-xs font-bold uppercase ${textClass(gds.status)}`}>{gds.label}</span>
                                  </div>
                                  <p className="text-sm text-[var(--color-tinta)]">{d.gds} mg/dL</p>
                                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{gds.keterangan}</p>
                                </div>

                                {kol ? (
                                  <div className={`p-3 rounded-xl border-2 ${badgeClass(kol.status)}`}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-bold text-[var(--color-tinta)]">Kolesterol</span>
                                      <span className={`text-xs font-bold uppercase ${textClass(kol.status)}`}>{kol.label}</span>
                                    </div>
                                    <p className="text-sm text-[var(--color-tinta)]">{d.kolesterol_total} mg/dL</p>
                                    <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">{kol.keterangan}</p>
                                  </div>
                                ) : (
                                  <div className="p-3 rounded-xl border-2 border-[var(--color-garis)] bg-[var(--color-kertas-dalam)]">
                                    <span className="font-bold text-[var(--color-tinta)]">Kolesterol</span>
                                    <p className="text-sm text-[var(--color-tinta-lembut)] mt-1">Tidak Diperiksa</p>
                                  </div>
                                )}

                                <div className={`p-3 rounded-xl border-2 ${badgeClass(lp.status)}`}>
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
                              className="w-full px-4 py-3 btn-gold text-white font-bold rounded-xl min-h-12"
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
              className="px-3 py-1 glass border border-[var(--color-garis)] rounded-lg disabled:opacity-50 min-h-12"
            >
              ←
            </button>
            <span className="px-3 py-1 text-sm">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 glass border border-[var(--color-garis)] rounded-lg disabled:opacity-50 min-h-12"
            >
              →
            </button>
          </div>
        )}
      </main>

      <RiwayatModal
        riwayat={riwayatData || []}
        onClose={() => { setRiwayatOpen(false); setRiwayatData(null); }}
      />

      {riwayatLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[var(--color-hutan)] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--color-tinta)]">Memuat riwayat...</span>
          </div>
        </div>
      )}
    </div>
  );
}