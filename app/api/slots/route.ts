import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. Grab the date and location from the URL parameters
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const location = searchParams.get('location');

  if (!date || !location) {
    return NextResponse.json({ error: 'Missing date or location' }, { status: 400 });
  }

  // 2. Initialize Supabase safely on the server
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3. Apply our specific filters for the booking calendar
    const { data, error } = await supabase
      .from('appointments')
      .select('time')
      .eq('date', date) // Only today
      .eq('location', location) // Only this clinic
      .neq('status', 'Cancelled'); // Ignore cancelled ones

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}