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

const stepTitles = ['Identitas Warga', 'Pengukuran', 'Hasil & Simpan'];
const stepSubtitles = [
  'Isi data identitas warga. Hanya perlu NIK dan data diri.',
  'Masukkan hasil pengukuran hari ini.',
  'Periksa hasil screening sebelum disimpan.',
];

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
    <div className="min-h-screen bg-[var(--color-kertas)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm text-[var(--color-tinta-lembut)] hover:text-[var(--color-tinta)]">
          <img src="/ceria-logo.png" alt="CERIA" className="h-5" />
          <span className="font-semibold hidden sm:inline">CERIA</span>
        </button>
        <button onClick={() => router.push('/dashboard')} className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-tinta-lembut)] hover:bg-[var(--color-garis)] hover:text-[var(--color-tinta)]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center px-8 pb-6">
        <div className="flex items-center gap-0 w-full max-w-xs">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? 'bg-[var(--color-hutan)] scale-125'
                      : s < step
                      ? 'bg-[var(--color-padi)]'
                      : 'bg-[var(--color-garis)]'
                  }`}
                />
              </div>
              {s < 3 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                  s < step ? 'bg-[var(--color-padi)]' : 'bg-[var(--color-garis)]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 pb-8 flex justify-center">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-tinta)]">
              {stepTitles[step - 1]}
            </h1>
            <p className="text-sm text-[var(--color-tinta-lembut)] mt-1">
              {stepSubtitles[step - 1]}
            </p>
          </div>

          {/* Step 1: Identitas */}
          {step === 1 && (
            <div className="space-y-5">
              {/* NIK */}
              <InputField
                label="NIK"
                hint="16 digit NIK"
                value={identitas.nik}
                onChange={(v) => setIdentitas({ ...identitas, nik: v.replace(/\D/g, '').slice(0, 16) })}
                error={errors.nik}
                inputMode="numeric"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6"/></svg>
                }
              />

              {/* Tanggal Lahir + JK */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <InputField
                    label="Tanggal Lahir"
                    type="date"
                    value={identitas.tanggalLahir}
                    onChange={(v) => setIdentitas({ ...identitas, tanggalLahir: v })}
                    error={errors.tanggalLahir}
                  />
                  {usia > 0 && (
                    <p className="text-xs text-[var(--color-tinta-lembut)] mt-1 ml-1">
                      Usia {usia} th · {usia < 18 ? 'Remaja' : usia < 60 ? 'Dewasa' : 'Lansia'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1.5 ml-1">Jenis Kelamin</label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIdentitas({ ...identitas, jenisKelamin: 'L' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        identitas.jenisKelamin === 'L'
                          ? 'bg-[var(--color-hutan)] text-white border-[var(--color-hutan)]'
                          : 'bg-white text-[var(--color-tinta)] border-[var(--color-garis)] hover:border-[var(--color-hutan)]'
                      }`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdentitas({ ...identitas, jenisKelamin: 'P' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        identitas.jenisKelamin === 'P'
                          ? 'bg-[var(--color-hutan)] text-white border-[var(--color-hutan)]'
                          : 'bg-white text-[var(--color-tinta)] border-[var(--color-garis)] hover:border-[var(--color-hutan)]'
                      }`}
                    >
                      P
                    </button>
                  </div>
                  {errors.jenisKelamin && <p className="text-[var(--color-merah-risiko)] text-xs mt-1">{errors.jenisKelamin}</p>}
                </div>
              </div>

              {/* No HP */}
              <InputField
                label="No. HP"
                hint="Opsional"
                value={identitas.noHP}
                onChange={(v) => setIdentitas({ ...identitas, noHP: v })}
                inputMode="numeric"
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/></svg>
                }
              />

              {/* Alamat */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1.5 ml-1">Alamat</label>
                <textarea
                  value={identitas.alamat}
                  onChange={(e) => setIdentitas({ ...identitas, alamat: e.target.value })}
                  rows={2}
                  placeholder="Alamat lengkap"
                  className="w-full px-4 py-3 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all resize-none"
                />
              </div>

              {peringatanRemaja && (
                <div className="px-4 py-3 rounded-xl bg-[var(--color-kuning-warn-bg)] border border-[var(--color-kuning-warn)]/20 text-sm text-[var(--color-kuning-warn)]">
                  {peringatanRemaja}
                </div>
              )}

              <button
                onClick={() => { if (validateStep1()) setStep(2); }}
                className="w-full py-3.5 rounded-xl bg-[var(--color-hutan)] text-white font-semibold text-sm hover:bg-[var(--color-hutan-gelap)] transition-colors flex items-center justify-center gap-2 mt-2"
              >
                Lanjut
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {/* Step 2: Pengukuran */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Tanggal Periksa */}
              <InputField
                label="Tanggal Periksa"
                type="date"
                value={pengukuran.tanggalPeriksa}
                onChange={(v) => setPengukuran({ ...pengukuran, tanggalPeriksa: v })}
              />

              {/* BB & TB */}
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Berat Badan"
                  hint="kg"
                  type="number"
                  value={pengukuran.beratBadan}
                  onChange={(v) => setPengukuran({ ...pengukuran, beratBadan: v })}
                  error={errors.beratBadan}
                  inputMode="decimal"
                />
                <InputField
                  label="Tinggi Badan"
                  hint="cm"
                  type="number"
                  value={pengukuran.tinggiBadan}
                  onChange={(v) => setPengukuran({ ...pengukuran, tinggiBadan: v })}
                  error={errors.tinggiBadan}
                  inputMode="decimal"
                />
              </div>

              {/* IMT badge */}
              {imt && (
                <div className={`px-4 py-3 rounded-xl text-sm ${
                  imt.status === 'ok' ? 'bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)]' :
                  imt.status === 'warn' ? 'bg-[var(--color-kuning-warn-bg)] text-[var(--color-kuning-warn)]' :
                  'bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)]'
                }`}>
                  <span className="font-semibold">IMT: {(parseFloat(pengukuran.beratBadan) / Math.pow(parseFloat(pengukuran.tinggiBadan) / 100, 2)).toFixed(1)}</span>
                  <span className="mx-2">·</span>
                  {imt.label}
                </div>
              )}

              {/* Lingkar Pinggang */}
              <InputField
                label="Lingkar Pinggang"
                hint="cm"
                type="number"
                value={pengukuran.lingkarPinggang}
                onChange={(v) => setPengukuran({ ...pengukuran, lingkarPinggang: v })}
                error={errors.lingkarPinggang}
                inputMode="decimal"
              />

              {/* TD */}
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="TD Sistolik"
                  hint="mmHg"
                  type="number"
                  value={pengukuran.tdSistol}
                  onChange={(v) => setPengukuran({ ...pengukuran, tdSistol: v })}
                  error={errors.tdSistol}
                  inputMode="numeric"
                />
                <InputField
                  label="TD Diastolik"
                  hint="mmHg"
                  type="number"
                  value={pengukuran.tdDiastol}
                  onChange={(v) => setPengukuran({ ...pengukuran, tdDiastol: v })}
                  error={errors.tdDiastol}
                  inputMode="numeric"
                />
              </div>

              {/* GDS */}
              <InputField
                label="GDS"
                hint="mg/dL"
                type="number"
                value={pengukuran.gds}
                onChange={(v) => setPengukuran({ ...pengukuran, gds: v })}
                error={errors.gds}
                inputMode="numeric"
              />

              {/* Kolesterol */}
              <InputField
                label="Kolesterol Total"
                hint="mg/dL · Opsional"
                type="number"
                value={pengukuran.kolesterol}
                onChange={(v) => setPengukuran({ ...pengukuran, kolesterol: v })}
                inputMode="numeric"
              />

              {/* Nav buttons */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl border border-[var(--color-garis)] text-[var(--color-tinta)] font-semibold text-sm hover:bg-white transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={() => { if (validateStep2()) setStep(3); }}
                  className="flex-1 py-3.5 rounded-xl bg-[var(--color-hutan)] text-white font-semibold text-sm hover:bg-[var(--color-hutan-gelap)] transition-colors flex items-center justify-center gap-2"
                >
                  Lihat Hasil
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Hasil */}
          {step === 3 && (
            <div className="space-y-5">
              <HasilCard hasil={getHasil()} />

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3.5 rounded-xl border border-[var(--color-garis)] text-[var(--color-tinta)] font-semibold text-sm hover:bg-white transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3.5 rounded-xl bg-[var(--color-padi)] text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Data'}
                  {!saving && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable Input Field ─── */
function InputField({
  label,
  hint,
  type = 'text',
  value,
  onChange,
  error,
  inputMode,
  icon,
}: {
  label: string;
  hint?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1.5 ml-1">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-tinta-lembut)]/50">
            {icon}
          </div>
        )}
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint}
          className={`w-full px-4 py-3 bg-white border rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all ${
            error ? 'border-[var(--color-merah-risiko)]' : 'border-[var(--color-garis)]'
          } ${icon ? 'pl-10' : ''}`}
        />
      </div>
      {error && <p className="text-[var(--color-merah-risiko)] text-xs mt-1 ml-1">{error}</p>}
    </div>
  );
}

/* ─── Hasil Card ─── */
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
  const statusConfig = {
    ok: { bg: 'bg-[var(--color-hijau-ok-bg)]', text: 'text-[var(--color-hijau-ok)]', border: 'border-[var(--color-hijau-ok)]/20' },
    warn: { bg: 'bg-[var(--color-kuning-warn-bg)]', text: 'text-[var(--color-kuning-warn)]', border: 'border-[var(--color-kuning-warn)]/20' },
    risk: { bg: 'bg-[var(--color-merah-risiko-bg)]', text: 'text-[var(--color-merah-risiko)]', border: 'border-[var(--color-merah-risiko)]/20' },
  };

  const getCfg = (status: string) => status === 'ok' ? statusConfig.ok : status === 'warn' ? statusConfig.warn : statusConfig.risk;

  const overallCfg = hasil.keseluruhan === 'SEHAT' ? statusConfig.ok :
    hasil.keseluruhan === 'PERLU PEMANTAUAN' ? statusConfig.warn : statusConfig.risk;

  const items = [
    { name: 'IMT', data: hasil.imt },
    { name: 'Tekanan Darah', data: hasil.td },
    { name: 'GDS', data: hasil.gds },
    { name: 'Lingkar Pinggang', data: hasil.lp },
  ];

  return (
    <div className="space-y-3">
      {/* Overall status */}
      <div className={`px-4 py-4 rounded-xl text-center border ${overallCfg.bg} ${overallCfg.border}`}>
        <p className={`font-bold text-xl ${overallCfg.text}`}>
          {hasil.keseluruhan}
        </p>
      </div>

      {/* Detail items */}
      {items.map((item) => {
        const cfg = getCfg(item.data.status);
        return (
          <div key={item.name} className={`px-4 py-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-[var(--color-tinta)]">{item.name}</p>
                <p className="text-xs text-[var(--color-tinta-lembut)]">{item.data.nilai}</p>
              </div>
              <span className={`text-xs font-semibold ${cfg.text}`}>
                {item.data.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Kolesterol */}
      {hasil.kolesterol ? (
        <div className={`px-4 py-3 rounded-xl border ${getCfg(hasil.kolesterol.status).bg} ${getCfg(hasil.kolesterol.status).border}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-[var(--color-tinta)]">Kolesterol</p>
              <p className="text-xs text-[var(--color-tinta-lembut)]">{hasil.kolesterol.nilai} mg/dL</p>
            </div>
            <span className={`text-xs font-semibold ${getCfg(hasil.kolesterol.status).text}`}>
              {hasil.kolesterol.label}
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 rounded-xl border border-[var(--color-garis)] bg-white">
          <p className="text-xs text-[var(--color-tinta-lembut)] text-center">Kolesterol: Tidak Diperiksa</p>
        </div>
      )}
    </div>
  );
}
