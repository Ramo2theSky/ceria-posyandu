import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const backupSecret = process.env.BACKUP_SECRET!;

const csvColumns = [
  'id',
  'nik',
  'tanggal_lahir',
  'jenis_kelamin',
  'berat_badan',
  'tinggi_badan',
  'lingkar_pinggang',
  'td_sistol',
  'td_diastol',
  'gds',
  'kolesterol_total',
  'tanggal_periksa',
  'catatan',
  'dibuat_oleh',
  'dibuat_pada',
  'diubah_pada',
  'dihapus_pada',
  'dihapus_oleh',
] as const;

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';

  const text = String(value);
  if (/[",\n\r;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsv(rows: Record<string, unknown>[]) {
  const header = csvColumns.join(',');
  const body = rows.map((row) => csvColumns.map((column) => escapeCsvValue(row[column])).join(','));
  return [header, ...body].join('\n');
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const expectedAuthHeader = `Bearer ${backupSecret}`;

  if (!backupSecret || authHeader !== expectedAuthHeader) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response('Backup configuration is incomplete', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase
    .from('pemeriksaan')
    .select('*')
    .order('tanggal_periksa', { ascending: false })
    .order('dibuat_pada', { ascending: false });

  if (error) {
    return new Response('Failed to load backup data', { status: 500 });
  }

  const csv = buildCsv(data || []);
  const fileName = `ceria-backup-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}