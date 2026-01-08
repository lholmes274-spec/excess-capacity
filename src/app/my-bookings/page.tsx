// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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
      setUserEmail(user.email);

      const { data, error } = await supabase
        .from("bookings")
        .select("*, listings(*)")
        .eq("user_id", user.id) // ✅ STRICT ownership match
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading bookings:", error);
      } else {
        setBookings(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function deleteBooking(bookingId) {
    const confirmed = confirm("Are you sure you want to delete this booking?");
    if (!confirmed) return;

    setDeletingId(bookingId);

    const res = await fetch("/api/delete-booking", {
      method: "POST",
      body: JSON.stringify({ booking_id: bookingId }),
    });

    if (!res.ok) {
      alert("Failed to delete booking.");
      setDeletingId(null);
      return;
    }

    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    setDeletingId(null);
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your bookings...</p>
      </div>
    );

  if (!userId)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-xl font-semibold text-red-600 mb-4">
          You must be logged in to view bookings.
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
      <h1 className="text-3xl font-bold mb-6 text-center">My Bookings</h1>

      {bookings.length === 0 ? (
        <p className="text-center text-gray-600">You have no bookings yet.</p>
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

            return (
              <div
                key={b.id}
                className="relative bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                <Link href={`/my-bookings/${b.id}`}>
                  <img
                    src={thumbnail}
                    alt={listing?.title}
                    className="w-full h-48 object-cover"
                  />
                </Link>

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
                    You paid: ${b.amount_paid}
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
                    className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium shadow hover:bg-green-700 transition"
                  >
                    View Conversation
                  </Link>
                </div>

                <button
                  onClick={() => deleteBooking(b.id)}
                  disabled={deletingId === b.id}
                  className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-sm shadow hover:bg-red-700 transition"
                >
                  {deletingId === b.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
