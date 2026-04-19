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

        // 🔥 GET STRIPE SESSION + CREATE BOOKING IF NOT EXISTS
        let bookingData = await pollForBooking(session_id);

        if (!bookingData) {
          try {
            // call your server to fetch Stripe session
            const res = await fetch(`/api/get-session?session_id=${session_id}`);
            const session = await res.json();

            const meta = session.metadata;
                
            if (!meta?.listing_id) {
             throw new Error("Missing metadata");
         }

       // create booking in Supabase
       const { data: newBooking, error } = await supabase
         .from("bookings")
         .insert([
           {
            listing_id: meta.listing_id,
            user_id: meta.user_id !== "0" ? meta.user_id : null,
            user_email: meta.user_email || loggedInEmail || null,
            guest_email: meta.user_email || loggedInEmail || null,
            booker_email: meta.user_email || loggedInEmail || null,
            start_date: meta.start_date || null,
            end_date: meta.end_date || null,
            days: meta.days ? Number(meta.days) : null,
            amount_paid: session.amount_total / 100,
            status: "completed",
            stripe_session_id: session_id,
          },
        ])
        .select()
        .single();

      if (error) {
       console.error("Booking insert error:", error);
      }

      bookingData = newBooking;
      // 🔔 Trigger provider email notification
      if (newBooking?.id && meta?.listing_id) {
        try {
          // 🔥 get provider (owner_id)
          const { data: listingData } = await supabase
            .from("listings")
            .select("owner_id")
            .eq("id", meta.listing_id)
            .single();

          if (!listingData?.owner_id) {
            console.error("❌ No owner_id found");
            return;
          }

         await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/booking-notification`, {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             booking_id: newBooking.id,
             receiver_id: listingData.owner_id,
             booking_status: "completed",
          }),
        });

       console.log("✅ Booking email triggered");
      } catch (err) {
        console.error("❌ Email trigger failed:", err);
      }
    }

    } catch (err) {
      console.error("Session fetch / booking error:", err);
    }
   }

        // ⏳ Subscription-safe behavior:
        // Keep showing processing instead of erroring
        if (!bookingData) {
          setLoading(false);
          return;
        }

        setBooking(bookingData);
        setLoading(false);

        if (bookingData?.id && bookingData?.listing_id) {
           try {
            const { data: listingData } = await supabase
              .from("listings")
              .select("owner_id")
              .eq("id", bookingData.listing_id)
              .single();

            if (listingData?.owner_id) {
              await fetch("/api/booking-notification", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  booking_id: bookingData.id,
                  receiver_id: listingData.owner_id,
                  booking_status: bookingData.status || "completed",
                }),
              });

              console.log("✅ Email triggered (guaranteed)");
            }
          } catch (err) {
            console.error("❌ Email trigger failed:", err);
          }
        }

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
            <p className="mb-2">{provider?.full_name || "Listing Provider"}</p>
            <p className="text-sm text-gray-600">
              To message the provider, go to <span className="font-semibold">My Orders</span> from your dashboard and open this booking.
            </p>

            <Link
              href="/my-bookings"
              className="inline-block mt-3 px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
            >
              View My Orders
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
