import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper to initialize Supabase on the server
const getSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
};

// GET: Fetch all doctors
export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase.from('doctors').select('*').order('position', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST: Add a new doctor
export async function POST(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { error } = await supabase.from('doctors').insert([body]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// PATCH: Update an existing doctor
export async function PATCH(request: Request) {
  const supabase = getSupabase();
  const body = await request.json();
  const { id, ...updates } = body;
  const { error } = await supabase.from('doctors').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE: Remove a doctor
export async function DELETE(request: Request) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  
  const { error } = await supabase.from('doctors').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}