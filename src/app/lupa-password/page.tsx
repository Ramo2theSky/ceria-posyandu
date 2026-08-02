'use client';

import Link from 'next/link';
import { useState } from 'react';
import Aurora from '@/components/Aurora/Aurora';
import { getPasswordResetRedirectUrl, supabase } from '@/lib/supabase';

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      });

      if (resetError) {
        setError('Gagal mengirim email reset. Periksa alamat email Anda atau hubungi admin.');
        return;
      }

      setSuccess(true);
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
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, var(--color-hutan) 0%, #2a6b64 100%)' }}
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-tinta)]">Lupa Kata Sandi</h1>
          <p className="text-[var(--color-tinta-lembut)] mt-2 text-sm">
            Masukkan email akun Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 border border-[var(--color-garis)]">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[var(--color-tinta-lembut)] mb-1.5 ml-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-[var(--color-garis)] rounded-xl text-sm text-[var(--color-tinta)] placeholder:text-[var(--color-tinta-lembut)]/50 focus:outline-none focus:border-[var(--color-hutan)] focus:ring-2 focus:ring-[var(--color-hutan)]/10 transition-all"
              placeholder="Masukkan email"
              required
              disabled={success}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl text-sm bg-[var(--color-merah-risiko-bg)] text-[var(--color-merah-risiko)] border border-[var(--color-merah-risiko)]/20">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 rounded-xl text-sm bg-[var(--color-hijau-ok-bg)] text-[var(--color-hijau-ok)] border border-[var(--color-hijau-ok)]/20">
              Link reset kata sandi telah dikirim ke <strong>{email}</strong>. Periksa kotak masuk
              (dan folder spam) Anda, lalu ikuti petunjuk di email.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-6 bg-[var(--color-hutan)] text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-[var(--color-hutan-gelap)] transition-colors disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : success ? 'Email Terkirim' : 'Kirim Link Reset'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-tinta-lembut)] mt-6">
          <Link href="/login" className="font-bold text-[var(--color-hutan)] hover:underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
