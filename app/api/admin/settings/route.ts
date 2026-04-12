import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../../../../lib/admin-auth';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const DEFAULT_SETTINGS = {
  id: 1,
  clinic_name: 'Alaya Dental Care',
  phone: '+91 8848659365',
  email: 'alayadentalcare@gmail.com',
  address: '',
  logo_url: null,
  doctor_stamp_url: null,
  working_hours: {
    mon: '10:00 AM - 8:00 PM',
    tue: '10:00 AM - 8:00 PM',
    wed: '10:00 AM - 8:00 PM',
    thu: '10:00 AM - 8:00 PM',
    fri: '10:00 AM - 8:00 PM',
    sat: '10:00 AM - 8:00 PM',
    sun: 'Closed',
  },
};

// Check if error is a "table/column not found" error
function isSchemaError(code: string | undefined): boolean {
  return code === 'PGRST204' || code === 'PGRST205' || code === '42703' || code === '42P01';
}

// GET: Fetch clinic settings
export async function GET() {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .eq('id', 1)
      .single();

    // If table doesn't exist or row not found, return defaults
    if (error) {
      if (isSchemaError(error.code)) {
        console.warn('clinic_settings table not found, returning defaults. Run the migration SQL.');
        return NextResponse.json({ data: DEFAULT_SETTINGS });
      }
      // Row doesn't exist - try to create it
      if (error.code === 'PGRST116') {
        const { data: newData, error: insertError } = await supabase
          .from('clinic_settings')
          .upsert({ id: 1, clinic_name: 'Alaya Dental Care' })
          .select()
          .single();
        if (insertError) {
          console.error('Settings create error:', insertError);
          return NextResponse.json({ data: DEFAULT_SETTINGS });
        }
        return NextResponse.json({ data: newData });
      }
      console.error('Settings GET error:', error);
      return NextResponse.json({ data: DEFAULT_SETTINGS });
    }

    return NextResponse.json({ data: data || DEFAULT_SETTINGS });
  } catch (err) {
    console.error('Settings GET error:', err);
    return NextResponse.json({ data: DEFAULT_SETTINGS });
  }
}

// PATCH: Update clinic settings
export async function PATCH(request: Request) {
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();

    const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.clinic_name !== undefined) sanitized.clinic_name = body.clinic_name;
    if (body.logo_url !== undefined) sanitized.logo_url = body.logo_url;
    if (body.doctor_stamp_url !== undefined) sanitized.doctor_stamp_url = body.doctor_stamp_url;
    if (body.phone !== undefined) sanitized.phone = body.phone;
    if (body.email !== undefined) sanitized.email = body.email;
    if (body.address !== undefined) sanitized.address = body.address;
    if (body.working_hours !== undefined) sanitized.working_hours = body.working_hours;

    let { data, error } = await supabase
      .from('clinic_settings')
      .update(sanitized)
      .eq('id', 1)
      .select()
      .single();

    // If table or columns don't exist, retry or return helpful error
    if (error && isSchemaError(error.code)) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return NextResponse.json(
          { error: 'Database table "clinic_settings" not found. Please run the migration SQL in Supabase SQL Editor.' },
          { status: 503 }
        );
      }
      // Column not found - strip optional columns and retry
      const safeSanitized = { ...sanitized };
      delete safeSanitized.working_hours;
      delete safeSanitized.logo_url;
      delete safeSanitized.doctor_stamp_url;
      ({ data, error } = await supabase
        .from('clinic_settings')
        .update(safeSanitized)
        .eq('id', 1)
        .select()
        .single());
    }

    if (error) {
      console.error('Settings PATCH error:', error);
      throw error;
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Settings PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
