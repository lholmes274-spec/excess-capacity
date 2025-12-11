// @ts-nocheck

/**
 * Browser Supabase client for Next.js App Router
 * Uses @supabase/ssr which replaced @supabase/auth-helpers-nextjs.
 *
 * - Works with PKCE authentication
 * - Safe for Client Components only
 * - Server Components and API routes must use createRouteHandlerClient()
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// Create a single browser Supabase client instance
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
