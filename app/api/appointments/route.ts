import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_LOCATIONS = ['chettiyamkinar', 'kurukathani'];

const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

// Public endpoint — no auth required (for booking page)
export async function POST(request: Request) {
  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

  try {
    const body = await request.json();
    const { name, phone, countryCode, location, service, date, time } = body;

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 200) {
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
      console.error('[public appointments POST] Supabase error:', error);
      return NextResponse.json({ error: error.message || 'Database error' }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[public appointments POST] Unexpected error:', err);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}
