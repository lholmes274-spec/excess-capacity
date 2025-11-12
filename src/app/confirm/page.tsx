"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConfirmPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState(
    "Verifying your account… please wait"
  );

  useEffect(() => {
    const handleSession = async () => {
      // ✅ Check for existing session (Supabase auto-restores after email confirm)
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        // 🔒 Immediately log the user out to force manual login
        await supabase.auth.signOut();
        setStatusMessage("✅ Email confirmed — please log in.");
        setTimeout(() => {
          router.push("/login");
        }, 2500);
        return;
      }

      // ✅ Wait for Supabase to establish session after confirmation
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session) {
            // 🔒 Sign out again to clear auto-login session
            await supabase.auth.signOut();
            setStatusMessage("✅ Email confirmed — please log in.");
            setTimeout(() => {
              router.push("/login");
            }, 2500);
          } else {
            setStatusMessage(
              "⚠️ Unable to verify session. Please log in manually."
            );
            setTimeout(() => {
              router.push("/login");
            }, 3000);
          }
        }
      );

      return () => listener.subscription.unsubscribe();
    };

    // ✅ Handle “new tab” case for email confirmation
    if (window.opener && window.opener.location.href.includes("/signup")) {
      window.opener.location.href = "https://prosperityhub.app/confirm";
      window.close();
      return;
    }

    handleSession();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-gray-700">
      <h1 className="text-2xl font-semibold mb-4 text-center">
        {statusMessage}
      </h1>
      <p className="text-sm text-gray-500 text-center">
        You’ll be redirected to the login page shortly.
      </p>
    </div>
  );
}
