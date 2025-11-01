"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const listing_id = searchParams.get("listing_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createCheckoutSession() {
      if (!listing_id) {
        setError("Missing listing ID");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listing_id }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create session: ${res.status}`);
        }

        const { url } = await res.json();
        if (url) {
          window.location.href = url; // Redirect to Stripe Checkout
        } else {
          throw new Error("No redirect URL returned from API");
        }
      } catch (err: any) {
        console.error("Checkout error:", err);
        setError(err.message || "Checkout failed");
        setLoading(false);
      }
    }

    createCheckoutSession();
  }, [listing_id]);

  if (loading)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600">
        <p className="text-lg font-medium">Redirecting to checkout...</p>
      </main>
    );

  if (error)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600">
        <p className="text-red-500 text-lg mb-3">❌ {error}</p>
        <a
          href="/"
          className="px-4 py-2 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 transition"
        >
          Go Back
        </a>
      </main>
    );

  return null;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
