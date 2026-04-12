import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { data, error } = await supabase.from('doctors').select('*').order('position', { ascending: true });
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const body = await request.json();
  const { name, role, image, position } = body;

  if (!name || typeof name !== 'string' || name.length > 200) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }
  if (!role || typeof role !== 'string' || role.length > 200) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
  }
  const pos = Number(position);
  if (isNaN(pos)) {
    return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
  }

  const { error } = await supabase.from('doctors').insert([{ name, role, image, position: pos }]);
  if (error) return NextResponse.json({ error: 'Failed to add doctor' }, { status: 500 });
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
  if (updates.name !== undefined) {
    if (typeof updates.name !== 'string' || updates.name.length > 200) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    sanitized.name = updates.name;
  }
  if (updates.role !== undefined) {
    if (typeof updates.role !== 'string' || updates.role.length > 200) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    sanitized.role = updates.role;
  }
  if (updates.image !== undefined) {
    if (typeof updates.image !== 'string') {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }
    sanitized.image = updates.image;
  }
  if (updates.position !== undefined) {
    const pos = Number(updates.position);
    if (isNaN(pos)) {
      return NextResponse.json({ error: 'Invalid position' }, { status: 400 });
    }
    sanitized.position = pos;
  }

  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await supabase.from('doctors').update(sanitized).eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to update doctor' }, { status: 500 });
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

  const { error } = await supabase.from('doctors').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to delete doctor' }, { status: 500 });
  return NextResponse.json({ success: true });
}
