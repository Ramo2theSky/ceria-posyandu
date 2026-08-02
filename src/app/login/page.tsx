'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Aurora from '@/components/Aurora/Aurora';
import { supabase } from '@/lib/supabase';

const REMEMBER_KEY = 'ceria_remember_me';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setEmail(data.email || '');
        setPassword(data.password || '');
        setRememberMe(true);
      } catch {}
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-[var(--color-garis)] rounded-xl text-lg bg-white/50"
                  placeholder="Masukkan kata sandi"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-tinta-lembut)] hover:text-[var(--color-tinta)]"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[var(--color-hutan)] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-[var(--color-tinta)] cursor-pointer">
                Ingat saya
              </label>
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