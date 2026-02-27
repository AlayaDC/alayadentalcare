import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  // 1. Get the table name and limit from the URL
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const limit = searchParams.get('limit') || '10';

  if (!table) {
    return NextResponse.json({ error: 'Table parameter is required' }, { status: 400 });
  }

  // 2. Initialize Supabase directly on the server
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 3. Fetch the data from Supabase
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .order('position', { ascending: true })
    .limit(Number(limit));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 4. Send the data back to your frontend
  return NextResponse.json({ data });
}