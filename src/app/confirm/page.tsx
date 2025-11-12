"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState("Verifying your account… please wait");

  useEffect(() => {
    const handleSession = async () => {
      // ✅ Check if session already exists
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setStatusMessage("✅ Email confirmed — please log in.");
        setTimeout(() => {
          router.push("/login");
        }, 2500);
        return;
      }

      // ✅ Wait for Supabase to establish session after confirmation
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setStatusMessage("✅ Email confirmed — please log in.");
          setTimeout(() => {
            router.push("/login");
          }, 2500);
        } else {
          setStatusMessage("⚠️ Unable to verify session. Please log in manually.");
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        }
      });

      return () => listener.subscription.unsubscribe();
    };

    handleSession();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-gray-700">
      <h1 className="text-2xl font-semibold mb-4 text-center">{statusMessage}</h1>
      <p className="text-sm text-gray-500 text-center">
        You’ll be redirected to the login page shortly.
      </p>
    </div>
  );
}
