// @ts-nocheck

/**
 * This file creates a Supabase client **only for the browser**.
 * 
 * - Works with PKCE authentication
 * - Prevents multiple GoTrue instances
 * - Prevents server crashes caused by browser-only client running on the server
 * - Ensures Route Handlers can safely load session using createRouteHandlerClient()
 */

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

// Create a single browser Supabase client
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
