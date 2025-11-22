// @ts-nocheck
"use client";

import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BookingDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch booking
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (!bookingData) {
        setBooking(null);
        setLoading(false);
        return;
      }

      setBooking(bookingData);

      // Fetch listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("id", bookingData.listing_id)
        .single();

      setListing(listingData);
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading) return <div className="p-8 text-gray-600">Loading…</div>;

  if (!booking) {
    return (
      <main className="p-8 text-center">
        <h1 className="text-xl text-red-600">Booking not found.</h1>
        <Link href="/my-bookings" className="text-blue-600 underline mt-4 block">
          Back to My Bookings
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-orange-700 mb-6">
        Booking Details
      </h1>

      <div className="bg-white border rounded-xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-3">{listing?.title}</h2>

        <p className="mb-3">
          <strong>Amount Paid:</strong> ${booking.amount_paid}
        </p>

        <p className="mb-3">
          <strong>Status:</strong> {booking.status}
        </p>

        <p className="mb-3 text-gray-700">
          <strong>Private Address:</strong><br />
          {listing?.address_line1}<br />
          {listing?.address_line2 && <>{listing.address_line2}<br /></>}
          {listing?.city}, {listing?.state} {listing?.zip}
        </p>

        {listing?.private_instructions && (
          <div className="mt-4 bg-green-50 border p-4 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-2">Private Instructions</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {listing.private_instructions}
            </p>
          </div>
        )}
      </div>

      <Link
        href="/my-bookings"
        className="mt-6 inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
      >
        Back to My Bookings
      </Link>
    </main>
  );
}
