import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('[get-public-data] Missing Supabase env vars:', {
      hasUrl: !!url,
      hasKey: !!key
    });
    return null;
  }

  return createClient(url, key);
};

export async function getDoctors(limit = 10) {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('position', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[getDoctors] Supabase error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[getDoctors] Unexpected error:', err);
    return [];
  }
}

export async function getServices(limit = 50) {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('position', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[getServices] Supabase error:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[getServices] Unexpected error:', err);
    return [];
  }
}

export async function getServiceBySlug(slug: string) {
  try {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[getServiceBySlug] Supabase error:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('[getServiceBySlug] Unexpected error:', err);
    return null;
  }
}
