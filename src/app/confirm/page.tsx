"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSession = async () => {
      // check if session is already restored
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.push("/"); // already logged in
      } else {
        // listen for Supabase to set the new session from the email link
        const { data: listener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session) {
              router.push("/"); // auto-login then redirect home
            } else {
              router.push("/login"); // fallback
            }
          }
        );

        return () => listener.subscription.unsubscribe();
      }
    };

    handleSession();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen text-gray-700">
      <p>Verifying your account… please wait</p>
    </div>
  );
}
