import { describe, it, expect, vi, beforeEach } from 'vitest';

interface MockUser {
  id: string;
  email: string;
}

interface MockAuth {
  getUser: ReturnType<typeof vi.fn>;
}

interface MockFrom {
  insert: ReturnType<typeof vi.fn>;
}

interface MockSupabase {
  auth: MockAuth;
  from: ReturnType<(table: string) => MockFrom>;
}

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
    })),
  } satisfies MockSupabase,
}));

import { logActivity } from '../activity-log';
import { supabase } from '../supabase';

const mockSupabase = vi.mocked(supabase);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logActivity', () => {
  it('tidak log jika user tidak login', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await logActivity('insert', '1234567890123456', 'Test');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('log insert activity', async () => {
    const mockInsert = vi.fn();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } as MockUser },
      error: null,
    });
    mockSupabase.from.mockReturnValue({ insert: mockInsert } as MockFrom);

    await logActivity('insert', '1234567890123456', 'Data warga disimpan');

    expect(mockSupabase.from).toHaveBeenCalledWith('activity_log');
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
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u2', email: 'admin@test.com' } as MockUser },
      error: null,
    });
    mockSupabase.from.mockReturnValue({ insert: mockInsert } as MockFrom);

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
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com' } as MockUser },
      error: null,
    });
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error('DB error')),
    } as MockFrom);

    await expect(logActivity('insert', '12345', 'Test')).resolves.toBeUndefined();
  });
});
