// @ts-nocheck
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

/* -----------------------------
   Local Time Formatting — FIXED
------------------------------*/
function formatLocalTime(utcString) {
  if (!utcString) return "Unknown time";

  // Ensure timestamp is interpreted as UTC
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600">
      <p className="text-lg">{message}</p>
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
  const [secureError, setSecureError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);

  /* -----------------------------------------
     POLL FOR BOOKING — 5 seconds total
  -----------------------------------------*/
  async function pollForBooking(session_id: string) {
    const maxAttempts = 5;
    const delay = 1000;

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
        setSecureError("Missing session ID.");
        setLoading(false);
        return;
      }

      try {
        // Load logged-in user
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email || null;
        setLoggedInEmail(email);

        // Load booking
        const bookingData = await pollForBooking(session_id);

        if (!bookingData) {
          setSecureError(
            "Your payment is complete, but your booking is still processing. Please refresh in a moment."
          );
          setLoading(false);
          return;
        }

        setBooking(bookingData);

        // Fetch listing
        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("*")
          .eq("id", bookingData.listing_id)
          .single();

        if (listingError) {
          console.error("Listing fetch error:", listingError);
          setSecureError("Unable to load listing details.");
          setLoading(false);
          return;
        }

        setListing(listingData);
        setLoading(false);
      } catch (err) {
        console.error("Success page error:", err);
        setSecureError("Unexpected error loading booking details.");
        setLoading(false);
      }
    }

    load();
  }, [session_id]);

  /* -----------------------------
     Loading
  ------------------------------*/
  if (loading) return <Loading message="Loading your booking…" />;

  /* -----------------------------
     Error Message
  ------------------------------*/
  if (secureError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6">
        <p className="text-red-600 text-xl font-semibold mb-3">
          ❌ {secureError}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition mb-4"
        >
          Refresh Page
        </button>

        <Link
          href="/"
          className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 transition"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const isLoggedIn = Boolean(loggedInEmail);

  /* -----------------------------
     SUCCESS PAGE UI
  ------------------------------*/
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 text-center p-6">

      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 10 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </motion.div>

      <h1 className="text-3xl font-extrabold text-green-700 mb-2">
        Booking Confirmed 🎉
      </h1>

      {/* Local Time */}
      <p className="text-lg font-semibold text-green-800 mb-8">
        {formatLocalTime(booking?.created_at)}
      </p>

      {/* GUEST VIEW */}
      {!isLoggedIn ? (
        <div className="max-w-xl w-full bg-white shadow-lg border border-gray-200 rounded-2xl p-6 text-left">
          <h2 className="text-xl font-semibold text-green-700 mb-2">
            Public Pickup Instructions
          </h2>
          <p className="text-gray-700 whitespace-pre-line">
            {listing.pickup_instructions}
          </p>
        </div>
      ) : (
        /* LOGGED-IN VIEW */
        <div className="max-w-xl w-full bg-white shadow-lg border border-gray-200 rounded-2xl p-6 text-left">
          <h2 className="text-xl font-semibold text-green-700 mb-4">
            🔒 Your Booking Details
          </h2>

          <p className="mb-3">
            <strong>Address:</strong><br />
            {listing.address_line1}<br />
            {listing.address_line2 && <>{listing.address_line2}<br /></>}
            {listing.city}, {listing.state} {listing.zip}
          </p>
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
