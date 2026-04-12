import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
};

export async function getDoctors(limit = 10) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('doctors')
    .select('*')
    .order('position', { ascending: true })
    .limit(limit);
  return data || [];
}

export async function getServices(limit = 50) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('services')
    .select('*')
    .order('position', { ascending: true })
    .limit(limit);
  return data || [];
}

export async function getServiceBySlug(slug: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('services')
    .select('*')
    .eq('slug', slug)
    .single();
  return data || null;
}
