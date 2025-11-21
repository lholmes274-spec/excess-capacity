// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import SubscribeButton from "@/components/SubscribeButton";

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null); // 🆕 added

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login"); // 🆕 changed from /signup → /login
      } else {
        setSession(session); // 🆕 store session
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-700">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-4">
        Activate Your Prosperity Hub Account
      </h1>
      <p className="text-gray-600 mb-6">
        Subscribe for <strong>$9.99/month</strong> to unlock full seller access
        and premium features.
      </p>
      <SubscribeButton session={session} /> {/* 🆕 pass session */}
    </div>
  );
}
