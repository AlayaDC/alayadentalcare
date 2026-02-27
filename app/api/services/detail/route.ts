import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to create an Admin Supabase client that BYPASSES RLS
const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  // This is the magic line. It uses the Service Role key to bypass all security blocks for Admin actions.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseKey);
};

// ─── READ SERVICES (GET) ───
export async function GET(request: Request) {
  const supabase = getAdminSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
      if (error) throw error;
      return NextResponse.json({ data });
    } else {
      const { data, error } = await supabase.from('services').select('*').order('position', { ascending: true });
      if (error) throw error;
      return NextResponse.json({ data });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── ADD SERVICE (POST) ───
export async function POST(request: Request) {
  const supabase = getAdminSupabase();
  try {
    const body = await request.json();
    
    const { data, error } = await supabase.from('services').insert([{
      title: body.title,
      description: body.description,
      icon: body.icon,
      color: body.color,
      slug: body.slug,
      position: parseInt(body.position) || 0
    }]).select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("ADD ERROR:", error); // Check your VS Code Terminal if this fails!
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── EDIT SERVICE (PUT) ───
export async function PUT(request: Request) {
  const supabase = getAdminSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    const body = await request.json();
    
    const { data, error } = await supabase.from('services').update({
      title: body.title,
      description: body.description,
      icon: body.icon,
      color: body.color,
      slug: body.slug,
      position: parseInt(body.position) || 0
    }).eq('id', id).select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("EDIT ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE SERVICE (DELETE) ───
export async function DELETE(request: Request) {
  const supabase = getAdminSupabase();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  try {
    const { data, error } = await supabase.from('services').delete().eq('id', id).select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("DELETE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}