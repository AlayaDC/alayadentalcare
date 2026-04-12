import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }) };
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie setting can fail in certain server contexts
          }
        },
      },
    });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    return { user: session.user, error: null };
  } catch {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
}
