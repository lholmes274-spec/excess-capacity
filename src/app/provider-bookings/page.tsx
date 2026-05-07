// @ts-nocheck

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default function ProviderBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

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
        listings (
          id,
          title,
          images
        )
    `)
    .eq("owner_id", user.id)
    .order("booking_date", { ascending: false });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading bookings...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          Provider Bookings
        </h1>

        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-6 shadow text-gray-600">
            No bookings found.
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/provider-bookings/${booking.id}`}
                className="block"
              >
                <div className="bg-white rounded-xl shadow p-5 hover:shadow-lg transition cursor-pointer border">
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}