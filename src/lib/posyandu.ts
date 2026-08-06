import { supabase } from './supabase';

export interface Posyandu {
  id: string;
  nama: string;
}

export async function getCurrentPosyanduId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.user_metadata?.posyandu_id || null;
}

export async function isSuperAdmin(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return data.user?.user_metadata?.is_super_admin === true;
}

export async function getPosyanduList(): Promise<Posyandu[]> {
  const { data } = await supabase
    .from('posyandu')
    .select('*')
    .order('nama');
  return data || [];
}

export async function getPosyanduName(id: string): Promise<string> {
  const { data } = await supabase
    .from('posyandu')
    .select('nama')
    .eq('id', id)
    .single();
  return data?.nama || '-';
}

export async function getCurrentUserName(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.user_metadata?.nama || data.user?.email || 'Pengguna';
}
