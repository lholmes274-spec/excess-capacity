// @ts-nocheck
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

/* -----------------------------
   Local Time Formatting
------------------------------*/
function formatLocalTime(utcString) {
  if (!utcString) return "Processing…";
  const date = new Date(utcString + "Z");
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* -----------------------------
   Loading Component
------------------------------*/
function Loading({ message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600 text-center p-6">
      <p className="text-lg font-semibold mb-2">{message}</p>
      <p className="text-sm text-gray-500">
        This can take a moment. Please don’t refresh.
      </p>
    </div>
  );
}

/* -----------------------------
   Success Page
------------------------------*/
function SuccessBookingContent() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<any>(null);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);

  async function pollForBooking(session_id: string) {
    const maxAttempts = 20; // longer for subscriptions
    const delay = 1500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("stripe_session_id", session_id)
        .maybeSingle();

      if (data) return data;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return null;
  }

  useEffect(() => {
    async function load() {
      if (!session_id) {
        setLoading(false);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        setLoggedInEmail(userData?.user?.email || null);

        const bookingData = await pollForBooking(session_id);

        // ⏳ Subscription-safe behavior:
        // Keep showing processing instead of erroring
        if (!bookingData) {
          setLoading(false);
          return;
        }

        setBooking(bookingData);
        setLoading(false);

        const { data: listingData } = await supabase
          .from("listings")
          .select("*")
          .eq("id", bookingData.listing_id)
          .single();

        setListing(listingData);

        let providerData = null;

        if (listingData?.user_id) {
          const { data } = await supabase
           .from("profiles")
           .select("id, full_name")
           .eq("id", listingData.user_id)
           .single();
          providerData = data;
        }

        setProvider(providerData);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    load();
  }, [session_id]);

  if (loading) {
    return <Loading message="Finalizing your booking…" />;
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
        <p className="text-lg text-gray-700 mb-4">
          Your payment was successful.
        </p>
        <p className="text-gray-500 mb-6">
          Your booking is still being finalized. You’ll be able to view it shortly.
        </p>
        <Link href="/" className="px-6 py-3 bg-gray-700 text-white rounded-lg">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isLoggedIn = Boolean(loggedInEmail);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-6 text-center">

      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 10 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </motion.div>

      <h1 className="text-3xl font-extrabold text-green-700 mb-2">
        Booking Confirmed 🎉
      </h1>

      <p className="text-lg font-semibold text-green-800 mb-8">
        {formatLocalTime(booking.created_at)}
      </p>

      {isLoggedIn && (
        <div className="max-w-xl w-full bg-white shadow-lg border rounded-2xl p-6 text-left space-y-6">

      {listing && (
          <div>
            <h2 className="text-lg font-semibold text-green-700 mb-2">
              📍 Booking Location
            </h2>
            <p>
              {listing.address_line1}<br />
              {listing.address_line2 && <>{listing.address_line2}<br /></>}
              {listing.city}, {listing.state} {listing.zip}
            </p>
          </div>
        )}

          {listing && listing.private_instructions && (
            <div>
              <h2 className="text-lg font-semibold text-green-700 mb-2">
                🔒 Private Access Instructions
              </h2>
              <p className="whitespace-pre-line text-gray-700">
                {listing.private_instructions}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold text-green-700 mb-2">
              👤 Provider
            </h2>
            <p className="mb-3">{provider?.full_name || "Listing Provider"}</p>

            <Link
              href={`/booking/${booking.id}/messages`}
              className="inline-block px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Message Provider
            </Link>
          </div>
        </div>
      )}

      <Link href="/" className="mt-10 px-6 py-3 bg-green-600 text-white rounded-lg">
        Back to Marketplace
      </Link>
    </div>
  );
}

export default function SuccessBookingWrapper() {
  return (
    <Suspense fallback={<Loading message="Loading booking details…" />}>
      <SuccessBookingContent />
    </Suspense>
  );
}
