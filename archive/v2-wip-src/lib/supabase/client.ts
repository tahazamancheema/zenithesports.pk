import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // Use dummy values if env vars are not set so the build doesn't crash before the user configures them
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
