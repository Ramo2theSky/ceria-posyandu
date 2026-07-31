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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
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
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-soft-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-hutan) 0%, #2a6b64 100%)' }}
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
            Buat kata sandi baru untuk akun CERIA Anda
          </p>
        </div>

        {checking ? (
          <div className="glass rounded-2xl p-6 shadow-soft-lg border border-[var(--color-garis)] text-center text-[var(--color-tinta-lembut)]">
            Memverifikasi link reset...
          </div>
        ) : !ready ? (
          <div className="glass rounded-2xl p-6 shadow-soft-lg border border-[var(--color-garis)]">
            <div
              className="p-3 rounded-xl text-sm mb-4"
              style={{
                background: 'linear-gradient(135deg, #F8E2DF 0%, #f0c8c3 100%)',
                color: 'var(--color-merah-risiko)',
              }}
            >
              Link reset tidak valid atau sudah kedaluwarsa.
            </div>
            <Link
              href="/lupa-password"
              className="block w-full text-center btn-primary text-white font-bold py-4 px-6 rounded-xl text-lg"
            >
              Minta Link Baru
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 shadow-soft-lg border border-[var(--color-garis)]">
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-[var(--color-tinta)] mb-2">
                  Kata Sandi Baru
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg bg-white/50"
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-bold text-[var(--color-tinta)] mb-2"
                >
                  Konfirmasi Kata Sandi
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg bg-white/50"
                  placeholder="Ulangi kata sandi baru"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div
                className="mt-4 p-3 rounded-xl text-sm"
                style={{
                  background: 'linear-gradient(135deg, #F8E2DF 0%, #f0c8c3 100%)',
                  color: 'var(--color-merah-risiko)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 btn-primary text-white font-bold py-4 px-6 rounded-xl text-lg disabled:opacity-50"
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
