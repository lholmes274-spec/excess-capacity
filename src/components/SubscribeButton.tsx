// @ts-nocheck
"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface SubscribeButtonProps {
  session: any;
}

export default function SubscribeButton({ session }: SubscribeButtonProps) {
  const router = useRouter();

  const handleSubscribe = async () => {
    if (!session?.user) {
      alert("Please sign in to subscribe.");
      router.push("/login");
      return;
    }

    // 🔥 STEP 1 — Check profile subscription status
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_subscribed")
      .eq("id", session.user.id)
      .single();

    if (profile?.is_subscribed === true) {
      alert("You are already a Pro Member.");
      router.push("/dashboard");
      return;
    }

    // 🔥 STEP 2 — Start Stripe checkout
    try {
      const response = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id }),
      });

      const data = await response.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting subscription.");
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md transition"
    >
      Subscribe for $9.99/month
    </button>
  );
}
