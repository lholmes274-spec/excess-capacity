// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [secureError, setSecureError] = useState<string | null>(null);
  const [listing, setListing] = useState<any>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAndLoad() {
      if (!session_id) {
        setSecureError("Missing session ID");
        setLoading(false);
        return;
      }

      try {
        //---------------------------
        // 1. GET LOGGED-IN USER
        //---------------------------
        const { data: userData } = await supabase.auth.getUser();
        const loggedInEmail = userData?.user?.email;

        if (!loggedInEmail) {
          setSecureError("You must be logged in to view booking details.");
          setLoading(false);
          return;
        }

        //---------------------------
        // 2. VERIFY STRIPE SESSION
        //---------------------------
        const stripeRes = await fetch("/api/verify-stripe-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id }),
        });

        if (!stripeRes.ok) {
          setSecureError("Unable to verify your payment.");
          setLoading(false);
          return;
        }

        const stripeData = await stripeRes.json();

        if (!stripeData || !stripeData.metadata) {
          setSecureError("No metadata found.");
          setLoading(false);
          return;
        }

        const {
          user_email,
          listing_id,
        } = stripeData.metadata;

        setSessionEmail(user_email);

        //---------------------------
        // 3. SECURITY CHECK — emails must match
        //---------------------------
        if (loggedInEmail !== user_email) {
          setSecureError(
            "Access denied. This booking does not belong to your account."
          );
          setLoading(false);
          return;
        }

        //---------------------------
        // 4. FETCH LISTING
        //---------------------------
        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("*")
          .eq("id", listing_id)
          .single();

        if (listingError || !listingData) {
          setSecureError("Listing not found.");
          setLoading(false);
          return;
        }

        setListing(listingData);
        setLoading(false);
      } catch (err) {
        console.error("Success page error:", err);
        setSecureError("Unexpected error loading booking.");
        setLoading(false);
      }
    }

    verifyAndLoad();
  }, [session_id]);

  // --------------------------------------------------------
  // LOADING VIEW
  // --------------------------------------------------------
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-600 text-lg">Loading your booking…</p>
      </main>
    );
  }

  // --------------------------------------------------------
  // SECURITY ERROR VIEW
  // --------------------------------------------------------
  if (secureError) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center p-6">
        <p className="text-red-600 text-xl font-semibold mb-3">
          ❌ {secureError}
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 transition"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  // --------------------------------------------------------
  // SUCCESS VIEW with PRIVATE INSTRUCTIONS
  // --------------------------------------------------------
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
        Payment Successful 🎉
      </motion.h1>

      <motion.p
        className="text-gray-700 mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Thank you for your purchase through{" "}
        <span className="font-semibold text-green-700">ProsperityHub</span>.
        Your secure booking details are shown below.
      </motion.p>

      {/* PRIVATE DETAILS SECTION */}
      <div className="max-w-xl w-full bg-white shadow-lg border border-gray-200 rounded-2xl p-6 text-left">
        <h2 className="text-xl font-semibold text-green-700 mb-4">
          🔒 Your Booking Details
        </h2>

        {/* FULL ADDRESS */}
        <p className="mb-3">
          <strong>Address:</strong><br/>
          {listing.address_line1}<br/>
          {listing.address_line2 && <>{listing.address_line2}<br/></>}
          {listing.city}, {listing.state} {listing.zip}
        </p>

        {/* PRIVATE INSTRUCTIONS */}
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

        {/* PUBLIC PICKUP INFO */}
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

      {/* Back Button */}
      <div className="mt-10">
        <Link
          href="/"
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          Back to Marketplace
        </Link>
      </div>

      <footer className="mt-10 text-sm text-gray-500">
        © {new Date().getFullYear()} ProsperityHub. All rights reserved.
      </footer>
    </div>
  );
}
