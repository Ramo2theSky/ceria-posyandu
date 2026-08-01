'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [filterUsia, setFilterUsia] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(true);

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

  const filtered = useMemo(() => {
    return data.filter(d => {
      const usia = hitungUsia(d.tanggal_lahir, new Date());
      const kategoriUsia = usia < 18 ? 'remaja' : usia < 60 ? 'dewasa' : 'lansia';
      if (filterUsia.length > 0 && !filterUsia.includes(kategoriUsia)) return false;
      if (filterStatus.length > 0 && !filterStatus.includes(d.catatan || '')) return false;
      if (dateFrom && d.tanggal_periksa < dateFrom) return false;
      if (dateTo && d.tanggal_periksa > dateTo) return false;
      return true;
    });
  }, [data, filterUsia, filterStatus, dateFrom, dateTo]);

  const totalWarga = filtered.length;
  const sehat = filtered.filter(d => d.catatan === 'SEHAT').length;
  const perluPemantauan = filtered.filter(d => d.catatan === 'PERLU PEMANTAUAN').length;
  const perluRujukan = filtered.filter(d => d.catatan === 'PERLU RUJUKAN').length;

  const remaja = filtered.filter(d => hitungUsia(d.tanggal_lahir, new Date()) < 18).length;
  const dewasa = filtered.filter(d => { const u = hitungUsia(d.tanggal_lahir, new Date()); return u >= 18 && u < 60; }).length;
  const lansia = filtered.filter(d => hitungUsia(d.tanggal_lahir, new Date()) >= 60).length;

  const hipertensi = filtered.filter(d => d.td_sistol >= 140 || d.td_diastol >= 90).length;
  const diabetes = filtered.filter(d => d.gds >= 200).length;
  const kolesterolTinggi = filtered.filter(d => d.kolesterol_total !== null && d.kolesterol_total >= 240).length;
  const obesitas = filtered.filter(d => {
    const imt = d.berat_badan / Math.pow(d.tinggi_badan / 100, 2);
    return imt >= 25;
  }).length;

  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(d => {
      const key = d.tanggal_periksa.slice(0, 7);
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [filtered]);

  const maxMonthly = Math.max(...monthlyData.map(([, c]) => c), 1);

  const recentData = useMemo(() => {
    return [...filtered]
      .sort((a, b) => b.tanggal_periksa.localeCompare(a.tanggal_periksa))
      .slice(0, 10);
  }, [filtered]);

  const handleExportCSV = () => {
    const headers = ['NIK', 'Tanggal Lahir', 'Jenis Kelamin', 'No. Telepon', 'Alamat', 'BB', 'TB', 'LP', 'TD Sistol', 'TD Diastol', 'GDS', 'Kolesterol', 'Tanggal Periksa', 'Status'];
    const rows = filtered.map(d => [
      `'${d.nik}'`, d.tanggal_lahir, d.jenis_kelamin, d.no_telepon || '-', d.alamat || '-',
      d.berat_badan, d.tinggi_badan, d.lingkar_pinggang, d.td_sistol, d.td_diastol,
      d.gds, d.kolesterol_total || '-', d.tanggal_periksa, d.catatan || '-',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-desa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleFilterUsia = (val: string) => {
    setFilterUsia(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleFilterStatus = (val: string) => {
    setFilterStatus(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

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
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm text-[var(--color-tinta-lembut)] hover:text-[var(--color-tinta)]">
          <img src="/ceria-logo.png" alt="CERIA" className="h-5" />
          <span className="font-semibold hidden sm:inline">CERIA</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-2 rounded-lg hover:bg-white text-[var(--color-tinta-lembut)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
          </button>
          <button onClick={() => router.push('/dashboard')} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-tinta-lembut)] hover:bg-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <div className="px-4 pb-8 flex gap-5 max-w-[1400px] mx-auto">
        {/* ─── Sidebar Filter ─── */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0 space-y-4`}>
          <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5 space-y-5">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-hutan)" strokeWidth="2"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
              <h3 className="font-bold text-sm text-[var(--color-tinta)]">Filter</h3>
            </div>

            {/* Kelompok Usia */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-2">Kelompok Usia</p>
              <div className="space-y-2">
                {[
                  { val: 'remaja', label: 'Remaja (< 18 th)', count: data.filter(d => hitungUsia(d.tanggal_lahir, new Date()) < 18).length },
                  { val: 'dewasa', label: 'Dewasa (18-59 th)', count: data.filter(d => { const u = hitungUsia(d.tanggal_lahir, new Date()); return u >= 18 && u < 60; }).length },
                  { val: 'lansia', label: 'Lansia (≥ 60 th)', count: data.filter(d => hitungUsia(d.tanggal_lahir, new Date()) >= 60).length },
                ].map((item) => (
                  <label key={item.val} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterUsia.includes(item.val)}
                      onChange={() => toggleFilterUsia(item.val)}
                      className="w-4 h-4 rounded border-[var(--color-garis)] text-[var(--color-hutan)] focus:ring-[var(--color-hutan)]"
                    />
                    <span className="text-sm text-[var(--color-tinta)] group-hover:text-[var(--color-hutan)]">{item.label}</span>
                    <span className="text-xs text-[var(--color-tinta-lembut)] ml-auto">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-2">Status Kesehatan</p>
              <div className="space-y-2">
                {[
                  { val: 'SEHAT', label: 'Sehat', count: data.filter(d => d.catatan === 'SEHAT').length, color: 'bg-[var(--color-hijau-ok)]' },
                  { val: 'PERLU PEMANTAUAN', label: 'Perlu Pemantauan', count: data.filter(d => d.catatan === 'PERLU PEMANTAUAN').length, color: 'bg-[var(--color-kuning-warn)]' },
                  { val: 'PERLU RUJUKAN', label: 'Perlu Rujukan', count: data.filter(d => d.catatan === 'PERLU RUJUKAN').length, color: 'bg-[var(--color-merah-risiko)]' },
                ].map((item) => (
                  <label key={item.val} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={filterStatus.includes(item.val)}
                      onChange={() => toggleFilterStatus(item.val)}
                      className="w-4 h-4 rounded border-[var(--color-garis)] text-[var(--color-hutan)] focus:ring-[var(--color-hutan)]"
                    />
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-[var(--color-tinta)] group-hover:text-[var(--color-hutan)]">{item.label}</span>
                    <span className="text-xs text-[var(--color-tinta-lembut)] ml-auto">{item.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-2">Tanggal Periksa</p>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--color-garis)] rounded-lg text-sm text-[var(--color-tinta)] focus:outline-none focus:border-[var(--color-hutan)]"
                  placeholder="Dari"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[var(--color-garis)] rounded-lg text-sm text-[var(--color-tinta)] focus:outline-none focus:border-[var(--color-hutan)]"
                  placeholder="Sampai"
                />
              </div>
            </div>

            {/* Reset */}
            {(filterUsia.length > 0 || filterStatus.length > 0 || dateFrom || dateTo) && (
              <button
                onClick={() => { setFilterUsia([]); setFilterStatus([]); setDateFrom(''); setDateTo(''); }}
                className="w-full py-2 text-sm text-[var(--color-tinta-lembut)] hover:text-[var(--color-merah-risiko)] transition-colors"
              >
                Reset Filter
              </button>
            )}
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Page title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[var(--color-tinta)]">Rekap Desa</h1>
              <p className="text-xs text-[var(--color-tinta-lembut)]">Dashboard overview data kesehatan warga</p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-lg bg-white border border-[var(--color-garis)] text-sm font-semibold text-[var(--color-tinta)] hover:border-[var(--color-hutan)] hover:text-[var(--color-hutan)] transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export CSV
            </button>
          </div>

          {/* ─── Stat Cards ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/rekap/status/all" className="bg-white rounded-xl border border-[var(--color-garis)] p-4 hover:shadow-md transition-shadow">
              <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1">Total Warga</p>
              <p className="text-3xl font-bold text-[var(--color-tinta)]">{totalWarga}</p>
            </Link>
            <Link href="/rekap/status/sehat" className="bg-white rounded-xl border border-[var(--color-hijau-ok)]/20 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-hijau-ok)]" />
                <p className="text-xs font-semibold text-[var(--color-hijau-ok)]">Sehat</p>
              </div>
              <p className="text-3xl font-bold text-[var(--color-hijau-ok)]">{sehat}</p>
            </Link>
            <Link href="/rekap/status/pemantauan" className="bg-white rounded-xl border border-[var(--color-kuning-warn)]/20 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-kuning-warn)]" />
                <p className="text-xs font-semibold text-[var(--color-kuning-warn)]">Perlu Pemantauan</p>
              </div>
              <p className="text-3xl font-bold text-[var(--color-kuning-warn)]">{perluPemantauan}</p>
            </Link>
            <Link href="/rekap/status/rujukan" className="bg-white rounded-xl border border-[var(--color-merah-risiko)]/20 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-merah-risiko)]" />
                <p className="text-xs font-semibold text-[var(--color-merah-risiko)]">Perlu Rujukan</p>
              </div>
              <p className="text-3xl font-bold text-[var(--color-merah-risiko)]">{perluRujukan}</p>
            </Link>
          </div>

          {/* ─── Charts Row ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Status Distribution - Donut */}
            <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5">
              <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-5">Distribusi Status</h2>
              <div className="flex items-center justify-center gap-8">
                <DonutChart
                  data={[
                    { value: sehat, color: 'var(--color-hijau-ok)' },
                    { value: perluPemantauan, color: 'var(--color-kuning-warn)' },
                    { value: perluRujukan, color: 'var(--color-merah-risiko)' },
                  ]}
                  total={totalWarga}
                />
                <div className="space-y-3">
                  {[
                    { label: 'Sehat', value: sehat, color: 'bg-[var(--color-hijau-ok)]', textColor: 'text-[var(--color-hijau-ok)]' },
                    { label: 'Perlu Pemantauan', value: perluPemantauan, color: 'bg-[var(--color-kuning-warn)]', textColor: 'text-[var(--color-kuning-warn)]' },
                    { label: 'Perlu Rujukan', value: perluRujukan, color: 'bg-[var(--color-merah-risiko)]', textColor: 'text-[var(--color-merah-risiko)]' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--color-tinta-lembut)]">{item.label}</span>
                        <span className={`text-lg font-bold ${item.textColor}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Age Distribution - Donut */}
            <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5">
              <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-5">Distribusi Usia</h2>
              <div className="flex items-center justify-center gap-8">
                <DonutChart
                  data={[
                    { value: remaja, color: 'var(--color-padi)' },
                    { value: dewasa, color: 'var(--color-hutan)' },
                    { value: lansia, color: 'var(--color-tinta-lembut)' },
                  ]}
                  total={totalWarga}
                />
                <div className="space-y-3">
                  {[
                    { label: 'Remaja (<18)', value: remaja, color: 'bg-[var(--color-padi)]', textColor: 'text-[var(--color-padi)]' },
                    { label: 'Dewasa (18-59)', value: dewasa, color: 'bg-[var(--color-hutan)]', textColor: 'text-[var(--color-hutan)]' },
                    { label: 'Lansia (≥60)', value: lansia, color: 'bg-[var(--color-tinta-lembut)]', textColor: 'text-[var(--color-tinta)]' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${item.color}`} />
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--color-tinta-lembut)]">{item.label}</span>
                        <span className={`text-lg font-bold ${item.textColor}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ─── Monthly Bar Chart + Risk Indicators ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-garis)] p-5">
              <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-4">Pemeriksaan per Bulan</h2>
              {monthlyData.length > 0 ? (
                <div className="flex items-end gap-3 h-44 px-2">
                  {monthlyData.map(([month, count]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[var(--color-tinta)]">{count}</span>
                      <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                        <div
                          className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[var(--color-hutan)] to-[var(--color-hutan)]/80"
                          style={{ height: `${totalWarga > 0 ? (count / maxMonthly) * 100 : 0}%`, minHeight: count > 0 ? '8px' : '0' }}
                        />
                      </div>
                      <span className="text-[11px] text-[var(--color-tinta-lembut)] font-medium">
                        {new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-tinta-lembut)] text-center py-8">Belum ada data</p>
              )}
            </div>

            {/* Risk Indicators */}
            <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5">
              <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-4">Indikator Risiko</h2>
              <div className="space-y-3">
                {[
                  { name: 'Hipertensi', count: hipertensi, color: 'bg-[var(--color-merah-risiko)]' },
                  { name: 'Diabetes', count: diabetes, color: 'bg-[var(--color-merah-risiko)]' },
                  { name: 'Kolesterol Tinggi', count: kolesterolTinggi, color: 'bg-[var(--color-kuning-warn)]' },
                  { name: 'Obesitas', count: obesitas, color: 'bg-[var(--color-kuning-warn)]' },
                ].map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[var(--color-tinta)]">{item.name}</span>
                      <span className="font-bold text-[var(--color-tinta)]">{item.count}</span>
                    </div>
                    <div className="h-2 bg-[var(--color-kertas-dalam)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: totalWarga > 0 ? `${(item.count / totalWarga) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Recent Data Table ─── */}
          <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-[var(--color-tinta)]">Data Pemeriksaan Terbaru</h2>
              <span className="text-xs text-[var(--color-tinta-lembut)]">{filtered.length} data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-garis)]">
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">NIK</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">Usia</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">JK</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">BB/TB</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">TD</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">GDS</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">Tanggal</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-[var(--color-tinta-lembut)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentData.map((d) => {
                    const usia = hitungUsia(d.tanggal_lahir, new Date());
                    const statusCfg = d.catatan === 'SEHAT'
                      ? 'text-[var(--color-hijau-ok)]'
                      : d.catatan === 'PERLU PEMANTAUAN'
                      ? 'text-[var(--color-kuning-warn)]'
                      : 'text-[var(--color-merah-risiko)]';
                    return (
                      <tr key={d.id} className="border-b border-[var(--color-garis)]/50 hover:bg-[var(--color-kertas-dalam)]/50">
                        <td className="py-2.5 px-2 text-xs font-mono">{d.nik}</td>
                        <td className="py-2.5 px-2 text-xs">{usia} th</td>
                        <td className="py-2.5 px-2 text-xs">{d.jenis_kelamin}</td>
                        <td className="py-2.5 px-2 text-xs">{d.berat_badan}/{d.tinggi_badan}</td>
                        <td className="py-2.5 px-2 text-xs">{d.td_sistol}/{d.td_diastol}</td>
                        <td className="py-2.5 px-2 text-xs">{d.gds}</td>
                        <td className="py-2.5 px-2 text-xs">{d.tanggal_periksa}</td>
                        <td className={`py-2.5 px-2 text-xs font-semibold ${statusCfg}`}>{d.catatan || '-'}</td>
                      </tr>
                    );
                  })}
                  {recentData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-[var(--color-tinta-lembut)]">Tidak ada data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Donut Chart (pure SVG) ─── */
function DonutChart({ data, total }: { data: { value: number; color: string }[]; total: number }) {
  const size = 140;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const filtered = data.filter(d => d.value > 0);
  let offset = 0;
  const segments = filtered.map((d) => {
    const pct = total > 0 ? d.value / total : 0;
    const len = pct * circumference;
    const seg = { ...d, len, offset };
    offset += len;
    return seg;
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--color-kertas-dalam)" strokeWidth={strokeWidth}
        />
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${seg.len} ${circumference - seg.len}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-[var(--color-tinta)]">{total}</p>
        <p className="text-[10px] text-[var(--color-tinta-lembut)]">total</p>
      </div>
    </div>
  );
}
