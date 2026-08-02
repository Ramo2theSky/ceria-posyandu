'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hitungUsia, klasifikasiIMT, klasifikasiTD, klasifikasiGulaDarah, klasifikasiKolesterol, klasifikasiLP, type JenisGulaDarah } from '@/lib/klasifikasi';
import { maskNIK } from '@/lib/formatters';
import { supabase } from '@/lib/supabase';
import { cekNIK, type RiwayatPemeriksaan } from '@/lib/riwayat';
import RiwayatModal from '@/components/RiwayatModal';
import AppShell from '@/components/AppShell';

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
  jenis_gula_darah: JenisGulaDarah;
  kolesterol_total: number | null;
  tanggal_periksa: string;
  catatan: string;
}

const STATUS_LABELS: Record<string, string> = {
  'SEHAT': 'Sehat',
  'PERLU PEMANTAUAN': 'Perlu Pemantauan',
  'PERLU RUJUKAN': 'Perlu Rujukan',
};

export default function RekapPage() {
  const router = useRouter();
  const [data, setData] = useState<Pemeriksaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterUsia, setFilterUsia] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riwayatData, setRiwayatData] = useState<RiwayatPemeriksaan[] | null>(null);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleShowRiwayat = useCallback(async (nik: string) => {
    setLoadingRiwayat(true);
    try {
      const result = await cekNIK(nik);
      if (result.riwayat.length > 0) {
        setRiwayatData(result.riwayat);
      }
    } catch {
      console.error('Gagal memuat riwayat');
    } finally {
      setLoadingRiwayat(false);
    }
  }, []);

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

  const statusFiltered = useMemo(() => {
    if (!activeStatus) return [];
    return filtered.filter(d => d.catatan === activeStatus);
  }, [filtered, activeStatus]);

  const searchedStatusData = useMemo(() => {
    if (!searchQuery) return statusFiltered;
    const q = searchQuery.toLowerCase();
    return statusFiltered.filter(d => d.nik.includes(q) || (d.alamat && d.alamat.toLowerCase().includes(q)));
  }, [statusFiltered, searchQuery]);

  const totalWarga = filtered.length;
  const sehat = filtered.filter(d => d.catatan === 'SEHAT').length;
  const perluPemantauan = filtered.filter(d => d.catatan === 'PERLU PEMANTAUAN').length;
  const perluRujukan = filtered.filter(d => d.catatan === 'PERLU RUJUKAN').length;

  const remaja = filtered.filter(d => hitungUsia(d.tanggal_lahir, new Date()) < 18).length;
  const dewasa = filtered.filter(d => { const u = hitungUsia(d.tanggal_lahir, new Date()); return u >= 18 && u < 60; }).length;
  const lansia = filtered.filter(d => hitungUsia(d.tanggal_lahir, new Date()) >= 60).length;

  const hipertensi = filtered.filter(d => d.td_sistol >= 140 || d.td_diastol >= 90).length;
  const diabetes = filtered.filter(d => {
    const jenis = d.jenis_gula_darah || 'sewaktu';
    return klasifikasiGulaDarah(d.gds, jenis).status === 'risk';
  }).length;
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
    const headers = ['NIK', 'Tanggal Lahir', 'Jenis Kelamin', 'No. Telepon', 'Alamat', 'BB', 'TB', 'LP', 'TD Sistol', 'TD Diastol', 'Gula Darah', 'Jenis GDP/GDS', 'Kolesterol', 'Tanggal Periksa', 'Status'];
    const rows = filtered.map(d => [
      `'${d.nik}'`, d.tanggal_lahir, d.jenis_kelamin, d.no_telepon || '-', d.alamat || '-',
      d.berat_badan, d.tinggi_badan, d.lingkar_pinggang, d.td_sistol, d.td_diastol,
      d.gds, d.jenis_gula_darah === 'puasa' ? 'GDP' : 'GDS', d.kolesterol_total || '-', d.tanggal_periksa, d.catatan || '-',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-desa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportPDF = async () => {
    if (exportingPDF) return;
    setExportingPDF(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, H = 297;
      const mx = 15;
      let y = 20;

      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };
      const cHijau = [31, 78, 74] as const;
      const cKuning = [217, 162, 59] as const;
      const cMerah = [185, 60, 55] as const;
      const cPadi = [217, 162, 59] as const;

      const drawDonut = (cx: number, cy: number, r: number, segments: { pct: number; color: number[] }[], label: string, value: number) => {
        const sw = 6;
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(sw);
        pdf.circle(cx, cy, r, 'S');
        let cumPct = 0;
        for (const seg of segments) {
          if (seg.pct <= 0) continue;
          const startAngle = (cumPct * 360 - 90) * (Math.PI / 180);
          const endAngle = ((cumPct + seg.pct) * 360 - 90) * (Math.PI / 180);
          pdf.setDrawColor(seg.color[0], seg.color[1], seg.color[2]);
          pdf.setLineWidth(sw);
          const steps = Math.max(Math.ceil(seg.pct * 60), 4);
          for (let s = 0; s < steps; s++) {
            const a1 = startAngle + (endAngle - startAngle) * (s / steps);
            const a2 = startAngle + (endAngle - startAngle) * ((s + 1) / steps);
            pdf.line(
              cx + r * Math.cos(a1), cy + r * Math.sin(a1),
              cx + r * Math.cos(a2), cy + r * Math.sin(a2)
            );
          }
          cumPct += seg.pct;
        }
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(value), cx, cy - 1, { align: 'center' });
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120);
        pdf.text(label, cx, cy + 4, { align: 'center' });
        pdf.setTextColor(0);
      };

      const drawBar = (bx: number, by: number, bw: number, bh: number, pct: number, color: number[]) => {
        pdf.setFillColor(240, 240, 240);
        pdf.roundedRect(bx, by, bw, bh, 1, 1, 'F');
        if (pct > 0) {
          pdf.setFillColor(color[0], color[1], color[2]);
          pdf.roundedRect(bx, by + bh * (1 - pct), bw, bh * pct, 1, 1, 'F');
        }
      };

      const drawCard = (cx: number, cy: number, cw: number, ch: number, title: string, value: string, color: number[]) => {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(220, 220, 220);
        pdf.roundedRect(cx, cy, cw, ch, 3, 3, 'FD');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(120);
        pdf.text(title, cx + 4, cy + 6);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(color[0], color[1], color[2]);
        pdf.text(value, cx + 4, cy + 16);
        pdf.setTextColor(0);
      };

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Rekap Desa', mx, y);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120);
      pdf.text(`Dashboard data kesehatan · ${totalWarga} warga · ${new Date().toLocaleDateString('id-ID')}`, mx, y + 6);
      pdf.setTextColor(0);
      y += 16;

      const cardW = (W - mx * 2 - 9) / 4;
      const cardH = 20;
      drawCard(mx, y, cardW, cardH, 'Total Warga', String(totalWarga), [40, 40, 40]);
      drawCard(mx + (cardW + 3), y, cardW, cardH, 'Sehat', String(sehat), [...cHijau]);
      drawCard(mx + (cardW + 3) * 2, y, cardW, cardH, 'Perlu Pemantauan', String(perluPemantauan), [...cKuning]);
      drawCard(mx + (cardW + 3) * 3, y, cardW, cardH, 'Perlu Rujukan', String(perluRujukan), [...cMerah]);
      y += cardH + 12;

      const donutR = 22;
      const donutCX1 = mx + 35;
      const donutCX2 = W / 2 + 35;
      const donutCY = y + 25;
      const statusSegs = [
        { pct: totalWarga > 0 ? sehat / totalWarga : 0, color: [...cHijau] },
        { pct: totalWarga > 0 ? perluPemantauan / totalWarga : 0, color: [...cKuning] },
        { pct: totalWarga > 0 ? perluRujukan / totalWarga : 0, color: [...cMerah] },
      ];
      const usiaSegs = [
        { pct: totalWarga > 0 ? remaja / totalWarga : 0, color: [...cPadi] },
        { pct: totalWarga > 0 ? dewasa / totalWarga : 0, color: [...cHijau] },
        { pct: totalWarga > 0 ? lansia / totalWarga : 0, color: [130, 130, 130] },
      ];
      drawDonut(donutCX1, donutCY, donutR, statusSegs, 'total', totalWarga);
      drawDonut(donutCX2, donutCY, donutR, usiaSegs, 'total', totalWarga);

      const legendX1 = donutCX1 + donutR + 10;
      const legendX2 = donutCX2 + donutR + 10;
      const legendItems1 = [
        { label: 'Sehat', value: sehat, color: [...cHijau] },
        { label: 'Perlu Pemantauan', value: perluPemantauan, color: [...cKuning] },
        { label: 'Perlu Rujukan', value: perluRujukan, color: [...cMerah] },
      ];
      const legendItems2 = [
        { label: 'Remaja (<18)', value: remaja, color: [...cPadi] },
        { label: 'Dewasa (18-59)', value: dewasa, color: [...cHijau] },
        { label: 'Lansia (>=60)', value: lansia, color: [130, 130, 130] },
      ];
      legendItems1.forEach((item, i) => {
        const ly = donutCY - 12 + i * 10;
        pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
        pdf.circle(legendX1, ly, 1.5, 'F');
        pdf.setFontSize(7);
        pdf.setTextColor(100);
        pdf.text(item.label, legendX1 + 4, ly + 0.8);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(40);
        pdf.text(String(item.value), legendX1 + 4, ly + 5);
        pdf.setFont('helvetica', 'normal');
      });
      legendItems2.forEach((item, i) => {
        const ly = donutCY - 12 + i * 10;
        pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
        pdf.circle(legendX2, ly, 1.5, 'F');
        pdf.setFontSize(7);
        pdf.setTextColor(100);
        pdf.text(item.label, legendX2 + 4, ly + 0.8);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(40);
        pdf.text(String(item.value), legendX2 + 4, ly + 5);
        pdf.setFont('helvetica', 'normal');
      });
      pdf.setTextColor(0);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Distribusi Status', mx, y - 2);
      pdf.text('Distribusi Usia', W / 2, y - 2);
      pdf.setFont('helvetica', 'normal');
      y += 65;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Pemeriksaan per Bulan', mx, y);
      y += 6;
      if (monthlyData.length > 0) {
        const barAreaW = W - mx * 2;
        const barW = Math.min(16, (barAreaW - (monthlyData.length - 1) * 4) / monthlyData.length);
        const barH = 35;
        monthlyData.forEach(([month, count], i) => {
          const bx = mx + i * (barW + 4);
          const pct = maxMonthly > 0 ? count / maxMonthly : 0;
          const bh = Math.max(pct * barH, 1);
          pdf.setFillColor(31, 78, 74);
          pdf.roundedRect(bx, y + barH - bh, barW, bh, 1, 1, 'F');
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(40);
          pdf.text(String(count), bx + barW / 2, y + barH - bh - 2, { align: 'center' });
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(6);
          pdf.setTextColor(120);
          const monthLabel = new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short' });
          pdf.text(monthLabel, bx + barW / 2, y + barH + 4, { align: 'center' });
        });
        y += barH + 12;
      } else {
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text('Belum ada data', mx + 40, y + 15);
        pdf.setTextColor(0);
        y += 30;
      }

      const riskItems = [
        { name: 'Hipertensi', count: hipertensi, color: [...cMerah] },
        { name: 'Diabetes', count: diabetes, color: [...cMerah] },
        { name: 'Kolesterol Tinggi', count: kolesterolTinggi, color: [...cKuning] },
        { name: 'Obesitas', count: obesitas, color: [...cKuning] },
      ];
      const riskBarW = 80;
      riskItems.forEach((item, i) => {
        const ry = y + i * 10;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(40);
        pdf.text(item.name, mx, ry + 3);
        pdf.setFont('helvetica', 'bold');
        pdf.text(String(item.count), mx + riskBarW + 20, ry + 3);
        drawBar(mx + riskBarW + 30, ry, 50, 5, totalWarga > 0 ? item.count / totalWarga : 0, item.color);
      });
      pdf.setTextColor(0);
      y += riskItems.length * 10 + 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Data Pemeriksaan Terbaru', mx, y);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120);
      pdf.text(`${filtered.length} data`, W - mx, y, { align: 'right' });
      pdf.setTextColor(0);
      y += 6;

      const cols = ['NIK', 'Usia', 'JK', 'BB/TB', 'TD', 'GDS', 'Tanggal', 'Status'];
      const colW = [30, 12, 10, 18, 20, 14, 22, 24];
      let colX = mx;
      pdf.setFillColor(245, 245, 240);
      pdf.rect(mx, y, W - mx * 2, 6, 'F');
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      cols.forEach((col, i) => {
        pdf.text(col, colX + 1, y + 4);
        colX += colW[i];
      });
      y += 6;
      pdf.setFont('helvetica', 'normal');

      for (const d of recentData) {
        if (y > H - 20) { pdf.addPage(); y = 20; }
        const usia = hitungUsia(d.tanggal_lahir, new Date());
        const row = [d.nik, `${usia} th`, d.jenis_kelamin, `${d.berat_badan}/${d.tinggi_badan}`, `${d.td_sistol}/${d.td_diastol}`, `${d.gds}`, d.tanggal_periksa, d.catatan || '-'];
        colX = mx;
        pdf.setFontSize(6);
        pdf.setTextColor(40);
        row.forEach((cell, i) => {
          if (i === 7) {
            pdf.setFont('helvetica', 'bold');
            if (cell === 'SEHAT') pdf.setTextColor(31, 78, 74);
            else if (cell === 'PERLU PEMANTAUAN') pdf.setTextColor(180, 140, 30);
            else if (cell === 'PERLU RUJUKAN') pdf.setTextColor(185, 60, 55);
          }
          pdf.text(String(cell).substring(0, 18), colX + 1, y + 3.5);
          if (i === 7) pdf.setFont('helvetica', 'normal');
          colX += colW[i];
        });
        pdf.setTextColor(0);
        pdf.setDrawColor(230, 230, 230);
        pdf.line(mx, y + 5, W - mx, y + 5);
        y += 5.5;
      }

      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, mx, H - 10);

      pdf.save(`rekap-desa-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setExportingPDF(false);
    }
  };

  const toggleFilterUsia = (val: string) => {
    setFilterUsia(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  const toggleFilterStatus = (val: string) => {
    setFilterStatus(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="min-h-[calc(100vh-52px)] md:min-h-screen flex items-center justify-center">
          <p className="text-[var(--color-tinta-lembut)]">Memuat data...</p>
        </div>
      </AppShell>
    );
  }

  /* ─── STATUS DETAIL VIEW ─── */
  if (activeStatus) {
    const statusColor = activeStatus === 'SEHAT' ? 'var(--color-hijau-ok)' : activeStatus === 'PERLU PEMANTAUAN' ? 'var(--color-kuning-warn)' : 'var(--color-merah-risiko)';
    const statusLabel = STATUS_LABELS[activeStatus] || activeStatus;

    return (
      <AppShell>
      <div className="min-h-[calc(100vh-52px)] md:min-h-screen bg-[var(--color-kertas)]">
        <div className="px-4 py-4">
          <button onClick={() => { setActiveStatus(null); setExpandedId(null); setSearchQuery(''); }} className="flex items-center gap-2 text-sm text-[var(--color-tinta-lembut)] hover:text-[var(--color-tinta)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span className="font-semibold">Kembali ke Rekap</span>
          </button>
        </div>

        <div className="px-4 pb-8 max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
              <h1 className="text-xl font-bold text-[var(--color-tinta)]">{statusLabel}</h1>
            </div>
            <p className="text-xs text-[var(--color-tinta-lembut)] ml-6">{searchedStatusData.length} warga</p>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIK atau alamat..."
              className="w-full px-4 py-2.5 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all"
            />
          </div>

          {searchedStatusData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-8 text-center">
              <p className="text-sm text-[var(--color-tinta-lembut)]">
                {searchQuery ? 'Tidak ada data yang cocok.' : 'Tidak ada data untuk status ini.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchedStatusData.map((d) => (
                <WargaCard key={d.id} data={d} expandedId={expandedId} setExpandedId={setExpandedId} statusColor={statusColor} onShowRiwayat={handleShowRiwayat} />
              ))}
            </div>
          )}
        </div>

        {/* Riwayat Modal */}
        {riwayatData && riwayatData.length > 0 && (
          <RiwayatModal riwayat={riwayatData} onClose={() => setRiwayatData(null)} />
        )}
        {loadingRiwayat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl px-6 py-4 shadow-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[var(--color-hutan)] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-[var(--color-tinta)]">Memuat riwayat...</span>
            </div>
          </div>
        )}
      </div>
      </AppShell>
    );
  }

  /* ─── MAIN REKAP VIEW ─── */
  return (
    <AppShell>
    <div className="min-h-[calc(100vh-52px)] md:min-h-screen bg-[var(--color-kertas)]">
      <div className="px-4 py-6 pb-20 max-w-[1400px] mx-auto">
        {/* ─── Filter Toggle (mobile) ─── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-tinta)]">Rekap Desa</h1>
            <p className="text-xs text-[var(--color-tinta-lembut)]">Dashboard overview data kesehatan warga</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[var(--color-garis)] text-sm font-medium text-[var(--color-tinta)] hover:border-[var(--color-hutan)] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
              Filter
            </button>
            <button onClick={handleExportCSV} className="px-3 py-2 rounded-lg bg-white border border-[var(--color-garis)] text-sm font-semibold text-[var(--color-tinta)] hover:border-[var(--color-hutan)] hover:text-[var(--color-hutan)] transition-colors flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              CSV
            </button>
            <button onClick={handleExportPDF} disabled={exportingPDF} className="px-3 py-2 rounded-lg bg-white border border-[var(--color-garis)] text-sm font-semibold text-[var(--color-tinta)] hover:border-[var(--color-padi)] hover:text-[var(--color-padi)] transition-colors flex items-center gap-2 disabled:opacity-60">
              {exportingPDF ? (
                <span className="w-3.5 h-3.5 border-2 border-[var(--color-tinta)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              )}
              {exportingPDF ? 'Membuat PDF...' : 'PDF'}
            </button>
          </div>
        </div>

        {/* ─── Filter Panel (collapsible) ─── */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5 mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-hutan)" strokeWidth="2"><path d="M3 6h18M7 12h10M10 18h4"/></svg>
                <h3 className="font-bold text-sm text-[var(--color-tinta)]">Filter</h3>
              </div>
              <button onClick={() => setShowFilters(false)} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-tinta-lembut)] hover:bg-[var(--color-garis)]">
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-2">Kelompok Usia</p>
                <div className="space-y-2">
                  {[
                    { val: 'remaja', label: 'Remaja (< 18 th)', count: data.filter(d => hitungUsia(d.tanggal_lahir, new Date()) < 18).length },
                    { val: 'dewasa', label: 'Dewasa (18-59 th)', count: data.filter(d => { const u = hitungUsia(d.tanggal_lahir, new Date()); return u >= 18 && u < 60; }).length },
                    { val: 'lansia', label: 'Lansia (≥ 60 th)', count: data.filter(d => hitungUsia(d.tanggal_lahir, new Date()) >= 60).length },
                  ].map((item) => (
                    <label key={item.val} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={filterUsia.includes(item.val)} onChange={() => toggleFilterUsia(item.val)} className="w-4 h-4 rounded border-[var(--color-garis)] text-[var(--color-hutan)] focus:ring-[var(--color-hutan)]" />
                      <span className="text-sm text-[var(--color-tinta)] group-hover:text-[var(--color-hutan)]">{item.label}</span>
                      <span className="text-xs text-[var(--color-tinta-lembut)] ml-auto">{item.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-2">Status Kesehatan</p>
                <div className="space-y-2">
                  {[
                    { val: 'SEHAT', label: 'Sehat', count: data.filter(d => d.catatan === 'SEHAT').length, color: 'bg-[var(--color-hijau-ok)]' },
                    { val: 'PERLU PEMANTAUAN', label: 'Perlu Pemantauan', count: data.filter(d => d.catatan === 'PERLU PEMANTAUAN').length, color: 'bg-[var(--color-kuning-warn)]' },
                    { val: 'PERLU RUJUKAN', label: 'Perlu Rujukan', count: data.filter(d => d.catatan === 'PERLU RUJUKAN').length, color: 'bg-[var(--color-merah-risiko)]' },
                  ].map((item) => (
                    <label key={item.val} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={filterStatus.includes(item.val)} onChange={() => toggleFilterStatus(item.val)} className="w-4 h-4 rounded border-[var(--color-garis)] text-[var(--color-hutan)] focus:ring-[var(--color-hutan)]" />
                      <span className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-[var(--color-tinta)] group-hover:text-[var(--color-hutan)]">{item.label}</span>
                      <span className="text-xs text-[var(--color-tinta-lembut)] ml-auto">{item.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-2">Tanggal Periksa</p>
                <div className="space-y-2">
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--color-garis)] rounded-lg text-sm text-[var(--color-tinta)] focus:outline-none focus:border-[var(--color-hutan)]" />
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 bg-white border border-[var(--color-garis)] rounded-lg text-sm text-[var(--color-tinta)] focus:outline-none focus:border-[var(--color-hutan)]" />
                </div>
              </div>
            </div>

            {(filterUsia.length > 0 || filterStatus.length > 0 || dateFrom || dateTo) && (
              <button onClick={() => { setFilterUsia([]); setFilterStatus([]); setDateFrom(''); setDateTo(''); }} className="w-full py-2 text-sm text-[var(--color-tinta-lembut)] hover:text-[var(--color-merah-risiko)] transition-colors">
                Reset Filter
              </button>
            )}
          </div>
        )}
        <main className="space-y-5">
          {/* ─── Stat Cards (clickable) ─── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button onClick={() => setActiveStatus('all')} className="bg-white rounded-xl border border-[var(--color-garis)] p-4 hover:shadow-md transition-shadow text-left">
              <p className="text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1">Total Warga</p>
              <p className="text-3xl font-bold text-[var(--color-tinta)]">{totalWarga}</p>
            </button>
            <button onClick={() => setActiveStatus('SEHAT')} className="bg-white rounded-xl border border-[var(--color-hijau-ok)]/20 p-4 hover:shadow-md transition-shadow text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-hijau-ok)]" />
                <p className="text-xs font-semibold text-[var(--color-hijau-ok)]">Sehat</p>
              </div>
              <p className="text-3xl font-bold text-[var(--color-hijau-ok)]">{sehat}</p>
            </button>
            <button onClick={() => setActiveStatus('PERLU PEMANTAUAN')} className="bg-white rounded-xl border border-[var(--color-kuning-warn)]/20 p-4 hover:shadow-md transition-shadow text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-kuning-warn)]" />
                <p className="text-xs font-semibold text-[var(--color-kuning-warn)]">Perlu Pemantauan</p>
              </div>
              <p className="text-3xl font-bold text-[var(--color-kuning-warn)]">{perluPemantauan}</p>
            </button>
            <button onClick={() => setActiveStatus('PERLU RUJUKAN')} className="bg-white rounded-xl border border-[var(--color-merah-risiko)]/20 p-4 hover:shadow-md transition-shadow text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-merah-risiko)]" />
                <p className="text-xs font-semibold text-[var(--color-merah-risiko)]">Perlu Rujukan</p>
              </div>
              <p className="text-3xl font-bold text-[var(--color-merah-risiko)]">{perluRujukan}</p>
            </button>
          </div>

          {/* ─── Charts ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5">
              <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-5">Distribusi Status</h2>
              <div className="flex items-center justify-center gap-8">
                <DonutChart data={[{ value: sehat, color: 'var(--color-hijau-ok)' }, { value: perluPemantauan, color: 'var(--color-kuning-warn)' }, { value: perluRujukan, color: 'var(--color-merah-risiko)' }]} total={totalWarga} />
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

            <div className="bg-white rounded-2xl border border-[var(--color-garis)] p-5">
              <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-5">Distribusi Usia</h2>
              <div className="flex items-center justify-center gap-8">
                <DonutChart data={[{ value: remaja, color: 'var(--color-padi)' }, { value: dewasa, color: 'var(--color-hutan)' }, { value: lansia, color: 'var(--color-tinta-lembut)' }]} total={totalWarga} />
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

          {/* ─── Monthly + Risk ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-garis)] p-5">
              <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-4">Pemeriksaan per Bulan</h2>
              {monthlyData.length > 0 ? (
                <div className="flex items-end gap-3 h-44 px-2">
                  {monthlyData.map(([month, count]) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[var(--color-tinta)]">{count}</span>
                      <div className="w-full flex items-end justify-center" style={{ height: '120px' }}>
                        <div className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[var(--color-hutan)] to-[var(--color-hutan)]/80" style={{ height: `${totalWarga > 0 ? (count / maxMonthly) * 100 : 0}%`, minHeight: count > 0 ? '8px' : '0' }} />
                      </div>
                      <span className="text-[11px] text-[var(--color-tinta-lembut)] font-medium">{new Date(month + '-01').toLocaleDateString('id-ID', { month: 'short' })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-tinta-lembut)] text-center py-8">Belum ada data</p>
              )}
            </div>

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
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: totalWarga > 0 ? `${(item.count / totalWarga) * 100}%` : '0%' }} />
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
                    const statusCfg = d.catatan === 'SEHAT' ? 'text-[var(--color-hijau-ok)]' : d.catatan === 'PERLU PEMANTAUAN' ? 'text-[var(--color-kuning-warn)]' : 'text-[var(--color-merah-risiko)]';
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
                    <tr><td colSpan={8} className="py-8 text-center text-xs text-[var(--color-tinta-lembut)]">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
    </AppShell>
  );
}

/* ─── Warga Card ─── */
function WargaCard({ data: d, expandedId, setExpandedId, statusColor, onShowRiwayat }: { data: Pemeriksaan; expandedId: string | null; setExpandedId: (id: string | null) => void; statusColor: string; onShowRiwayat?: (nik: string) => void }) {
  const usia = hitungUsia(d.tanggal_lahir, new Date());
  const isExpanded = expandedId === d.id;
  const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
  const td = klasifikasiTD(d.td_sistol, d.td_diastol);
  const jenisGD = d.jenis_gula_darah || 'sewaktu';
  const gds = klasifikasiGulaDarah(d.gds, jenisGD);
  const kol = klasifikasiKolesterol(d.kolesterol_total);
  const lp = klasifikasiLP(d.lingkar_pinggang, d.jenis_kelamin);

  const badgeClass = (s: string) => s === 'ok' ? 'bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)]' : s === 'warn' ? 'bg-[var(--color-kuning-warn-bg)] text-[var(--color-kuning-warn)]' : 'bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)]';

  return (
    <div className="bg-white rounded-xl border border-[var(--color-garis)] overflow-hidden transition-shadow hover:shadow-md">
      <button onClick={() => setExpandedId(isExpanded ? null : d.id)} className="w-full p-4 text-left flex items-center gap-3">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[var(--color-tinta)]">{maskNIK(d.nik)}</p>
          <p className="text-xs text-[var(--color-tinta-lembut)] mt-0.5">{usia} tahun · {d.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · {d.tanggal_periksa}</p>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-tinta-lembut)" strokeWidth="2" className={`shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--color-garis)]/50">
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[{ label: 'BB', value: `${d.berat_badan} kg` }, { label: 'TB', value: `${d.tinggi_badan} cm` }, { label: 'LP', value: `${d.lingkar_pinggang} cm` }, { label: 'IMT', value: (d.berat_badan / Math.pow(d.tinggi_badan / 100, 2)).toFixed(1) }].map((item) => (
              <div key={item.label} className="text-center p-2 bg-[var(--color-kertas-dalam)] rounded-lg">
                <p className="text-[10px] text-[var(--color-tinta-lembut)]">{item.label}</p>
                <p className="text-xs font-bold text-[var(--color-tinta)]">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {[{ label: 'IMT', data: imt }, { label: 'TD', data: td }, { label: jenisGD === 'puasa' ? 'GDP' : 'GDS', data: gds }, ...(kol ? [{ label: 'KOL', data: kol }] : []), { label: 'LP', data: lp }].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeClass(item.data.status)}`}>{item.label}</span>
                <span className={`font-semibold ${item.data.status === 'ok' ? 'text-[var(--color-hijau-ok)]' : item.data.status === 'warn' ? 'text-[var(--color-kuning-warn)]' : 'text-[var(--color-merah-risiko)]'}`}>{item.data.label}</span>
                {item.data.keterangan && <span className="text-[var(--color-tinta-lembut)]">— {item.data.keterangan}</span>}
              </div>
            ))}
          </div>
          {onShowRiwayat && (
            <button
              onClick={(e) => { e.stopPropagation(); onShowRiwayat(d.nik); }}
              className="w-full py-2 rounded-lg bg-[var(--color-padi)]/10 border border-[var(--color-padi)]/30 text-[var(--color-padi)] text-xs font-semibold hover:bg-[var(--color-padi)]/20 transition-colors flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
              Lihat Riwayat
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Donut Chart ─── */
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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-kertas-dalam)" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={`${seg.len} ${circumference - seg.len}`} strokeDashoffset={-seg.offset} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-[var(--color-tinta)]">{total}</p>
        <p className="text-[10px] text-[var(--color-tinta-lembut)]">total</p>
      </div>
    </div>
  );
}
