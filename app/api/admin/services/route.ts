import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

function validateString(value: unknown, maxLen: number): value is string {
  return typeof value === 'string' && value.length <= maxLen;
}

export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { data, error } = await supabase.from('services').select('*').order('position', { ascending: true });
  if (error) return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const body = await request.json();
  const { title, description, full_description, icon, color, slug, position, image1, image2, image3 } = body;

  if (!title || !validateString(title, 200)) {
    return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
  }
  if (!description || !validateString(description, 1000)) {
    return NextResponse.json({ error: 'Invalid description' }, { status: 400 });
  }
  if (full_description !== undefined && !validateString(full_description, 5000)) {
    return NextResponse.json({ error: 'Full description too long' }, { status: 400 });
  }
  if (!icon || !validateString(icon, 100)) {
    return NextResponse.json({ error: 'Invalid icon' }, { status: 400 });
  }
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json({ error: 'Invalid color (must be hex like #086351)' }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.length > 200) {
    return NextResponse.json({ error: 'Invalid slug (lowercase letters, numbers, and hyphens only)' }, { status: 400 });
  }
  const pos = Number(position);
  if (isNaN(pos)) {
    return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
  }

  // Check for duplicate slug
  const { data: existing } = await supabase.from('services').select('id').eq('slug', slug).limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'A service with this slug already exists' }, { status: 400 });
  }

  const record: Record<string, unknown> = {
    title, description, icon, color, slug, position: pos,
  };
  if (full_description) record.full_description = full_description;
  if (body.category && validateString(body.category, 100)) record.category = body.category;
  if (body.prices !== undefined) record.prices = Array.isArray(body.prices) ? body.prices : [];
  if (body.is_active !== undefined) record.is_active = Boolean(body.is_active);
  if (image1 && validateString(image1, 1000)) record.image1 = image1;
  if (image2 && validateString(image2, 1000)) record.image2 = image2;
  if (image3 && validateString(image3, 1000)) record.image3 = image3;

  let { error } = await supabase.from('services').insert([record]);
  // If optional columns don't exist yet (migration not applied), retry without them
  if (error?.code === 'PGRST204' || error?.code === '42703') {
    const safeRecord = { ...record };
    delete safeRecord.category;
    delete safeRecord.prices;
    delete safeRecord.is_active;
    ({ error } = await supabase.from('services').insert([safeRecord]));
  }
  if (error) {
    console.error('Service insert error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add service' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const sanitized: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    if (!validateString(updates.title, 200)) return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    sanitized.title = updates.title;
  }
  if (updates.description !== undefined) {
    if (!validateString(updates.description, 1000)) return NextResponse.json({ error: 'Invalid description' }, { status: 400 });
    sanitized.description = updates.description;
  }
  if (updates.full_description !== undefined) {
    if (!validateString(updates.full_description, 5000)) return NextResponse.json({ error: 'Full description too long' }, { status: 400 });
    sanitized.full_description = updates.full_description;
  }
  if (updates.icon !== undefined) {
    if (!validateString(updates.icon, 100)) return NextResponse.json({ error: 'Invalid icon' }, { status: 400 });
    sanitized.icon = updates.icon;
  }
  if (updates.color !== undefined) {
    if (!/^#[0-9a-fA-F]{6}$/.test(updates.color)) return NextResponse.json({ error: 'Invalid color' }, { status: 400 });
    sanitized.color = updates.color;
  }
  if (updates.slug !== undefined) {
    if (!/^[a-z0-9-]+$/.test(updates.slug) || updates.slug.length > 200) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }
    // Check for duplicate slug (exclude current record)
    const { data: existing } = await supabase.from('services').select('id').eq('slug', updates.slug).neq('id', id).limit(1);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'A service with this slug already exists' }, { status: 400 });
    }
    sanitized.slug = updates.slug;
  }
  if (updates.position !== undefined) {
    const pos = Number(updates.position);
    if (isNaN(pos)) return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
    sanitized.position = pos;
  }
  if (updates.image1 !== undefined) {
    if (updates.image1 && !validateString(updates.image1, 1000)) return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    sanitized.image1 = updates.image1;
  }
  if (updates.image2 !== undefined) {
    if (updates.image2 && !validateString(updates.image2, 1000)) return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    sanitized.image2 = updates.image2;
  }
  if (updates.image3 !== undefined) {
    if (updates.image3 && !validateString(updates.image3, 1000)) return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    sanitized.image3 = updates.image3;
  }
  if (updates.category !== undefined) {
    if (!validateString(updates.category, 100)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    sanitized.category = updates.category;
  }
  if (updates.prices !== undefined) {
    sanitized.prices = Array.isArray(updates.prices) ? updates.prices : [];
  }
  if (updates.is_active !== undefined) {
    sanitized.is_active = Boolean(updates.is_active);
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  let { error } = await supabase.from('services').update(sanitized).eq('id', id);
  // If optional columns don't exist yet (migration not applied), retry without them
  if (error?.code === 'PGRST204' || error?.code === '42703') {
    const safeSanitized = { ...sanitized };
    delete safeSanitized.category;
    delete safeSanitized.prices;
    delete safeSanitized.is_active;
    if (Object.keys(safeSanitized).length > 0) {
      ({ error } = await supabase.from('services').update(safeSanitized).eq('id', id));
    } else {
      error = null; // Only optional columns were being updated
    }
  }
  if (error) {
    console.error('Service update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update service' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  return NextResponse.json({ success: true });
}
