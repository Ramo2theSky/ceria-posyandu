'use client';

import Link from 'next/link';
import DotGrid from '@/components/ReactBits/DotGrid';

export default function WelcomePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--color-kertas)] pb-20">
      <div className="absolute inset-0 z-0">
        <DotGrid
          dotSize={6}
          gap={20}
          baseColor="#C5CEC8"
          activeColor="#1F4E4A"
          proximity={120}
          speedTrigger={80}
          shockRadius={200}
          shockStrength={3}
          maxSpeed={3000}
          resistance={800}
          returnDuration={2}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <div className="backdrop-blur-md bg-white/60 border border-white/40 rounded-3xl px-10 py-12 max-w-lg w-full">
          <div className="mb-6">
            <img
              src="/ceria-logo-tagline.png"
              alt="CERIA - Cek kEsehatan Remaja dan lansIA"
              className="w-72 max-w-full h-auto mx-auto"
            />
          </div>

          <p className="text-[var(--color-tinta-lembut)] text-base mb-10 leading-relaxed">
            Sistem Pendataan & Skrining Kesehatan Digital
            <br />
            untuk Posyandu Remaja &amp; Lansia
          </p>

          <Link
            href="/login"
            className="bg-[var(--color-hutan)] text-white font-semibold text-sm py-3.5 px-12 rounded-xl hover:bg-[var(--color-hutan-gelap)] transition-all inline-block"
          >
            Masuk
          </Link>

          <p className="text-xs text-[var(--color-tinta-lembut)] mt-8 opacity-60">
            Hubungi admin posyandu untuk mendapatkan akun
          </p>
        </div>
      </div>
    </div>
  );
}
