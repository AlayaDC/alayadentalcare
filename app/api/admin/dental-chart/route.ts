import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// GET: Get dental chart entries for a patient
export async function GET(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patient_id');

  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('dental_chart')
      .select('*')
      .eq('patient_id', patientId)
      .order('tooth_number', { ascending: true });
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json({ data: [] });
      }
      throw error;
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch dental chart' }, { status: 500 });
  }
}

// POST: Add a dental chart entry
export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { patient_id, tooth_number, condition, notes } = body;

    if (!patient_id || typeof patient_id !== 'string') {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    const toothNum = Number(tooth_number);
    if (!Number.isInteger(toothNum) || toothNum < 11 || toothNum > 48) {
      return NextResponse.json({ error: 'Invalid tooth number (must be 11-48 FDI notation)' }, { status: 400 });
    }

    if (!condition || typeof condition !== 'string' || condition.length > 100) {
      return NextResponse.json({ error: 'Condition is required' }, { status: 400 });
    }

    const record: Record<string, unknown> = {
      patient_id,
      tooth_number: toothNum,
      condition: condition.trim(),
    };
    if (notes) record.notes = notes;

    const { data, error } = await supabase.from('dental_chart').insert([record]).select();
    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This condition already exists for this tooth' }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to add dental chart entry' }, { status: 500 });
  }
}

// DELETE: Remove a dental chart entry
export async function DELETE(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const { error } = await supabase.from('dental_chart').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete dental chart entry' }, { status: 500 });
  }
}
