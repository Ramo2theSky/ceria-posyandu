'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/input', label: 'Input Data', icon: 'input' },
  { href: '/daftar', label: 'Daftar Warga', icon: 'daftar' },
  { href: '/rekap', label: 'Rekap Desa', icon: 'rekap' },
  { href: '/import', label: 'Impor CSV', icon: 'import' },
  { href: '/recycle-bin', label: 'Recycle Bin', icon: 'recycle' },
] as const;

function NavIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || 'h-5 w-5';
  switch (icon) {
    case 'dashboard':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h7v7H4z" /><path d="M13 6h7v4h-7z" /><path d="M13 12h7v6h-7z" /><path d="M4 15h7v3H4z" />
        </svg>
      );
    case 'input':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case 'daftar':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'rekap':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case 'import':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      );
    case 'recycle':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('Pengguna');
  const [initials, setInitials] = useState('PG');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.nama || data.user?.email || 'Pengguna';
      setDisplayName(name);
      setInitials(name.split(' ').map((p: string) => p.charAt(0)).join('').slice(0, 2).toUpperCase());
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white px-4 py-5 md:w-80 md:px-6 md:py-6">
      {/* Logo */}
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <img src="/ceria-logo.png" alt="CERIA" className="h-10" />
          <div>
            <p className="text-sm text-slate-500">Sistem Kesehatan Desa</p>
          </div>
        </Link>
        <button onClick={onClose} className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-8 space-y-1">
        <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Menu utama</div>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'border border-teal-100 bg-teal-50 text-teal-700 shadow-sm font-semibold'
                  : 'border border-transparent text-slate-600 hover:border-teal-200 hover:bg-slate-50'
              }`}
            >
              <NavIcon icon={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* SWARYA Branding */}
      <div className="mt-4 mb-3 flex items-center gap-2 px-2">
        <img src="/swarya-logo.png" alt="SWARYA" className="h-5 w-auto" />
        <span className="text-[10px] text-slate-400 font-semibold">&copy; 2026 KKN PPM UGM</span>
      </div>

      {/* User Card */}
      <div className="mt-auto mb-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Keluar Aplikasi
        </button>
      </div>
    </aside>
  );
}
