// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("active");

  useEffect(() => {
    fetchBookings();
  }, [view]);

  async function fetchBookings() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
       .from("bookings")
       .select(`
        *,
        listings!left(*)
    `)
    .eq("owner_id", user.id)
    .eq("archived_by_provider", view === "hidden")
    .order("created_at", { ascending: false });

    console.log("🔥 BOOKINGS:", data);
    console.log("🔥 ERROR:", error);

      if (error) {
        console.error("❌ Bookings error:", error);
      } else {
        setBookings(data || []);
      }
    } catch (err) {
      console.error("❌ Unexpected error:", err);
    }

    setLoading(false);
  }

  async function toggleBooking(booking) {
  const isHidden = booking.archived_by_provider;

  const confirmed = confirm(
    isHidden
      ? "Restore this booking to active view?"
      : "Remove this booking from your view?"
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("bookings")
    .update({
      archived_by_provider: !isHidden,
    })
    .eq("id", booking.id);

  if (!error) {
    setBookings((prev) =>
      prev.filter((b) => b.id !== booking.id)
    );
  }
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading bookings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Provider Bookings
        </h1>

        <div className="flex justify-center gap-4 mb-6">
  <button
    onClick={() => setView("active")}
    className={`px-5 py-2 rounded-full text-sm font-semibold transition shadow ${
      view === "active"
        ? "bg-green-600 text-white shadow-md"
        : "bg-green-100 text-green-700 hover:bg-green-200"
    }`}
  >
    🟢 Active
  </button>

  <button
    onClick={() => setView("hidden")}
    className={`px-5 py-2 rounded-full text-sm font-semibold transition shadow ${
      view === "hidden"
        ? "bg-gray-600 text-white shadow-md"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    🗑️ Hidden
  </button>
</div>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow text-gray-600">
            No bookings found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/provider-bookings/${booking.id}`}
                className="block"
              >
                <div className="relative bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition overflow-hidden">

                  <img
                    src={
                      booking.listings?.image_urls?.[0] ||
                      booking.listings?.image_url ||
                      "/no-image.png"
                    }
                    alt={booking.listings?.title || "Booking"}
                    className="w-full h-48 object-cover cursor-pointer"
                  />

                  <div className="p-4">

                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {booking.listings?.title || "Booking Request"}
                        </h2>

                        <p className="text-sm text-gray-500">
                          {booking.user_email}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : booking.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : booking.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <strong>Date:</strong>{" "}
                        {booking.start_date || "N/A"}
                      </p>

                      {booking.time_slot && (
                        <p>
                          <strong>Time:</strong>{" "}
                          {booking.time_slot}
                        </p>
                      )}

                      <p>
                        <strong>Total:</strong> $
                        {booking.amount_paid || 0}
                      </p>

                      {booking.appointment_type && (
                        <p>
                          <strong>Appointment:</strong>{" "}
                          {booking.appointment_type}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      <div className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium shadow">
                        View Booking Details
                      </div>

                         <button
                           onClick={(e) => {
                            e.preventDefault();
                            toggleBooking(booking);
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow hover:bg-gray-300 transition"
                       >
                          {booking.archived_by_provider
                            ? "Restore"
                            : "Remove from my view"}
                        </button>

                    </div>

                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}