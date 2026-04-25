import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

function isSchemaError(code: string | undefined): boolean {
  return code === 'PGRST204' || code === 'PGRST205' || code === '42703' || code === '42P01';
}

// GET: Fetch site content
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .single();

  if (error) {
    if (isSchemaError(error.code)) {
      return NextResponse.json({ data: {} });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data?.content || {} });
}

// PATCH: Update site content
export async function PATCH(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
  }

  const body = await request.json();
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid content data' }, { status: 400 });
  }

  // Fetch existing content first
  const { data: existing } = await supabase
    .from('site_content')
    .select('content')
    .eq('id', 1)
    .single();

  const existingContent = existing?.content || {};

  // Merge at section level
  const merged: Record<string, unknown> = { ...existingContent };
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      merged[key] = { ...(merged[key] as Record<string, unknown> || {}), ...(value as Record<string, unknown>) };
    } else {
      merged[key] = value;
    }
  }

  const { error } = await supabase
    .from('site_content')
    .upsert({ id: 1, content: merged, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: merged });
}
