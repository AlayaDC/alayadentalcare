import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const ALLOWED_STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Check-in', 'Completed'];
const ALLOWED_LOCATIONS = ['chettiyamkinar', 'kurukathani'];

const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getAdminSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getAdminSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { name, phone, countryCode, location, service, date, time } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'Invalid patient name' }, { status: 400 });
    }
    if (!phone || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number (must be 10 digits)' }, { status: 400 });
    }
    if (!location || !ALLOWED_LOCATIONS.includes(location)) {
      return NextResponse.json({ error: 'Invalid clinic location' }, { status: 400 });
    }
    if (!service || typeof service !== 'string' || service.length > 200) {
      return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'Invalid date (must be YYYY-MM-DD)' }, { status: 400 });
    }
    if (!time || typeof time !== 'string' || time.length > 20) {
      return NextResponse.json({ error: 'Invalid time' }, { status: 400 });
    }

    const code = countryCode && typeof countryCode === 'string' ? countryCode.trim() : '+91';
    const fullPhone = `${code} ${phone}`.trim();

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        name: name.trim(),
        phone: fullPhone,
        location,
        service,
        date,
        time: time.trim(),
        status: 'Pending'
      }])
      .select();

    if (error) {
      console.error('[appointments POST] Supabase error:', error);
      return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[appointments POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getAdminSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
    }
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status (must be Pending, Confirmed, Cancelled, Check-in, or Completed)' }, { status: 400 });
    }

    let patient_id: string | null = null;

    // Auto-create patient record on Check-in
    if (status === 'Check-in') {
      // First fetch the appointment to get name & phone
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select('name, phone')
        .eq('id', id)
        .single();

      if (apptError || !apptData) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      const { name, phone } = apptData;

      // Check if patient already exists by phone
      const { data: existingPatients } = await supabase
        .from('patients')
        .select('id')
        .ilike('phone', `%${phone.replace(/\D/g, '').slice(-10)}%`)
        .limit(1);

      if (existingPatients && existingPatients.length > 0) {
        patient_id = existingPatients[0].id;
      } else {
        // Create new patient record
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert([{ name: name.trim(), phone }])
          .select('id')
          .single();

        if (!patientError && newPatient) {
          patient_id = newPatient.id;
        }
      }
    }

    // Update appointment status (and patient_id if we have one)
    const updatePayload: Record<string, unknown> = { status };
    if (patient_id) updatePayload.patient_id = patient_id;

    const { data, error } = await supabase
      .from('appointments')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data, patient_id });
  } catch {
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}
