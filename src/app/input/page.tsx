'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { hitungUsia, klasifikasiIMT, klasifikasiTD, klasifikasiGulaDarah, butuhKlasifikasiGulaDarah, klasifikasiKolesterol, klasifikasiLP, statusKeseluruhan, peringatanUsiaRemaja, type JenisGulaDarah } from '@/lib/klasifikasi';
import { validasiNIK, validasiTanggalLahir } from '@/lib/validasi';
import { logActivity } from '@/lib/activity-log';
import { supabase } from '@/lib/supabase';
import { cekNIK, type CekNIKResult } from '@/lib/riwayat';
import RiwayatModal from '@/components/RiwayatModal';

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
  jenisGulaDarah: JenisGulaDarah | '';
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
    jenisGulaDarah: '',
    kolesterol: '',
    tanggalPeriksa: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [nikCheck, setNikCheck] = useState<CekNIKResult | null>(null);
  const [checkingNIK, setCheckingNIK] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);
  const [showGulaDarahPopup, setShowGulaDarahPopup] = useState(false);
  const [pendingGDS, setPendingGDS] = useState<number | null>(null);
  const nikTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usia = identitas.tanggalLahir ? hitungUsia(identitas.tanggalLahir, new Date()) : 0;
  const peringatanRemaja = usia > 0 ? peringatanUsiaRemaja(usia) : null;
  const imt = identitas.jenisKelamin && pengukuran.beratBadan && pengukuran.tinggiBadan
    ? klasifikasiIMT(parseFloat(pengukuran.beratBadan), parseFloat(pengukuran.tinggiBadan))
    : null;

  // Auto-check NIK with debounce
  useEffect(() => {
    if (nikTimerRef.current) clearTimeout(nikTimerRef.current);
    if (identitas.nik.length !== 16) {
      setNikCheck(null);
      setCheckingNIK(false);
      return;
    }
    setCheckingNIK(true);
    nikTimerRef.current = setTimeout(async () => {
      try {
        const result = await cekNIK(identitas.nik);
        setNikCheck(result);
        // Auto-fill from last record
        if (result.sudahAda && result.dataTerakhir) {
          const td = result.dataTerakhir;
          setIdentitas(prev => ({
            ...prev,
            tanggalLahir: prev.tanggalLahir || td.tanggal_lahir,
            jenisKelamin: prev.jenisKelamin || td.jenis_kelamin,
          }));
        }
      } catch {
        setNikCheck(null);
      } finally {
        setCheckingNIK(false);
      }
    }, 500);
    return () => { if (nikTimerRef.current) clearTimeout(nikTimerRef.current); };
  }, [identitas.nik]);

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
    if (!isNaN(gds) && gds >= 40 && gds <= 600 && butuhKlasifikasiGulaDarah(gds) && !pengukuran.jenisGulaDarah) {
      newErrors.gds = 'Pilih jenis gula darah (Puasa/Sewaktu)';
    }
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

    const jenisGD = (pengukuran.jenisGulaDarah || 'sewaktu') as JenisGulaDarah;
    const hasilIMT = klasifikasiIMT(bb, tb);
    const hasilTD = klasifikasiTD(sistol, diastol);
    const hasilGDS = klasifikasiGulaDarah(gds, jenisGD);
    const hasilKol = klasifikasiKolesterol(kol);
    const hasilLP = klasifikasiLP(lp, identitas.jenisKelamin as 'L' | 'P');
    const keseluruhan = statusKeseluruhan([hasilIMT, hasilTD, hasilGDS, hasilKol, hasilLP]);

    return {
      imt: { ...hasilIMT, nilai: (bb / Math.pow(tb / 100, 2)).toFixed(1) },
      td: { ...hasilTD, nilai: `${sistol}/${diastol}` },
      gds: { ...hasilGDS, nilai: gds.toString(), jenis: jenisGD },
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
        jenis_gula_darah: (pengukuran.jenisGulaDarah || 'sewaktu') as JenisGulaDarah,
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
      <div className="px-4 pb-20 flex justify-center">
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

              {/* NIK Status Badge */}
              {identitas.nik.length === 16 && (
                <div className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  checkingNIK
                    ? 'bg-[var(--color-kertas-dalam)] border border-[var(--color-garis)]'
                    : nikCheck?.sudahAda
                    ? 'bg-[var(--color-padi)]/10 border border-[var(--color-padi)]/30'
                    : 'bg-[var(--color-hijau-ok-bg)] border border-[var(--color-hijau-ok)]/20'
                }`}>
                  {checkingNIK ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[var(--color-tinta-lembut)] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-[var(--color-tinta-lembut)]">Mengecek NIK...</span>
                    </>
                  ) : nikCheck?.sudahAda ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-padi)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[var(--color-tinta)]">
                          Sudah diperiksa {nikCheck.jumlahPemeriksaan}x
                        </p>
                        <p className="text-xs text-[var(--color-tinta-lembut)]">
                          Terakhir: {nikCheck.terakhirPeriksa ? new Date(nikCheck.terakhirPeriksa).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowRiwayat(true)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-padi)] text-white text-xs font-semibold hover:brightness-110 transition-all"
                      >
                        Lihat Riwayat
                      </button>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-hijau-ok)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
                      <p className="text-sm text-[var(--color-hijau-ok)]">NIK baru — warga pertama kali diperiksa</p>
                    </>
                  )}
                </div>
              )}

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

              {/* Gula Darah */}
              <InputField
                label="Gula Darah (GDS/GDP)"
                hint="mg/dL"
                type="number"
                value={pengukuran.gds}
                onChange={(v) => {
                  const newGDS = v;
                  setPengukuran({ ...pengukuran, gds: newGDS, jenisGulaDarah: '' });
                  const gdsNum = parseInt(newGDS);
                  if (!isNaN(gdsNum) && butuhKlasifikasiGulaDarah(gdsNum)) {
                    setPendingGDS(gdsNum);
                    setShowGulaDarahPopup(true);
                  }
                }}
                error={errors.gds}
                inputMode="numeric"
              />
              {pengukuran.gds && pengukuran.jenisGulaDarah && (
                <p className="text-xs text-[var(--color-hutan)] font-semibold -mt-2 ml-1">
                  {pengukuran.jenisGulaDarah === 'puasa' ? '🔬 GDP (Puasa)' : '🍽️ GDS (Sewaktu)'}
                </p>
              )}

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

      {/* Riwayat Modal */}
      {showRiwayat && nikCheck?.riwayat && nikCheck.riwayat.length > 0 && (
        <RiwayatModal riwayat={nikCheck.riwayat} onClose={() => setShowRiwayat(false)} />
      )}

      {/* GDP/GDS Popup */}
      {showGulaDarahPopup && pendingGDS !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowGulaDarahPopup(false); setPendingGDS(null); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--color-kuning-warn-bg)] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-padi)" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3 className="font-bold text-lg text-[var(--color-tinta)]">Kadar Gula Darah: {pendingGDS} mg/dL</h3>
              <p className="text-sm text-[var(--color-tinta-lembut)] mt-2">
                Hasil klasifikasi berbeda tergantung kondisi puasa atau tidak.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setPengukuran({ ...pengukuran, jenisGulaDarah: 'puasa' });
                  setShowGulaDarahPopup(false);
                  setPendingGDS(null);
                }}
                className="w-full py-4 px-4 rounded-xl border-2 border-[var(--color-garis)] hover:border-[var(--color-hutan)] hover:bg-[var(--color-hutan)]/5 transition-all text-left"
              >
                <p className="font-semibold text-[var(--color-tinta)]">🔬 Puasa (GDP)</p>
                <p className="text-xs text-[var(--color-tinta-lembut)] mt-0.5">
                  {pendingGDS < 110 ? 'Normal' : pendingGDS <= 125 ? 'Pre-diabetes' : 'Diabetes'}
                </p>
              </button>

              <button
                onClick={() => {
                  setPengukuran({ ...pengukuran, jenisGulaDarah: 'sewaktu' });
                  setShowGulaDarahPopup(false);
                  setPendingGDS(null);
                }}
                className="w-full py-4 px-4 rounded-xl border-2 border-[var(--color-garis)] hover:border-[var(--color-hutan)] hover:bg-[var(--color-hutan)]/5 transition-all text-left"
              >
                <p className="font-semibold text-[var(--color-tinta)]">🍽️ Sewaktu (GDS)</p>
                <p className="text-xs text-[var(--color-tinta-lembut)] mt-0.5">
                  {pendingGDS < 140 ? 'Normal' : pendingGDS <= 199 ? 'Pre-diabetes' : 'Diabetes'}
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
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

interface HasilGDS extends HasilItem {
  jenis: JenisGulaDarah;
}

interface HasilData {
  imt: HasilItem;
  td: HasilItem;
  gds: HasilGDS;
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
    { name: hasil.gds.jenis === 'puasa' ? 'GDP' : 'GDS', data: hasil.gds },
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
