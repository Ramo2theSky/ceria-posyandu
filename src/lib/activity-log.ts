import { supabase } from './supabase';

export async function logActivity(
  action: 'insert' | 'update' | 'delete',
  targetNik: string,
  detail: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('activity_log').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      target_nik: targetNik,
      detail,
    });
  } catch {
    // silent fail — logging should not block main flow
  }
}
