import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to bypass Row Level Security (RLS)
const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
};

// ─── READ APPOINTMENTS (GET) ───
export async function GET() {
  const supabase = getAdminSupabase();
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("GET APPOINTMENTS ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── CREATE NEW APPOINTMENT (POST) ───
export async function POST(request: Request) { // <-- Added 'Request' type here!
  const supabase = getAdminSupabase();
  
  try {
    const body = await request.json();
    const fullPhone = `${body.countryCode || ''} ${body.phone || ''}`.trim();

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        name: body.name,
        phone: fullPhone,
        location: body.location,
        service: body.service,
        date: body.date,
        time: body.time,
        status: 'Pending'
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("CREATE APPOINTMENT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── UPDATE APPOINTMENT STATUS (PATCH) ───
export async function PATCH(request: Request) { // <-- Added 'Request' type here!
  const supabase = getAdminSupabase();
  
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) return NextResponse.json({ error: "Missing ID or Status" }, { status: 400 });

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: status })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("PATCH APPOINTMENT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}