// src/lib/supabaseClient.ts
// @ts-nocheck

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

// ✅ REQUIRED for auth to persist
function getCookies() {
  return document.cookie;
}

function setCookie(name: string, value: string, options: any) {
  let cookie = `${name}=${value}; path=/`;

  if (options?.maxAge) {
    cookie += `; max-age=${options.maxAge}`;
  }

  document.cookie = cookie;
}

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return document.cookie
          .split("; ")
          .map((c) => {
            const [name, ...rest] = c.split("=");
            return { name, value: rest.join("=") };
          });
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          let cookie = `${name}=${value}; path=/`;

          if (options?.maxAge) {
            cookie += `; max-age=${options.maxAge}`;
          }

          document.cookie = cookie;
        });
      },
    },
  }
);