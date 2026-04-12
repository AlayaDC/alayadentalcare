import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_TABLES = ['doctors', 'services'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');
  const limit = searchParams.get('limit') || '10';

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid or missing table parameter' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
  }

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