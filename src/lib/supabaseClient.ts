import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ Export a ready-to-use client for the app
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// ✅ Export a function for creating a new client (used in admin panel, etc.)
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
