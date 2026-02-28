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
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get the slug that the user clicked on (e.g., "root-canal")
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // 2. 🔥 THE FIX: Tell Supabase to ONLY get the row where the slug matches!
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)  // <--- This line stops it from always showing Teeth Whitening!
      .single();         // <--- This tells it to only return ONE item, not a list.

    if (error) throw error;

    return NextResponse.json({ data });
    
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
      full_description: body.full_description, // Now saving the full details!
      icon: body.icon,
      color: body.color,
      slug: body.slug,
      position: parseInt(body.position) || 0,
      image1: body.image1, // Now saving images!
      image2: body.image2,
      image3: body.image3
    }]).select();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("ADD ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── EDIT SERVICE (PATCH) ───
// Changed from PUT to PATCH to match your Admin Panel frontend code!
export async function PATCH(request: Request) {
  const supabase = getAdminSupabase();
  
  try {
    const body = await request.json();
    const id = body.id; // The frontend sends ID inside the body for PATCH requests

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    const { data, error } = await supabase.from('services').update({
      title: body.title,
      description: body.description,
      full_description: body.full_description, // Now updating full details!
      icon: body.icon,
      color: body.color,
      slug: body.slug,
      position: parseInt(body.position) || 0,
      image1: body.image1, // Now updating images!
      image2: body.image2,
      image3: body.image3
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