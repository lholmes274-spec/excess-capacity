"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    const handleSession = async () => {
      // ✅ Check if session is already restored
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.push("/subscribe"); // redirect directly to subscription
      } else {
        // ✅ Wait for Supabase to set the new session after email confirmation
        const { data: listener } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            if (session) {
              router.push("/subscribe"); // redirect after login
            } else {
              router.push("/signup"); // fallback if no session
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
