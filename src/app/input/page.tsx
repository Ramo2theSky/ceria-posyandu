'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { hitungUsia, klasifikasiIMT, klasifikasiTD, klasifikasiGDS, klasifikasiKolesterol, klasifikasiLP, statusKeseluruhan, peringatanUsiaRemaja } from '@/lib/klasifikasi';
import { validasiNIK, validasiTanggalLahir } from '@/lib/validasi';
import { logActivity } from '@/lib/activity-log';
import { supabase } from '@/lib/supabase';

interface Identitas {
  nik: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P' | '';
  noHP: string;
  alamat: string;
}

interface Pengukuran {
  beratBadan: string;
  tinggiBadan: string;
  lingkarPinggang: string;
  tdSistol: string;
  tdDiastol: string;
  gds: string;
  kolesterol: string;
  tanggalPeriksa: string;
}

export default function InputPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [identitas, setIdentitas] = useState<Identitas>({
    nik: '',
    tanggalLahir: '',
    jenisKelamin: '',
    noHP: '',
    alamat: '',
  });
  const [pengukuran, setPengukuran] = useState<Pengukuran>({
    beratBadan: '',
    tinggiBadan: '',
    lingkarPinggang: '',
    tdSistol: '',
    tdDiastol: '',
    gds: '',
    kolesterol: '',
    tanggalPeriksa: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const usia = identitas.tanggalLahir ? hitungUsia(identitas.tanggalLahir, new Date()) : 0;
  const peringatanRemaja = usia > 0 ? peringatanUsiaRemaja(usia) : null;
  const imt = identitas.jenisKelamin && pengukuran.beratBadan && pengukuran.tinggiBadan
    ? klasifikasiIMT(parseFloat(pengukuran.beratBadan), parseFloat(pengukuran.tinggiBadan))
    : null;

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const nikError = validasiNIK(identitas.nik);
    if (nikError) newErrors.nik = nikError.message;

    const tglError = validasiTanggalLahir(identitas.tanggalLahir);
    if (tglError) newErrors.tanggalLahir = tglError.message;
    if (!identitas.jenisKelamin) newErrors.jenisKelamin = 'Pilih jenis kelamin';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const bb = parseFloat(pengukuran.beratBadan);
    const tb = parseFloat(pengukuran.tinggiBadan);
    const lp = parseFloat(pengukuran.lingkarPinggang);
    const sistol = parseInt(pengukuran.tdSistol);
    const diastol = parseInt(pengukuran.tdDiastol);
    const gds = parseInt(pengukuran.gds);

    if (isNaN(bb) || bb < 10 || bb > 300) newErrors.beratBadan = 'Berat badan tidak wajar (10-300 kg)';
    if (isNaN(tb) || tb < 50 || tb > 250) newErrors.tinggiBadan = 'Tinggi badan tidak wajar (50-250 cm)';
    if (isNaN(lp) || lp < 30 || lp > 200) newErrors.lingkarPinggang = 'Lingkar pinggang tidak wajar';
    if (isNaN(sistol) || sistol < 60 || sistol > 300) newErrors.tdSistol = 'TD sistolik tidak wajar';
    if (isNaN(diastol) || diastol < 30 || diastol > 200) newErrors.tdDiastol = 'TD diastolik tidak wajar';
    if (isNaN(gds) || gds < 40 || gds > 600) newErrors.gds = 'GDS tidak wajar (40-600 mg/dL)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getHasil = useCallback(() => {
    const bb = parseFloat(pengukuran.beratBadan);
    const tb = parseFloat(pengukuran.tinggiBadan);
    const sistol = parseInt(pengukuran.tdSistol);
    const diastol = parseInt(pengukuran.tdDiastol);
    const gds = parseInt(pengukuran.gds);
    const kol = pengukuran.kolesterol ? parseInt(pengukuran.kolesterol) : null;
    const lp = parseFloat(pengukuran.lingkarPinggang);

    const hasilIMT = klasifikasiIMT(bb, tb);
    const hasilTD = klasifikasiTD(sistol, diastol);
    const hasilGDS = klasifikasiGDS(gds);
    const hasilKol = klasifikasiKolesterol(kol);
    const hasilLP = klasifikasiLP(lp, identitas.jenisKelamin as 'L' | 'P');

    const keseluruhan = statusKeseluruhan([hasilIMT, hasilTD, hasilGDS, hasilKol, hasilLP]);

    return {
      imt: { ...hasilIMT, nilai: (bb / Math.pow(tb / 100, 2)).toFixed(1) },
      td: { ...hasilTD, nilai: `${sistol}/${diastol}` },
      gds: { ...hasilGDS, nilai: gds.toString() },
      kolesterol: hasilKol ? { ...hasilKol, nilai: kol!.toString() } : null,
      lp: { ...hasilLP, nilai: lp.toString() },
      keseluruhan,
    };
  }, [pengukuran, identitas.jenisKelamin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        alert('Sesi login tidak valid. Silakan login ulang.');
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('pemeriksaan').insert({
        nik: identitas.nik,
        tanggal_lahir: identitas.tanggalLahir,
        jenis_kelamin: identitas.jenisKelamin,
        no_telepon: identitas.noHP || null,
        alamat: identitas.alamat || null,
        berat_badan: parseFloat(pengukuran.beratBadan),
        tinggi_badan: parseFloat(pengukuran.tinggiBadan),
        lingkar_pinggang: parseFloat(pengukuran.lingkarPinggang),
        td_sistol: parseInt(pengukuran.tdSistol),
        td_diastol: parseInt(pengukuran.tdDiastol),
        gds: parseInt(pengukuran.gds),
        kolesterol_total: pengukuran.kolesterol ? parseInt(pengukuran.kolesterol) : null,
        tanggal_periksa: pengukuran.tanggalPeriksa,
        catatan: getHasil().keseluruhan,
        dibuat_oleh: authData.user.id,
      });

      if (error) throw error;

      logActivity('insert', identitas.nik, `Data warga ${identitas.nik} berhasil disimpan`);

      alert('Data tersimpan!');
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      alert(`Gagal menyimpan: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="header-gradient text-white p-4 flex justify-between items-center shadow-soft">
        <button onClick={() => router.push('/dashboard')} className="text-sm hover:opacity-80">
          ← Kembali
        </button>
        <h1 className="text-lg font-bold">Input Data Warga</h1>
        <a href="/dashboard"><img src="/ceria-logo.png" alt="CERIA" className="h-6 opacity-80" /></a>
      </header>

      <div className="p-4 flex justify-center gap-3">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              s === step
                ? 'btn-primary text-white'
                : s < step
                ? 'bg-[var(--color-hijau-ok)] text-white'
                : 'bg-[var(--color-garis)] text-[var(--color-tinta-lembut)]'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      <main className="flex-1 p-4">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--color-tinta)]">Langkah 1: Identitas Warga</h2>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">NIK</label>
              <input
                type="text"
                inputMode="numeric"
                value={identitas.nik}
                onChange={(e) => setIdentitas({ ...identitas, nik: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                placeholder="16 digit NIK"
              />
              {errors.nik && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.nik}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">Tanggal Lahir</label>
              <input
                type="date"
                value={identitas.tanggalLahir}
                onChange={(e) => setIdentitas({ ...identitas, tanggalLahir: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
              />
              {errors.tanggalLahir && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.tanggalLahir}</p>}
              {usia > 0 && (
                <p className="text-[var(--color-tinta-lembut)] text-sm mt-1">
                  Usia: {usia} tahun ({usia < 18 ? 'Remaja' : usia < 60 ? 'Dewasa' : 'Lansia'})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">Jenis Kelamin</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIdentitas({ ...identitas, jenisKelamin: 'L' })}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg border-2 ${
                    identitas.jenisKelamin === 'L'
                      ? 'btn-primary text-white border-transparent'
                      : 'glass border-[var(--color-garis)]'
                  }`}
                >
                  Laki-laki
                </button>
                <button
                  type="button"
                  onClick={() => setIdentitas({ ...identitas, jenisKelamin: 'P' })}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg border-2 ${
                    identitas.jenisKelamin === 'P'
                      ? 'btn-primary text-white border-transparent'
                      : 'glass border-[var(--color-garis)]'
                  }`}
                >
                  Perempuan
                </button>
              </div>
              {errors.jenisKelamin && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.jenisKelamin}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">No. HP (opsional)</label>
              <input
                type="tel"
                inputMode="numeric"
                value={identitas.noHP}
                onChange={(e) => setIdentitas({ ...identitas, noHP: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                placeholder="08xxx"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">Alamat</label>
              <textarea
                value={identitas.alamat}
                onChange={(e) => setIdentitas({ ...identitas, alamat: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                rows={3}
                placeholder="Alamat lengkap"
              />
            </div>

            {peringatanRemaja && (
              <div className="p-3 badge-pemantauan rounded-xl text-sm">
                {peringatanRemaja}
              </div>
            )}

            <button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="w-full btn-primary text-white font-bold py-4 px-6 rounded-xl text-lg"
            >
              Lanjut ke Pengukuran →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--color-tinta)]">Langkah 2: Pengukuran</h2>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">Tanggal Periksa</label>
              <input
                type="date"
                value={pengukuran.tanggalPeriksa}
                onChange={(e) => setPengukuran({ ...pengukuran, tanggalPeriksa: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">BB (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={pengukuran.beratBadan}
                  onChange={(e) => setPengukuran({ ...pengukuran, beratBadan: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                  placeholder="0"
                />
                {errors.beratBadan && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.beratBadan}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">TB (cm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={pengukuran.tinggiBadan}
                  onChange={(e) => setPengukuran({ ...pengukuran, tinggiBadan: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                  placeholder="0"
                />
                {errors.tinggiBadan && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.tinggiBadan}</p>}
              </div>
            </div>

            {imt && (
              <div className={`p-3 rounded-xl text-center ${imt.status === 'ok' ? 'badge-sehat' : imt.status === 'warn' ? 'badge-pemantauan' : 'badge-rujukan'}`}>
                <p className="text-sm font-bold">IMT: {(parseFloat(pengukuran.beratBadan) / Math.pow(parseFloat(pengukuran.tinggiBadan) / 100, 2)).toFixed(1)}</p>
                <p className="text-xs">{imt.label}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">Lingkar Pinggang (cm)</label>
              <input
                type="number"
                inputMode="decimal"
                value={pengukuran.lingkarPinggang}
                onChange={(e) => setPengukuran({ ...pengukuran, lingkarPinggang: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                placeholder="0"
              />
              {errors.lingkarPinggang && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.lingkarPinggang}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">TD Sistolik</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pengukuran.tdSistol}
                  onChange={(e) => setPengukuran({ ...pengukuran, tdSistol: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                  placeholder="0"
                />
                {errors.tdSistol && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.tdSistol}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">TD Diastolik</label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pengukuran.tdDiastol}
                  onChange={(e) => setPengukuran({ ...pengukuran, tdDiastol: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                  placeholder="0"
                />
                {errors.tdDiastol && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.tdDiastol}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">GDS (mg/dL)</label>
              <input
                type="number"
                inputMode="numeric"
                value={pengukuran.gds}
                onChange={(e) => setPengukuran({ ...pengukuran, gds: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                placeholder="0"
              />
              {errors.gds && <p className="text-[var(--color-merah-risiko)] text-sm mt-1">{errors.gds}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--color-tinta)] mb-2">Kolesterol Total (mg/dL) - Opsional</label>
              <input
                type="number"
                inputMode="numeric"
                value={pengukuran.kolesterol}
                onChange={(e) => setPengukuran({ ...pengukuran, kolesterol: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg focus:border-[var(--color-hutan)]"
                placeholder="Kosongkan jika tidak diperiksa"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 glass border-2 border-[var(--color-garis)] text-[var(--color-tinta)] font-bold py-4 px-6 rounded-xl text-lg"
              >
                ← Kembali
              </button>
              <button
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="flex-1 btn-primary text-white font-bold py-4 px-6 rounded-xl text-lg"
              >
                Lihat Hasil →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[var(--color-tinta)]">Langkah 3: Hasil & Simpan</h2>

            <HasilCard hasil={getHasil()} />

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 glass border-2 border-[var(--color-garis)] text-[var(--color-tinta)] font-bold py-4 px-6 rounded-xl text-lg"
              >
                ← Kembali
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-gold text-white font-bold py-4 px-6 rounded-xl text-lg disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : '💾 Simpan Data'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface HasilItem {
  label: string;
  status: string;
  keterangan: string;
  nilai: string;
}

interface HasilData {
  imt: HasilItem;
  td: HasilItem;
  gds: HasilItem;
  kolesterol: HasilItem | null;
  lp: HasilItem;
  keseluruhan: string;
}

function HasilCard({ hasil }: { hasil: HasilData }) {
  const getColor = (status: string) => {
    if (status === 'ok') return 'badge-sehat';
    if (status === 'warn') return 'badge-pemantauan';
    return 'badge-rujukan';
  };

  const getTextColor = (status: string) => {
    if (status === 'ok') return 'text-[var(--color-hijau-ok)]';
    if (status === 'warn') return 'text-[var(--color-kuning-warn)]';
    return 'text-[var(--color-merah-risiko)]';
  };

  return (
    <div className="space-y-3">
      <div className={`p-4 rounded-xl text-center border-2 ${
        hasil.keseluruhan === 'SEHAT' ? 'badge-sehat' :
        hasil.keseluruhan === 'PERLU PEMANTAUAN' ? 'badge-pemantauan' :
        'badge-rujukan'
      }`}>
        <p className={`font-bold text-2xl ${
          hasil.keseluruhan === 'SEHAT' ? 'text-[var(--color-hijau-ok)]' :
          hasil.keseluruhan === 'PERLU PEMANTAUAN' ? 'text-[var(--color-kuning-warn)]' :
          'text-[var(--color-merah-risiko)]'
        }`}>
          {hasil.keseluruhan}
        </p>
      </div>

      {[
        { name: 'IMT', data: hasil.imt },
        { name: 'Tekanan Darah', data: hasil.td },
        { name: 'GDS', data: hasil.gds },
        { name: 'Lingkar Pinggang', data: hasil.lp },
      ].map((item) => (
        <div key={item.name} className={`p-4 rounded-xl border-2 ${getColor(item.data.status)}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-[var(--color-tinta)]">{item.name}</p>
              <p className="text-sm text-[var(--color-tinta-lembut)]">{item.data.nilai}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getTextColor(item.data.status)}`}>
              {item.data.label}
            </span>
          </div>
          <p className="text-sm mt-2">{item.data.keterangan}</p>
        </div>
      ))}

      {hasil.kolesterol && (
        <div className={`p-4 rounded-xl border-2 ${getColor(hasil.kolesterol.status)}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-[var(--color-tinta)]">Kolesterol</p>
              <p className="text-sm text-[var(--color-tinta-lembut)]">{hasil.kolesterol.nilai} mg/dL</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getTextColor(hasil.kolesterol.status)}`}>
              {hasil.kolesterol.label}
            </span>
          </div>
          <p className="text-sm mt-2">{hasil.kolesterol.keterangan}</p>
        </div>
      )}

      {!hasil.kolesterol && (
        <div className="p-4 rounded-xl border-2 border-[var(--color-garis)] bg-[var(--color-kertas-dalam)]">
          <p className="text-[var(--color-tinta-lembut)] text-center">Kolesterol: Tidak Diperiksa</p>
        </div>
      )}
    </div>
  );
}