// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import SubscribeButton from "@/components/SubscribeButton";

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setSession(session);

      // 🔥 Check subscription
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", session.user.id)
        .single();

      if (profile?.is_subscribed === true) {
        router.push("/you-are-pro");
        return;
      }

      setLoading(false);
    };

    load();
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
      <SubscribeButton session={session} />
    </div>
  );
}
