'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Aurora from '@/components/Aurora/Aurora';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setReady(true);
      }
      setChecking(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError('Gagal mengubah kata sandi. Link mungkin sudah kedaluwarsa — minta link baru.');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Terjadi kesalahan. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden pb-20">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden="true">
        <Aurora
          colorStops={['#2F7D52', '#1F4E4A', '#D9A23B']}
          blend={0.6}
          amplitude={0.8}
          speed={0.4}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-[var(--color-hutan)]"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-tinta)]">Kata Sandi Baru</h1>
          <p className="text-[var(--color-tinta-lembut)] mt-2 text-sm">
            Buat kata sandi baru untuk akun Anda
          </p>
        </div>

        {checking ? (
          <div className="bg-white rounded-2xl p-5 border border-[var(--color-garis)] text-center text-[var(--color-tinta-lembut)]">
            Memverifikasi link reset...
          </div>
        ) : !ready ? (
          <div className="bg-white rounded-2xl p-5 border border-[var(--color-garis)]">
            <div className="p-3 rounded-xl text-sm mb-4 bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)] border border-[var(--color-merah-risiko)]/20">
              Link reset tidak valid atau sudah kedaluwarsa.
            </div>
            <Link
              href="/lupa-password"
              className="block w-full text-center bg-[var(--color-hutan)] text-white font-semibold text-sm py-3.5 px-6 rounded-xl hover:bg-[var(--color-hutan-gelap)] transition-colors"
            >
              Minta Link Baru
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-[var(--color-garis)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1.5 ml-1">
                  Kata Sandi Baru
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1.5 ml-1"
                >
                  Konfirmasi Kata Sandi
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all"
                  placeholder="Ulangi kata sandi baru"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-xl text-sm bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)] border border-[var(--color-merah-risiko)]/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-[var(--color-hutan)] text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-[var(--color-hutan-gelap)] transition-colors disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--color-tinta-lembut)] mt-6">
          <Link href="/login" className="font-bold text-[var(--color-hutan)] hover:underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
