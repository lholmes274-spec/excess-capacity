// @ts-nocheck
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

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
   Success Page Content
------------------------------*/
function SuccessBookingContent() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [secureError, setSecureError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    async function load() {
      if (!session_id) {
        setSecureError("Missing session ID.");
        setLoading(false);
        return;
      }

      try {
        // 🔹 1) Check login status
        const { data: userData } = await supabase.auth.getUser();
        const email = userData?.user?.email || null;
        setLoggedInEmail(email);

        // 🔹 2) Fetch booking from Supabase
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("stripe_session_id", session_id)
          .single();

        if (bookingError || !bookingData) {
          setSecureError("Booking not found. Payment may still be processing.");
          setLoading(false);
          return;
        }

        setBooking(bookingData);

        // 🔹 3) Fetch listing details
        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("*")
          .eq("id", bookingData.listing_id)
          .single();

        if (listingError || !listingData) {
          setSecureError("Listing details unavailable.");
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
     Stripe Error
  ------------------------------*/
  if (secureError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6">
        <p className="text-red-600 text-xl font-semibold mb-3">❌ {secureError}</p>
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
     SUCCESS PAGE (Guest + Logged-In)
  ------------------------------*/
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 text-center p-6">

      {/* Animated Checkmark */}
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

      <motion.h1
        className="text-3xl sm:text-4xl font-extrabold text-green-700 mb-2"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        Booking Confirmed 🎉
      </motion.h1>

      <motion.p
        className="text-gray-700 mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Thank you! Your booking is complete. The details are shown below.
      </motion.p>

      {/* GUEST VIEW */}
      {!isLoggedIn && (
        <div className="max-w-xl w-full bg-white shadow-lg border border-gray-200 rounded-2xl p-6 text-left">
          <h2 className="text-xl font-semibold text-green-700 mb-2">
            Public Pickup Instructions
          </h2>

          {listing.pickup_instructions ? (
            <p className="text-gray-700 whitespace-pre-line">
              {listing.pickup_instructions}
            </p>
          ) : (
            <p className="text-gray-500">No pickup instructions provided.</p>
          )}

          <p className="mt-4 text-sm text-gray-500">
            Log in to view the private address and full booking details.
          </p>
        </div>
      )}

      {/* LOGGED-IN VIEW */}
      {isLoggedIn && (
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

          {listing.private_instructions && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-700 mb-2">
                Private Instructions
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {listing.private_instructions}
              </p>
            </div>
          )}

          {listing.pickup_instructions && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-700 mb-2">
                Pickup Instructions
              </h3>
              <p className="text-gray-700 whitespace-pre-line">
                {listing.pickup_instructions}
              </p>
            </div>
          )}
        </div>
      )}

      <Link
        href="/"
        className="mt-10 px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
      >
        Back to Marketplace
      </Link>

      <footer className="mt-10 text-sm text-gray-500">
        © {new Date().getFullYear()} ProsperityHub. All rights reserved.
      </footer>
    </div>
  );
}

/* -----------------------------
   Wrapper
------------------------------*/
export default function SuccessBookingWrapper() {
  return (
    <Suspense fallback={<Loading message="Loading booking details…" />}>
      <SuccessBookingContent />
    </Suspense>
  );
}
