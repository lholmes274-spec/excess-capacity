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
            image_urls,
            contact_name,
            contact_email,
            contact_phone
          )
        `)
        .eq("id", id)
        .single();

      console.log("BOOKING DATA:", data);
      console.log("BOOKING ERROR:", error);

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

  // ✅ ADDED (helper function)
  function formatPricingType(type) {
    if (!type) return "";
    const map = {
      per_hour: "hour",
      per_day: "day",
      per_night: "night",
      per_week: "week",
      per_month: "month",
      per_service: "service",
      per_item: "item",
      per_use: "use",
      per_trip: "trip",
    };
    return map[type] || type.replace("per_", "");
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* 🔹 TITLE */}
      <h1 className="text-3xl font-bold text-orange-700">
        {listing.title || "Booking Details"}
      </h1>

      {/* 🔹 IMAGE */}
      {mainImage && (
        <img
          src={mainImage}
          className="w-full h-[420px] object-cover rounded-xl shadow"
        />
      )}

      {/* 🔹 GALLERY */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-2">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
            />
          ))}
        </div>
      )}

      {/* 🔹 DESCRIPTION */}
      <p className="text-gray-700 leading-relaxed">
        {listing.description}
      </p>

      {/* 🔹 LOCATION */}
      <p className="font-medium text-gray-800">
        📍 {listing.city}, {listing.state}
      </p>

      {/* ✅ ADDED PRICE (only new UI block) */}
      <p className="text-2xl font-bold text-green-600">
        {listing.currency || "$"}{listing.baseprice}{" "}
        <span className="text-sm font-normal text-gray-500">
          / {formatPricingType(listing.pricing_type)}
        </span>
      </p>

      {/* 🔹 BOOKING INFO */}
      <div className="bg-gray-100 p-4 rounded space-y-2">
        <p><strong>Status:</strong> {booking.status}</p>

        <p>
          <strong>Total:</strong>{" "}
          {listing.currency || "$"}
          {booking.final_amount || booking.amount || listing.baseprice || 0}
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

      {/* 🔵 CUSTOMER INFO */}
      <div className="bg-gray-50 p-4 rounded space-y-2">
        <h2 className="font-semibold">Customer Info</h2>

        <p>
          <strong>Name:</strong>{" "}
          {booking.contact_name || "N/A"}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {booking.user_email || "N/A"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {booking.contact_phone || "N/A"}
        </p>
      </div>

      {/* 🟢 PROVIDER INFO */}
      <div className="bg-gray-50 p-4 rounded space-y-2">
        <h2 className="font-semibold">Provider Info</h2>

        <p>
          <strong>Name:</strong>{" "}
          {listing.contact_name || "N/A"}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {listing.contact_email || "N/A"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {listing.contact_phone || "N/A"}
        </p>
      </div>

    </div>
  );
}