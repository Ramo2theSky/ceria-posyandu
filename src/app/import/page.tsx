'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseBarisCSV, BarisCSV } from '@/lib/csv-parser';
import { supabase } from '@/lib/supabase';

type ImportNotice = {
  kind: 'info' | 'success' | 'error';
  message: string;
};

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

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<{ data: ReturnType<typeof parseBarisCSV>['data']; error: string | null; line: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<ImportNotice | null>(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setNotice({ kind: 'info', message: `Membaca file ${file.name}...` });

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0) {
        setData([]);
        setNotice({ kind: 'error', message: 'File kosong atau tidak bisa dibaca.' });
        return;
      }

      const delimiter = detectDelimiter(lines[0]);
      const results = lines
        .map((line, i) => {
          const cleaned = line.trim();
          if (/^(Nomer|Nomor|No|NIK)\b/i.test(cleaned)) {
            return { data: null, error: null, line: i + 1 };
          }
          if (/^29\s+Juni/i.test(cleaned)) {
            return { data: null, error: null, line: i + 1 };
          }

          const values = splitCsvLine(cleaned, delimiter as ',' | ';');
          if (isEmptyCsvRow(values)) {
            return { data: null, error: null, line: i + 1 };
          }

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

          const parsed = parseBarisCSV(baris);
          return { ...parsed, line: i + 1 };
        })
        .filter((row) => row.data !== null || row.error !== null);

      setData(results);
      const validCount = results.filter((row) => row.data).length;
      const errorCount = results.filter((row) => row.error).length;

      if (validCount === 0) {
        setNotice({
          kind: 'error',
          message: `Tidak ada baris valid di ${file.name}. Periksa format NIK, TTL, dan pemisah CSV.`,
        });
      } else {
        setNotice({
          kind: 'success',
          message: `${file.name} siap diimpor: ${validCount} valid${errorCount ? `, ${errorCount} error` : ''}.`,
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setSaving(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) {
        setNotice({ kind: 'error', message: 'Sesi login tidak valid. Silakan login ulang sebelum mengimpor.' });
        return;
      }

      const { klasifikasiIMT, klasifikasiTD, klasifikasiGulaDarah, klasifikasiKolesterol, klasifikasiLP, statusKeseluruhan } = await import('@/lib/klasifikasi');

      const rows = data
        .filter((item) => item.data)
        .map((item) => {
          const d = item.data!;
          const imt = klasifikasiIMT(d.berat_badan, d.tinggi_badan);
          const td = d.td_diastol !== null ? klasifikasiTD(d.td_sistol, d.td_diastol) : { status: 'warn' as const, label: 'Data tidak lengkap', keterangan: '' };
          const gds = klasifikasiGulaDarah(d.gds, 'sewaktu');
          const kol = d.kolesterol_total !== null ? klasifikasiKolesterol(d.kolesterol_total) : null;
          const lp = klasifikasiLP(d.lingkar_pinggang, d.jenis_kelamin);
          const keseluruhan = statusKeseluruhan([imt, td, gds, kol, lp]);

          return {
            nik: d.nik,
            tanggal_lahir: d.tanggal_lahir.toISOString().split('T')[0],
            jenis_kelamin: d.jenis_kelamin,
            berat_badan: d.berat_badan,
            tinggi_badan: d.tinggi_badan,
            lingkar_pinggang: d.lingkar_pinggang,
            td_sistol: d.td_sistol,
            td_diastol: d.td_diastol ?? 0,
            gds: d.gds,
            jenis_gula_darah: 'sewaktu',
            kolesterol_total: d.kolesterol_total,
            tanggal_periksa: new Date().toISOString().split('T')[0],
            catatan: keseluruhan,
            dibuat_oleh: userId,
          };
        });

      if (rows.length === 0) {
        setNotice({ kind: 'error', message: 'Tidak ada data valid untuk diimpor.' });
        return;
      }

      const { error } = await supabase.from('pemeriksaan').insert(rows);

      if (error) {
        throw error;
      }

      setNotice({
        kind: 'success',
        message: `Berhasil mengimpor ${rows.length} data dari ${fileName || 'file CSV'}.`,
      });
      setData([]);
      setFileName('');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengimpor data.';
      setNotice({ kind: 'error', message: `Gagal mengimpor data: ${message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-kertas)]">
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm text-[var(--color-tinta-lembut)] hover:text-[var(--color-tinta)]">
          <img src="/ceria-logo.png" alt="CERIA" className="h-5" />
        </button>
        <button onClick={() => router.push('/dashboard')} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-tinta-lembut)] hover:bg-[var(--color-garis)] hover:text-[var(--color-tinta)]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <main className="px-4 pb-8 max-w-2xl mx-auto space-y-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--color-tinta)]">Import CSV</h1>
          <p className="text-xs text-[var(--color-tinta-lembut)] mt-1">Upload file CSV untuk impor data warga sekaligus</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[var(--color-garis)]">
          <p className="text-[var(--color-tinta-lembut)] text-sm mb-4">
            Upload file CSV dengan format: NIK, TTL, L/P, BB, TB, LP, TD, GDS, CL
          </p>
          {notice && (
            <div
              className={`mb-4 p-3 rounded-xl text-sm border ${notice.kind === 'success' ? 'bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)] border-[var(--color-hijau-ok)]/20' : notice.kind === 'error' ? 'bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)] border-[var(--color-merah-risiko)]/20' : 'bg-[var(--color-kertas-dalam)] text-[var(--color-tinta)] border-[var(--color-garis)]'}`}
            >
              {notice.message}
            </div>
          )}
          <input
            type="file"
            ref={fileRef}
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border border-dashed border-[var(--color-garis)] rounded-xl text-[var(--color-tinta-lembut)] text-sm hover:bg-[var(--color-kertas-dalam)] transition-colors"
          >
            Pilih File CSV
          </button>
        </div>

        {data.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-[var(--color-garis)]">
            <h2 className="font-bold text-sm text-[var(--color-tinta)] mb-3">
              {data.filter(d => d.data).length} data valid, {data.filter(d => d.error).length} error
            </h2>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {data.map((item, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-sm ${item.error ? 'bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)]' : 'bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)]'}`}
                >
                  {item.error ? `Baris ${item.line}: ${item.error}` : `Baris ${item.line}: ${item.data?.nik} - OK`}
                </div>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={saving || data.filter(d => d.data).length === 0}
              className="w-full mt-4 bg-[var(--color-hutan)] hover:bg-[var(--color-hutan-gelap)] text-white font-semibold text-sm py-3 px-6 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Mengimpor...' : `Impor ${data.filter(d => d.data).length} Data`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}