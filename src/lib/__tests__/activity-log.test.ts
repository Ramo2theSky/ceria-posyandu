import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  },
}));

import { logActivity } from '../activity-log';
import { supabase } from '../supabase';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logActivity', () => {
  it('tidak log jika user tidak login', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
    await logActivity('insert', '1234567890123456', 'Test');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('log insert activity', async () => {
    const mockInsert = vi.fn();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } as any },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

    await logActivity('insert', '1234567890123456', 'Data warga disimpan');

    expect(supabase.from).toHaveBeenCalledWith('activity_log');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'u1',
      user_email: 'test@test.com',
      action: 'insert',
      target_nik: '1234567890123456',
      detail: 'Data warga disimpan',
    });
  });

  it('log delete activity', async () => {
    const mockInsert = vi.fn();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u2', email: 'admin@test.com' } as any },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({ insert: mockInsert } as any);

    await logActivity('delete', '1234567890123456', 'Data dihapus');

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'u2',
      user_email: 'admin@test.com',
      action: 'delete',
      target_nik: '1234567890123456',
      detail: 'Data dihapus',
    });
  });

  it('tidak throw error jika insert gagal', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } as any },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error('DB error')),
    } as any);

    await expect(logActivity('insert', '12345', 'Test')).resolves.toBeUndefined();
  });
});
