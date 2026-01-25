// @ts-nocheck
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const listing_id = searchParams.get("listing_id");
  const days = searchParams.get("days"); // optional
  const transaction_type = searchParams.get("transaction_type"); // ✅ READ INTENT
  const start_date = searchParams.get("start_date");
  const end_date = searchParams.get("end_date");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createCheckoutSession() {
      if (!listing_id || !transaction_type) {
        setError("Missing listing or transaction type");
        setLoading(false);
        return;
      }

      if (transaction_type === "booking" && (!start_date || !end_date)) {
        setError("Missing booking dates");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            listing_id,
            transaction_type, // ✅ PASS INTENT
            start_date,
            end_date,
            days: Number(days) || 1,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to create session: ${res.status}`);
        }

        const { url } = await res.json();
        if (url) {
          window.location.href = url;
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
  }, [listing_id, days, transaction_type, start_date, end_date]);

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
          className="px-4 py-2 bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 transition mb-4"
        >
          Go Back
        </a>

        <p className="text-sm text-gray-600 text-center max-w-md">
          If you have any questions, please contact Prosperity Voyage LLC at{" "}
          <span className="font-medium">(404) 913-6097</span> or email{" "}
          <span className="font-medium">support@prosperityhub.app</span>.
        </p>
      </main>
    );

  return null;
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="text-center mt-20">Loading checkout...</div>}
    >
      <CheckoutContent />
    </Suspense>
  );
}
