import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// ✅ Ensure your environment variables are defined in Vercel or .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Create a strongly typed Supabase client with session sync and cross-tab support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // Keeps user logged in between visits
    autoRefreshToken: true,        // Refresh tokens automatically
    detectSessionInUrl: true,      // Reads session from email confirmation links
    flowType: "pkce",              // Secure PKCE flow for email link auth & OAuth
  },
});
