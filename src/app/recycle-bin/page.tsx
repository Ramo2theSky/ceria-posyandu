'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logActivity } from '@/lib/activity-log';
import { maskNIK } from '@/lib/formatters';

interface DeletedRecord {
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
  jenis_gula_darah: string;
  kolesterol_total: number | null;
  tanggal_periksa: string;
  catatan: string;
  dihapus_pada: string;
}

export default function RecycleBinPage() {
  const router = useRouter();
  const [data, setData] = useState<DeletedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: result, error } = await supabase
      .from('pemeriksaan')
      .select('*')
      .not('dihapus_pada', 'is', null)
      .order('dihapus_pada', { ascending: false });

    if (!error && result) {
      setData(result as DeletedRecord[]);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(d => d.nik.includes(q));
  }, [data, search]);

  async function handleRestore(id: string) {
    if (!confirm('Pulihkan data ini ke daftar utama?')) return;
    setProcessingId(id);

    const { error } = await supabase
      .from('pemeriksaan')
      .update({ dihapus_pada: null })
      .eq('id', id);

    if (!error) {
      const record = data.find(d => d.id === id);
      if (record) logActivity('restore', record.nik, `Data warga ${record.nik} dipulihkan dari recycle bin`);
      setData(data.filter(d => d.id !== id));
    } else {
      alert('Gagal memulihkan data');
    }
    setProcessingId(null);
  }

  async function handlePermanentDelete(id: string) {
    if (!confirm('HAPUS PERMANEN? Data tidak bisa dikembalikan!')) return;
    setProcessingId(id);

    const { error } = await supabase
      .from('pemeriksaan')
      .delete()
      .eq('id', id);

    if (!error) {
      const record = data.find(d => d.id === id);
      if (record) logActivity('delete', record.nik, `Data warga ${record.nik} dihapus permanen dari recycle bin`);
      setData(data.filter(d => d.id !== id));
    } else {
      alert('Gagal menghapus data');
    }
    setProcessingId(null);
  }

  async function handleEmptyBin() {
    if (!confirm(`HAPUS PERMANEN semua ${data.length} data? Tidak bisa dikembalikan!`)) return;
    setProcessingId('all');

    const ids = data.map(d => d.id);
    const { error } = await supabase
      .from('pemeriksaan')
      .delete()
      .in('id', ids);

    if (!error) {
      data.forEach(d => logActivity('delete', d.nik, `Data warga ${d.nik} dihapus permanen dari recycle bin`));
      setData([]);
    } else {
      alert('Gagal mengosongkan recycle bin');
    }
    setProcessingId(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-kertas)] flex items-center justify-center">
        <p className="text-[var(--color-tinta-lembut)]">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-kertas)]">
      {/* Header */}
      <div className="bg-[var(--color-hutan)] text-white px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-lg font-bold">Recycle Bin</h1>
              <p className="text-xs text-white/70">{data.length} data terhapus</p>
            </div>
          </div>
          {data.length > 0 && (
            <button
              onClick={handleEmptyBin}
              disabled={processingId === 'all'}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white text-xs font-bold rounded-lg disabled:opacity-50"
            >
              {processingId === 'all' ? 'Menghapus...' : 'Kosongkan Semua'}
            </button>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-4">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-sm glass"
            placeholder="Cari NIK..."
          />
        </div>

        {/* Empty state */}
        {data.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--color-hijau-ok-bg)] flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-hijau-ok)" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-[var(--color-tinta)]">Recycle Bin Kosong</h3>
            <p className="text-sm text-[var(--color-tinta-lembut)] mt-1">Tidak ada data yang terhapus</p>
          </div>
        )}

        {/* List */}
        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-[var(--color-garis)] p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-[var(--color-tinta)]">{maskNIK(d.nik)}</p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-600">
                      {d.catatan === 'SEHAT' ? 'SEHAT' : d.catatan === 'PERLU PEMANTAUAN' ? 'PEMANTAUAN' : 'RUJUKAN'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-tinta-lembut)] mt-0.5">
                    {d.tanggal_periksa} · {d.berat_badan}/{d.tinggi_badan} · {d.td_sistol}/{d.td_diastol}
                  </p>
                  <p className="text-[10px] text-red-400 mt-0.5">
                    Dihapus: {new Date(d.dihapus_pada).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleRestore(d.id)}
                    disabled={processingId === d.id}
                    className="px-3 py-2 bg-[var(--color-hijau-ok)] hover:bg-[var(--color-hijau-ok)]/80 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    Pulihkan
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(d.id)}
                    disabled={processingId === d.id}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex items-center gap-1"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search no results */}
        {search && filtered.length === 0 && data.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-tinta-lembut)]">Tidak ditemukan NIK &quot;{search}&quot;</p>
          </div>
        )}
      </main>
    </div>
  );
}
