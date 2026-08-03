'use client';

import Link from 'next/link';
import Aurora from '@/components/Aurora/Aurora';

export default function NotFound() {
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

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-[var(--color-garis)] shadow-xl">
          <p className="text-7xl font-bold text-[var(--color-hutan)] mb-4">404</p>
          <h1 className="text-xl font-bold text-[var(--color-tinta)] mb-2">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-sm text-[var(--color-tinta-lembut)] mb-8">
            Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.
          </p>
          <Link
            href="/"
            className="inline-block w-full bg-[var(--color-hutan)] text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-[var(--color-hutan-gelap)] transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
