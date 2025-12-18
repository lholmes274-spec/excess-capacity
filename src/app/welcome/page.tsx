"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function WelcomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        router.replace("/login");
        return;
      }

      setCheckingAuth(false);
    };

    checkSession();
  }, [router]);

  // Prevents page flash while checking auth
  if (checkingAuth) {
    return null;
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-20 text-center">
      <h1 className="text-3xl font-bold mb-4">
        Email Confirmed 🎉
      </h1>

      <p className="text-gray-600 mb-6">
        Your account is now active.
        <br />
        You may safely close this window.
      </p>

      <button
        onClick={() => router.push("/dashboard")}
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Continue to Dashboard
      </button>
    </main>
  );
}
