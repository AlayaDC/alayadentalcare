import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// GET: List patients (with optional search)
export async function GET(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const phone = searchParams.get('phone') || '';
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);

  try {
    let query = supabase.from('patients').select('*').order('created_at', { ascending: false }).limit(limit);

    if (phone) {
      query = query.ilike('phone', `%${phone}%`);
    } else if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      // Table doesn't exist yet — return empty list gracefully
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json({ data: [] });
      }
      throw error;
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

// POST: Create a new patient
export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { name, phone, email, age, gender, blood_group, address, medical_history, notes } = body;

    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }
    if (!phone || typeof phone !== 'string' || phone.length > 20) {
      return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
    }

    const record: Record<string, unknown> = { name: name.trim(), phone: phone.trim() };
    if (email) record.email = email;
    if (age !== undefined) record.age = Number(age) || null;
    if (gender) record.gender = gender;
    if (blood_group) record.blood_group = blood_group;
    if (address) record.address = address;
    if (medical_history) record.medical_history = Array.isArray(medical_history) ? medical_history : [];
    if (notes) record.notes = notes;

    const { data, error } = await supabase.from('patients').insert([record]).select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}

// PATCH: Update a patient
export async function PATCH(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) sanitized.name = updates.name;
    if (updates.phone !== undefined) sanitized.phone = updates.phone;
    if (updates.email !== undefined) sanitized.email = updates.email;
    if (updates.age !== undefined) sanitized.age = Number(updates.age) || null;
    if (updates.gender !== undefined) sanitized.gender = updates.gender;
    if (updates.blood_group !== undefined) sanitized.blood_group = updates.blood_group;
    if (updates.address !== undefined) sanitized.address = updates.address;
    if (updates.medical_history !== undefined) sanitized.medical_history = updates.medical_history;
    if (updates.notes !== undefined) sanitized.notes = updates.notes;

    const { data, error } = await supabase.from('patients').update(sanitized).eq('id', id).select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

// DELETE: Remove a patient
export async function DELETE(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
