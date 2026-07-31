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
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-tinta)]">Lupa Kata Sandi</h1>
          <p className="text-[var(--color-tinta-lembut)] mt-2 text-sm">
            Masukkan email akun CERIA Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 shadow-soft-lg border border-[var(--color-garis)]">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-[var(--color-tinta)] mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg bg-white/50"
              placeholder="Masukkan email"
              required
              disabled={success}
            />
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

          {success && (
            <div
              className="mt-4 p-3 rounded-xl text-sm"
              style={{
                background: 'linear-gradient(135deg, var(--color-hijau-ok-bg) 0%, #d4eadc 100%)',
                color: 'var(--color-hijau-ok)',
              }}
            >
              Link reset kata sandi telah dikirim ke <strong>{email}</strong>. Periksa kotak masuk
              (dan folder spam) Anda, lalu ikuti petunjuk di email.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-6 btn-primary text-white font-bold py-4 px-6 rounded-xl text-lg disabled:opacity-50"
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
