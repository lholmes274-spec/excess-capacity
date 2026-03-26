// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

export default function ProviderBookingPage() {
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (!bookingData) return;

      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("id", bookingData.listing_id)
        .single();

      setBooking(bookingData);
      setListing(listingData);
    }

    load();
  }, [id]);

  if (!booking || !listing) return <p>Loading...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Booking Details</h1>

      <p><strong>Status:</strong> {booking.status}</p>
      <p><strong>Total:</strong> ${booking.final_amount}</p>

      <hr className="my-4" />

      <h2 className="font-semibold mb-2">Customer Info</h2>
      <p>Name: {booking.guest_name}</p>
      <p>Email: {booking.guest_email || booking.user_email}</p>
      <p>Phone: {booking.guest_phone}</p>

      <hr className="my-4" />

      <h2 className="font-semibold mb-2">Listing Info</h2>
      <p>{listing.title}</p>
    </div>
  );
}