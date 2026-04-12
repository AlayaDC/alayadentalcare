import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// GET: List consultations (with optional patient_id filter)
export async function GET(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patient_id');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);

  try {
    let query = supabase
      .from('consultations')
      .select(`
        *,
        patients:patient_id (id, name, phone, age, gender),
        doctors:doctor_id (id, name),
        patient_treatments (id, treatment_name, tooth_numbers, status, amount)
      `)
      .order('date', { ascending: false })
      .limit(limit);

    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      // Search by patient name via a separate query approach
      const { data: matchingPatients } = await supabase
        .from('patients')
        .select('id')
        .or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

      if (matchingPatients && matchingPatients.length > 0) {
        const patientIds = matchingPatients.map(p => p.id);
        query = query.in('patient_id', patientIds);
      } else {
        return NextResponse.json({ data: [] });
      }
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
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 });
  }
}

// POST: Create a new consultation
export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { patient_id, doctor_id, appointment_id, date, chief_complaint, medical_history, dental_history, examination_notes } = body;

    if (!patient_id || typeof patient_id !== 'string') {
      return NextResponse.json({ error: 'Patient is required' }, { status: 400 });
    }

    const record: Record<string, unknown> = {
      patient_id,
      date: date || new Date().toISOString().split('T')[0],
      status: 'Open',
    };

    if (doctor_id) record.doctor_id = doctor_id;
    if (appointment_id) record.appointment_id = appointment_id;
    if (chief_complaint) record.chief_complaint = chief_complaint;
    if (medical_history) record.medical_history = Array.isArray(medical_history) ? medical_history : [];
    if (dental_history) record.dental_history = dental_history;
    if (examination_notes) record.examination_notes = examination_notes;

    const { data, error } = await supabase.from('consultations').insert([record]).select(`
      *,
      patients:patient_id (id, name, phone, age, gender),
      doctors:doctor_id (id, name)
    `);
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to create consultation' }, { status: 500 });
  }
}

// PATCH: Update a consultation
export async function PATCH(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const VALID_STATUSES = ['Open', 'Completed'];

    const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.doctor_id !== undefined) sanitized.doctor_id = updates.doctor_id;
    if (updates.chief_complaint !== undefined) sanitized.chief_complaint = updates.chief_complaint;
    if (updates.medical_history !== undefined) sanitized.medical_history = updates.medical_history;
    if (updates.dental_history !== undefined) sanitized.dental_history = updates.dental_history;
    if (updates.examination_notes !== undefined) sanitized.examination_notes = updates.examination_notes;
    if (updates.status && VALID_STATUSES.includes(updates.status)) {
      sanitized.status = updates.status;
    }

    const { data, error } = await supabase.from('consultations').update(sanitized).eq('id', id).select(`
      *,
      patients:patient_id (id, name, phone, age, gender),
      doctors:doctor_id (id, name),
      patient_treatments (id, treatment_name, tooth_numbers, status, amount)
    `);
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 });
  }
}

// DELETE: Remove a consultation
export async function DELETE(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    const { error } = await supabase.from('consultations').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete consultation' }, { status: 500 });
  }
}
