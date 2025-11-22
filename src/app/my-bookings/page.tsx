// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserEmail(null);
        setLoading(false);
        return;
      }

      setUserEmail(user.email);

      // Fetch bookings for this user
      const { data, error } = await supabase
        .from("bookings")
        .select("*, listings(*)")
        .eq("user_email", user.email)
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your bookings...</p>
      </div>
    );

  if (!userEmail)
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

            return (
              <Link
                key={b.id}
                href={`/my-bookings/${b.id}`} // Step 5
                className="block bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition overflow-hidden"
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

                  <p className="font-medium text-green-700">
                    ${b.amount_paid} paid
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Booked on: {new Date(b.booking_date).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {b.status}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
