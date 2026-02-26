import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // This grabs the keys from your secret .env.local safe and builds the bridge!
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}