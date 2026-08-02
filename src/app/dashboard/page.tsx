'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SpotlightCard from '@/components/ReactBits/SpotlightCard';

type DashboardUser = {
  email?: string | null;
  user_metadata?: { nama?: string };
};

type DashboardStats = {
  totalWarga: number;
  pemeriksaanBulanIni: number;
  pemeriksaanHariIni: number;
  perluRujukan: number;
};

type MenuItem = {
  href: string;
  title: string;
  description: string;
  tone: 'teal' | 'sky' | 'amber' | 'slate' | 'red';
};

function IconShell({ children, tone }: { children: React.ReactNode; tone: 'teal' | 'sky' | 'amber' | 'slate' | 'red' }) {
  const toneClass = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    red: 'bg-red-50 text-red-600 border-red-100',
  }[tone];

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClass}`}>
      {children}
    </div>
  );
}

function DashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 6h7v7H4z" />
      <path d="M13 6h7v4h-7z" />
      <path d="M13 12h7v6h-7z" />
      <path d="M4 15h7v3H4z" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <path d="M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M20 21v-1.5a3.5 3.5 0 0 0-2.5-3.35" />
      <path d="M16.5 4.5a3.5 3.5 0 0 1 0 7" />
    </svg>
  );
}

function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19h16" />
      <path d="M7 17v-6" />
      <path d="M12 17V7" />
      <path d="M17 17v-9" />
    </svg>
  );
}

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 17H5a2 2 0 0 0 2-2v-4a5 5 0 1 1 10 0v4a2 2 0 0 0 2 2z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

function UserCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 20a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4" />
      <circle cx="9" cy="8" r="4" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  );
}

function HeartPulseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      <path d="M3 12h4l2-3 2 6 2-4h8" />
    </svg>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12h4l2-5 4 10 2-5h4" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [activityLog, setActivityLog] = useState<{ id: string; user_email: string; action: string; target_nik: string; detail: string; created_at: string }[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalWarga: 0,
    pemeriksaanBulanIni: 0,
    pemeriksaanHariIni: 0,
    perluRujukan: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadUserAndStats() {
      const { data, error } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !data.user) {
        router.push('/login');
        return;
      }

      setUser({
        email: data.user.email,
        user_metadata: data.user.user_metadata as DashboardUser['user_metadata'],
      });
      setLoading(false);

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      const [totalResult, monthResult, todayResult, rujukanResult] = await Promise.all([
        supabase.from('pemeriksaan').select('id', { count: 'exact', head: true }).is('dihapus_pada', null),
        supabase.from('pemeriksaan').select('id', { count: 'exact', head: true }).is('dihapus_pada', null).gte('tanggal_periksa', monthStart),
        supabase.from('pemeriksaan').select('id', { count: 'exact', head: true }).is('dihapus_pada', null).eq('tanggal_periksa', todayStr),
        supabase.from('pemeriksaan').select('id', { count: 'exact', head: true }).is('dihapus_pada', null).ilike('catatan', '%PERLU RUJUKAN%'),
      ]);

      if (cancelled) return;

      setStats({
        totalWarga: totalResult.count ?? 0,
        pemeriksaanBulanIni: monthResult.count ?? 0,
        pemeriksaanHariIni: todayResult.count ?? 0,
        perluRujukan: rujukanResult.count ?? 0,
      });
      setStatsLoading(false);
    }

    loadUserAndStats();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const menuItems: MenuItem[] = useMemo(() => [
    { href: '/input', title: 'Input Data Warga', description: 'Tambah pemeriksaan baru dengan cepat.', tone: 'teal' },
    { href: '/daftar', title: 'Daftar Warga', description: 'Cari dan lihat data warga yang sudah tersimpan.', tone: 'sky' },
    { href: '/rekap', title: 'Rekap Desa', description: 'Tinjau ringkasan kesehatan dan tren data.', tone: 'amber' },
    { href: '/import', title: 'Impor CSV', description: 'Masukkan data massal dari file CSV.', tone: 'slate' },
    { href: '/recycle-bin', title: 'Recycle Bin', description: 'Lihat dan pulihkan data yang terhapus.', tone: 'red' },
  ], []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleLog = async () => {
    if (showLog) {
      setShowLog(false);
      return;
    }
    setShowLog(true);
    setLogLoading(true);
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setActivityLog(data || []);
    setLogLoading(false);
  };

  if (loading || !user) return null;

  const displayName = user.user_metadata?.nama || user.email || 'Pengguna';
  const initials = displayName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="hidden md:flex md:w-80 md:flex-col md:border-r md:border-slate-200 md:bg-white md:px-6 md:py-6">
        <div className="flex items-center gap-3 px-2">
          <Link href="/dashboard" className="shrink-0">
            <img src="/ceria-logo.png" alt="CERIA" className="h-10" />
          </Link>
          <div>
            <p className="text-sm text-slate-500">Sistem Kesehatan Desa</p>
          </div>
        </div>

        <nav className="mt-8 space-y-2">
          <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Menu utama</div>
          <Link href="/dashboard" className="flex min-h-12 items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700 shadow-sm">
            <DashboardIcon className="h-5 w-5" />
            <span>Overview</span>
          </Link>
          <Link href="/input" className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:bg-slate-50">
            <PlusIcon className="h-5 w-5" />
            <span>Input Data Warga</span>
          </Link>
          <Link href="/daftar" className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:bg-slate-50">
            <UsersIcon className="h-5 w-5" />
            <span>Daftar Warga</span>
          </Link>
          <Link href="/rekap" className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:bg-slate-50">
            <ChartIcon className="h-5 w-5" />
            <span>Rekap Desa</span>
          </Link>
          <Link href="/import" className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-teal-200 hover:bg-slate-50">
            <FileIcon className="h-5 w-5" />
            <span>Impor CSV</span>
          </Link>
        </nav>

        {/* SWARYA Branding */}
        <div className="mt-4 flex items-center gap-2 px-2">
          <img src="/swarya-logo.png" alt="SWARYA" className="h-5 w-auto" />
          <span className="text-[10px] text-slate-400 font-semibold">© 2026 KKN PPM UGM</span>
        </div>

        <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-md">
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
            <LogOutIcon className="h-4 w-4" />
            Keluar Aplikasi
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-8">
            <div className="flex items-center gap-3 md:hidden">
              <Link href="/dashboard" className="shrink-0">
                <img src="/ceria-logo.png" alt="CERIA" className="h-8" />
              </Link>
              <div>
                <p className="text-sm text-slate-500">Sistem Kesehatan Desa</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden rounded-full border border-teal-100 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 md:inline-flex">
                Sistem aktif & terhubung
              </div>
              <button
                onClick={toggleLog}
                className="relative flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-teal-600" />
              </button>
              <button
                onClick={handleLogout}
                className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 md:inline-flex"
              >
                <LogOutIcon className="h-4 w-4" />
                Keluar
              </button>
            </div>
          </div>
        </header>

        {showLog && (
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Log Aktivitas</h3>
                <button onClick={() => setShowLog(false)} className="text-slate-400 hover:text-slate-600 text-sm">Tutup</button>
              </div>
              {logLoading ? (
                <p className="text-sm text-slate-500">Memuat...</p>
              ) : activityLog.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada aktivitas.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm border-b border-slate-100 pb-2 last:border-0">
                      <span className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${log.action === 'insert' ? 'bg-emerald-500' : log.action === 'delete' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div>
                        <p className="text-slate-800">{log.detail}</p>
                        <p className="text-xs text-slate-400">{log.user_email} · {new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 md:px-8 md:py-8">
          <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-md md:grid-cols-[1.4fr_0.8fr] md:p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Overview</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Selamat datang, {displayName}
              </h2>
              <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
                Pilih menu tindakan cepat untuk input data, menelusuri daftar warga, atau membuka rekap kesehatan desa.
              </p>
            </div>

            <div className="flex items-start justify-between rounded-2xl border border-teal-100 bg-teal-50 p-4">
              <div>
                <p className="text-sm font-semibold text-teal-800">Status sistem</p>
                <p className="mt-1 text-sm text-teal-700">Siap dipakai untuk input dan rekap data hari ini.</p>
              </div>
              <span className="mt-1 inline-flex h-3 w-3 rounded-full bg-teal-600 shadow-[0_0_0_4px_rgba(13,148,136,0.16)]" />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              tone="teal"
              icon={<UserCheckIcon className="h-6 w-6" />}
              label="Total warga terdata"
              value={statsLoading ? '...' : stats.totalWarga.toString()}
            />
            <StatCard
              tone="sky"
              icon={<HeartPulseIcon className="h-6 w-6" />}
              label="Pemeriksaan bulan ini"
              value={statsLoading ? '...' : stats.pemeriksaanBulanIni.toString()}
            />
            <StatCard
              tone="amber"
              icon={<ActivityIcon className="h-6 w-6" />}
              label="Pemeriksaan hari ini"
              value={statsLoading ? '...' : stats.pemeriksaanHariIni.toString()}
            />
            <StatCard
              tone="slate"
              icon={<ChartIcon className="h-6 w-6" />}
              label="Perlu rujukan"
              value={statsLoading ? '...' : stats.perluRujukan.toString()}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Aksi cepat</p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Menu utama</h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block min-h-[180px]"
                >
                  <SpotlightCard
                    spotlightColor={
                      item.href === '/input' ? 'rgba(16, 185, 129, 0.15)' :
                      item.href === '/daftar' ? 'rgba(14, 116, 144, 0.12)' :
                      item.href === '/rekap' ? 'rgba(217, 162, 59, 0.12)' :
                      item.href === '/recycle-bin' ? 'rgba(220, 38, 38, 0.12)' :
                      'rgba(100, 116, 139, 0.1)'
                    }
                    className="h-full p-5"
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <IconShell tone={item.tone}>
                          {item.href === '/input' && <PlusIcon className="h-5 w-5" />}
                          {item.href === '/daftar' && <UsersIcon className="h-5 w-5" />}
                          {item.href === '/rekap' && <ChartIcon className="h-5 w-5" />}
                          {item.href === '/import' && <FileIcon className="h-5 w-5" />}
                          {item.href === '/recycle-bin' && <TrashIcon className="h-5 w-5" />}
                        </IconShell>
                        <h4 className={`mt-5 text-lg font-semibold transition ${
                          item.href === '/input' ? 'text-slate-900 group-hover:text-teal-700' :
                          item.href === '/daftar' ? 'text-slate-900 group-hover:text-sky-700' :
                          item.href === '/rekap' ? 'text-slate-900 group-hover:text-amber-700' :
                          item.href === '/recycle-bin' ? 'text-red-600 group-hover:text-red-700' :
                          'text-slate-900 group-hover:text-slate-700'
                        }`}>{item.title}</h4>
                        <p className="mt-2 text-base leading-6 text-slate-600">{item.description}</p>
                      </div>

                      <div className={`mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold transition ${
                        item.href === '/input' ? 'text-teal-700' :
                        item.href === '/daftar' ? 'text-sky-700' :
                        item.href === '/rekap' ? 'text-amber-700' :
                        item.href === '/recycle-bin' ? 'text-red-600' :
                        'text-slate-700'
                      }`}>
                        <span>Buka menu</span>
                        <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </SpotlightCard>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  tone,
  icon,
  label,
  value,
}: {
  tone: 'teal' | 'sky' | 'amber' | 'slate';
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const accentClass = {
    teal: 'border-teal-200 bg-teal-50 text-teal-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
  }[tone];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${accentClass}`}>
        {icon}
      </div>
      <p className="mt-4 text-base font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}