// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProviderBookingDetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [booking, setBooking] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          listings (
            id,
            title,
            description,
            baseprice,
            pricing_type,
            city,
            state,
            image_url,
            image_urls
          ),
          profiles (
            display_name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error loading booking:", error);
        return;
      }

      setBooking(data);
    }

    load();
  }, [id]);

  if (!booking) return <p className="p-6">Loading...</p>;

  const listing = booking.listings || {};
  const images = listing.image_urls || [];
  const mainImage = listing.image_url || images[0];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* 🔹 TITLE */}
      <h1 className="text-2xl font-bold">
        {listing.title || "Booking Details"}
      </h1>

      {/* 🔹 IMAGE */}
      {mainImage && (
        <img
          src={mainImage}
          className="w-full max-h-[400px] object-cover rounded-lg"
        />
      )}

      {/* 🔹 GALLERY */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-20 h-20 object-cover rounded border"
            />
          ))}
        </div>
      )}

      {/* 🔹 DESCRIPTION */}
      <p className="text-gray-700">
        {listing.description}
      </p>

      {/* 🔹 LOCATION */}
      <p className="font-medium">
        📍 {listing.city}, {listing.state}
      </p>

      {/* 🔹 BOOKING INFO */}
      <div className="bg-gray-100 p-4 rounded space-y-2">
        <p><strong>Status:</strong> {booking.status}</p>

        <p>
          <strong>Total:</strong>{" "}
          ${booking.final_amount || booking.amount || listing.baseprice || 0}
        </p>

        {booking.start_date && (
          <p>
            <strong>Start:</strong>{" "}
            {new Date(booking.start_date).toLocaleDateString()}
          </p>
        )}

        {booking.end_date && (
          <p>
            <strong>End:</strong>{" "}
            {new Date(booking.end_date).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* 🔹 CUSTOMER INFO */}
      <div className="bg-gray-50 p-4 rounded space-y-2">
        <h2 className="font-semibold">Customer Info</h2>

        <p>
          <strong>Name:</strong>{" "}
          {booking.profiles?.display_name || "N/A"}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {booking.profiles?.email || booking.user_email || "N/A"}
        </p>
      </div>

    </div>
  );
}