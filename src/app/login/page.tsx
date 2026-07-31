'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Aurora from '@/components/Aurora/Aurora';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email atau kata sandi salah. Hubungi admin posyandu untuk bantuan.');
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
          <Link href="/" className="inline-block">
            <img
              src="/ceria-logo.png"
              alt="CERIA"
              className="h-16 mx-auto mb-4"
            />
          </Link>
          <p className="text-[var(--color-tinta-lembut)] mt-2 text-sm">Desa Jurangjero, Karanganom, Klaten</p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-2xl p-6 shadow-soft-lg border border-[var(--color-garis)]">
          <div className="space-y-4">
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
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-bold text-[var(--color-tinta)]">
                  Kata Sandi
                </label>
                <Link
                  href="/lupa-password"
                  className="text-sm font-bold text-[var(--color-hutan)] hover:underline"
                >
                  Lupa kata sandi?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[var(--color-garis)] rounded-xl text-lg bg-white/50"
                placeholder="Masukkan kata sandi"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'linear-gradient(135deg, #F8E2DF 0%, #f0c8c3 100%)', color: 'var(--color-merah-risiko)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 btn-primary text-white font-bold py-4 px-6 rounded-xl text-lg disabled:opacity-50"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-tinta-lembut)] mt-6 opacity-70">
          Hubungi admin posyandu untuk mendapatkan akun
        </p>
      </div>
    </div>
  );
}