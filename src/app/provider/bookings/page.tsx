// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [finalizingId, setFinalizingId] = useState(null);
  const [finalHours, setFinalHours] = useState({});

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("bookings")
        .select("*, listings(*)")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading provider bookings:", error);
      } else {
        setBookings(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function finalizeBooking(bookingId) {
    const booking = bookings.find((b) => b.id === bookingId);

    // 🔒 HARD STOP — already finalized
    if (booking?.final_hours != null) {
      alert("This booking has already been finalized.");
      return;
    }

    const hours = Number(finalHours[bookingId]);

    if (!hours || hours <= 0) {
      alert("Please enter the final hours worked.");
      return;
    }

    setFinalizingId(bookingId);

    try {
      const res = await fetch(`/api/bookings/${bookingId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_hours: hours }),
      });

      const data = await res.json();

      // ✅ SUCCESS PATH (even if Stripe adjustment was skipped)
      if (data?.success) {
        const { data: refreshed } = await supabase
          .from("bookings")
          .select("*, listings(*)")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false });

        setBookings(refreshed || []);
        return;
      }

      // ❌ REAL ERROR FROM BACKEND
      if (!res.ok) {
        alert(data?.error || "Unable to finalize booking.");
        return;
      }
    } catch (err) {
      console.error(err);
      alert("Error finalizing booking. Please try again.");
    } finally {
      setFinalizingId(null);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading bookings on your listings...</p>
      </div>
    );

  if (!userId)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-xl font-semibold text-red-600 mb-4">
          You must be logged in to view bookings on your listings.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Login
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Bookings on My Listings
      </h1>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-600">
          No one has booked your listings yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map((b) => {
            const listing = b.listings;
            const thumbnail =
              listing?.image_urls?.[0] ||
              listing?.image_url ||
              "/no-image.png";

            const priceTypeDisplay = listing?.pricing_type
              ? listing.pricing_type.replace("_", " ")
              : "";

            const isHourly = listing?.pricing_type === "per_hour";
            const isFinalized = b.final_hours != null;

            return (
              <div
                key={b.id}
                className="relative bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                <img
                  src={thumbnail}
                  alt={listing?.title}
                  className="w-full h-48 object-cover"
                />

                <div className="p-4">
                  <h2 className="font-semibold text-lg mb-1">
                    {listing?.title}
                  </h2>

                  <p className="text-gray-500 text-sm mb-2">
                    {listing?.city}, {listing?.state}
                  </p>

                  <p className="text-green-700 font-medium text-sm">
                    ${listing?.baseprice}{" "}
                    {priceTypeDisplay ? `/ ${priceTypeDisplay}` : ""}
                  </p>

                  <p className="text-gray-700 font-semibold mt-1">
                    Amount paid: ${b.amount_paid}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Booked on:{" "}
                    {new Date(b.booking_date).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {b.status}
                    </span>
                  </p>

                  <Link
                    href={`/booking/${b.id}/messages`}
                    className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                  >
                    View Conversation
                  </Link>

                  {/* 🔒 FINALIZE HOURS (HOURLY ONLY) */}
                  {isHourly && (
                    <div className="mt-4 border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Final hours worked
                      </label>

                      <input
                        type="number"
                        min="1"
                        disabled={isFinalized}
                        className={`w-full border rounded-md px-3 py-2 text-sm mb-2 ${
                          isFinalized ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        value={
                          isFinalized
                            ? b.final_hours
                            : finalHours[b.id] || ""
                        }
                        onChange={(e) =>
                          setFinalHours({
                            ...finalHours,
                            [b.id]: e.target.value,
                          })
                        }
                      />

                      {isFinalized ? (
                        <p className="text-sm text-green-700 font-medium">
                          ✅ Payment completed — this booking is finalized and
                          can no longer be changed.
                        </p>
                      ) : (
                        <button
                          onClick={() => finalizeBooking(b.id)}
                          disabled={finalizingId === b.id}
                          className={`w-full px-4 py-2 rounded-lg text-sm font-semibold text-white ${
                            finalizingId === b.id
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {finalizingId === b.id
                            ? "Finalizing…"
                            : "Finalize & Charge"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
