// @ts-nocheck
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const to = searchParams.get("to");

  useEffect(() => {
    const handle = async () => {
      const { data } = await supabase.auth.getSession();

      if (data?.session?.user) {
        router.replace(to || "/dashboard");
      } else {
        router.replace(`/login?redirect=${encodeURIComponent(to || "/dashboard")}`);
      }
    };

    handle();
  }, [to, router]);

  return (
    <div className="p-6 text-gray-600">
      Redirecting...
    </div>
  );
}