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
  const [messages, setMessages] = useState([]);

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

  // ✅ NEW BLOCK (ADD THIS)
  useEffect(() => {
    async function loadMessages() {
      if (!booking?.listings?.id) return;

      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return;
      const filtered = (data || []).filter(
        (msg) => msg.listing_id === booking.listings.id
      );

      setMessages(filtered);
    }

     loadMessages();
   }, [booking]);

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
      {/* 🔥 MESSAGE INPUT */}
      <div className="mt-6 space-y-2">
        <textarea
          id="providerMessage"
          placeholder="Type your message..."
          className="w-full border p-3 rounded-lg"
        />

        <button
          onClick={async () => {
            const input = document.getElementById("providerMessage") as HTMLTextAreaElement;
            const message = input?.value;

            if (!message || message.trim() === "") return;

            const { error } = await supabase.from("inquiries").insert([
              {
                booking_id: booking.id,
                listing_id: booking.listings.id,
                sender_id: booking.owner_id,
                receiver_id: booking.user_id,
                message: message.trim(),
              },
            ]);

            if (error) {
              alert("Failed to send message");
              return;
            }

            await fetch("/api/message-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                receiver_id: booking.user_id,
                receiver_email: booking.user_email,
                booking_id: booking.id,
             }),
            });

            input.value = "";

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                message: message.trim(),
                sender_id: booking.owner_id,
                created_at: new Date().toISOString(),
              },
            ]);

            alert("Message sent successfully!");
          }}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Send Message
        </button>
      </div>

      {/* 🔥 CONVERSATION */}
      <div className="mt-6 space-y-3">
        <h2 className="font-semibold text-gray-800">Conversation</h2>
         {messages.length === 0 ? (
           <p className="text-gray-500 text-sm">No messages yet.</p>
         ) : (
           messages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 rounded-lg bg-gray-100 border"
            >
              <p className="text-sm">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

   </div>
  );
 }