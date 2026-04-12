import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const VALID_STATUSES = ['Available', 'In Progress', 'Completed'];

// GET: List patient treatments for a consultation
export async function GET(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const consultationId = searchParams.get('consultation_id');
  const patientId = searchParams.get('patient_id');

  try {
    let query = supabase
      .from('patient_treatments')
      .select('*')
      .order('created_at', { ascending: true });

    if (consultationId) {
      query = query.eq('consultation_id', consultationId);
    }
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json({ data: [] });
      }
      throw error;
    }
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch patient treatments' }, { status: 500 });
  }
}

// POST: Add a treatment to a consultation
export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { consultation_id, patient_id, treatment_id, treatment_name, tooth_numbers, amount, notes } = body;

    if (!consultation_id || typeof consultation_id !== 'string') {
      return NextResponse.json({ error: 'Consultation ID is required' }, { status: 400 });
    }
    if (!patient_id || typeof patient_id !== 'string') {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }
    if (!treatment_name || typeof treatment_name !== 'string' || treatment_name.length > 200) {
      return NextResponse.json({ error: 'Invalid treatment name' }, { status: 400 });
    }

    const record: Record<string, unknown> = {
      consultation_id,
      patient_id,
      treatment_name: treatment_name.trim(),
      status: 'Available',
      amount: Number(amount) || 0,
    };

    if (treatment_id) record.treatment_id = treatment_id;
    if (tooth_numbers && Array.isArray(tooth_numbers)) {
      // Validate FDI tooth numbers (11-48)
      const validTeeth = tooth_numbers.filter((t: number) => Number.isInteger(t) && t >= 11 && t <= 48);
      record.tooth_numbers = validTeeth;
    }
    if (notes) record.notes = notes;

    const { data, error } = await supabase.from('patient_treatments').insert([record]).select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to add treatment' }, { status: 500 });
  }
}

// PATCH: Update a patient treatment
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
    if (updates.treatment_name !== undefined) sanitized.treatment_name = updates.treatment_name;
    if (updates.tooth_numbers !== undefined && Array.isArray(updates.tooth_numbers)) {
      sanitized.tooth_numbers = updates.tooth_numbers.filter((t: number) => Number.isInteger(t) && t >= 11 && t <= 48);
    }
    if (updates.status && VALID_STATUSES.includes(updates.status)) {
      sanitized.status = updates.status;
    }
    if (updates.amount !== undefined) sanitized.amount = Number(updates.amount) || 0;
    if (updates.notes !== undefined) sanitized.notes = updates.notes;

    const { data, error } = await supabase.from('patient_treatments').update(sanitized).eq('id', id).select();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to update treatment' }, { status: 500 });
  }
}

// DELETE: Remove a patient treatment
export async function DELETE(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const { error } = await supabase.from('patient_treatments').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete treatment' }, { status: 500 });
  }
}
