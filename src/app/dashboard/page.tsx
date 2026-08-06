'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isSuperAdmin, getCurrentPosyanduId, getPosyanduList, type Posyandu } from '@/lib/posyandu';
import SpotlightCard from '@/components/ReactBits/SpotlightCard';
import AppShell from '@/components/AppShell';

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

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
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
  const [activityLog] = useState<{ id: string; user_email: string; action: string; target_nik: string; detail: string; created_at: string }[]>([]);
  const [logLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalWarga: 0,
    pemeriksaanBulanIni: 0,
    pemeriksaanHariIni: 0,
    perluRujukan: 0,
  });

  // Posyandu state
  const [isAdmin, setIsAdmin] = useState(false);
  const [posyanduList, setPosyanduList] = useState<Posyandu[]>([]);
  const [selectedPosyanduId, setSelectedPosyanduId] = useState<string>('');
  const [posyanduStats, setPosyanduStats] = useState<{ id: string; nama: string; count: number }[]>([]);

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

      const admin = await isSuperAdmin();
      if (!cancelled) setIsAdmin(admin);

      let posyanduId = '';
      if (admin) {
        const list = await getPosyanduList();
        if (!cancelled) setPosyanduList(list);
        if (list.length > 0) {
          posyanduId = selectedPosyanduId || list[0].id;
          if (!cancelled) setSelectedPosyanduId(posyanduId);
        }
      } else {
        posyanduId = await getCurrentPosyanduId() || '';
      }

      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      // Base query with posyandu filter for non-admin
      const baseQuery = (table: string) => {
        let query = supabase.from(table).select('id', { count: 'exact', head: true }).is('dihapus_pada', null);
        if (!admin && posyanduId) query = query.eq('posyandu_id', posyanduId);
        if (admin && selectedPosyanduId) query = query.eq('posyandu_id', selectedPosyanduId);
        return query;
      };

      const [totalResult, monthResult, todayResult, rujukanResult] = await Promise.all([
        baseQuery('pemeriksaan'),
        baseQuery('pemeriksaan').gte('tanggal_periksa', monthStart),
        baseQuery('pemeriksaan').eq('tanggal_periksa', todayStr),
        baseQuery('pemeriksaan').ilike('catatan', '%PERLU RUJUKAN%'),
      ]);

      if (cancelled) return;

      setStats({
        totalWarga: totalResult.count ?? 0,
        pemeriksaanBulanIni: monthResult.count ?? 0,
        pemeriksaanHariIni: todayResult.count ?? 0,
        perluRujukan: rujukanResult.count ?? 0,
      });

      // Load per-posyandu stats for admin
      if (admin) {
        const list = posyanduList.length > 0 ? posyanduList : await getPosyanduList();
        const statsPromises = list.map(async (p) => {
          const { count } = await supabase
            .from('pemeriksaan')
            .select('id', { count: 'exact', head: true })
            .is('dihapus_pada', null)
            .eq('posyandu_id', p.id);
          return { id: p.id, nama: p.nama, count: count ?? 0 };
        });
        const statsResults = await Promise.all(statsPromises);
        if (!cancelled) setPosyanduStats(statsResults);
      }

      setStatsLoading(false);
    }

    loadUserAndStats();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Reload stats on visibility change
        loadUserAndStats();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router, selectedPosyanduId, posyanduList]);

  const menuItems: MenuItem[] = useMemo(() => [
    { href: '/input', title: 'Input Data Warga', description: 'Tambah pemeriksaan baru dengan cepat.', tone: 'teal' },
    { href: '/daftar', title: 'Daftar Warga', description: 'Cari dan lihat data warga yang sudah tersimpan.', tone: 'sky' },
    { href: '/rekap', title: 'Rekap Puskesmas', description: 'Tinjau ringkasan kesehatan dan tren data.', tone: 'amber' },
    { href: '/import', title: 'Impor CSV', description: 'Masukkan data massal dari file CSV.', tone: 'slate' },
    { href: '/recycle-bin', title: 'Recycle Bin', description: 'Lihat dan pulihkan data yang terhapus.', tone: 'red' },
  ], []);

  if (loading || !user) return null;

  const displayName = user.user_metadata?.nama || user.email || 'Pengguna';

  return (
    <AppShell>
    <div className="min-h-[calc(100vh-52px)] md:min-h-screen">
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

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-6 pb-20 md:px-8 md:py-8">
          <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-md md:grid-cols-[1.4fr_0.8fr] md:p-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Overview</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                Selamat datang, {displayName}
              </h2>
              <p className="mt-3 max-w-2xl text-base text-slate-600 md:text-lg">
                Pilih menu tindakan cepat untuk input data, menelusuri daftar warga, atau membuka rekap kesehatan puskesmas.
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

          {/* Posyandu filter for admin */}
          {isAdmin && posyanduList.length > 0 && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Filter Posyandu</p>
                  <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Pilih posyandu untuk melihat data spesifik</h3>
                </div>
                <select
                  value={selectedPosyanduId}
                  onChange={(e) => setSelectedPosyanduId(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 transition-all"
                >
                  <option value="">Semua Posyandu</option>
                  {posyanduList.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </div>
            </section>
          )}

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

          {/* Posyandu comparison chart for admin */}
          {isAdmin && posyanduStats.length > 0 && !selectedPosyanduId && (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 mb-4">Perbandingan per Posyandu</p>
              <div className="space-y-3">
                {posyanduStats.map((p) => {
                  const maxCount = Math.max(...posyanduStats.map(s => s.count), 1);
                  const percentage = (p.count / maxCount) * 100;
                  return (
                    <div key={p.id} className="flex items-center gap-4">
                      <div className="w-48 text-sm text-slate-700 truncate" title={p.nama}>
                        {p.nama.replace('Posyandu Dk. ', '')}
                      </div>
                      <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-sm font-semibold text-slate-900">
                        {p.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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
                           item.href === '/recycle-bin' ? 'text-slate-900 group-hover:text-red-600' :
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
                        <ArrowRightIcon className={`h-4 w-4 transition group-hover:translate-x-1 ${item.href === '/recycle-bin' ? 'text-red-600' : ''}`} />
                      </div>
                    </div>
                  </SpotlightCard>
                </Link>
              ))}
            </div>
          </section>
        </main>
    </div>
    </AppShell>
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