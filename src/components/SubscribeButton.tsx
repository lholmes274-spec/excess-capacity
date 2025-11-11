"use client";

import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function SubscribeButton() {
  const user = useUser(); // ✅ get the logged-in user
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      alert("Please sign in to subscribe.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-subscription-session", {
        method: "POST",
        body: JSON.stringify({ userId: user.id }), // ✅ include user ID
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // ✅ redirect to Stripe checkout
      } else {
        alert("Unable to start checkout. Please try again.");
        console.error("Missing session URL:", data);
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("There was an issue connecting to Stripe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
    >
      {loading ? "Redirecting..." : "Subscribe for $9.99/month"}
    </button>
  );
}
