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
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showArchived, setShowArchived] = useState(false); 

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
      const filtered = (data || []).filter((msg) => {
        if (msg.listing_id !== booking.listings.id) return false;

        if (showArchived) {
          return msg.archived === true;
        } else {
          return msg.archived !== true;
        }
      });

      setMessages(filtered);
    }

     loadMessages();
   }, [booking, showArchived]);

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

      {/* 🔥 ARCHIVE BUTTON */}
      <button
        onClick={async () => {
          await supabase
            .from("bookings")
            .update({ archived_by_lister: true })
            .eq("id", booking.id);
          alert("Conversation archived");
        }}
        className="text-sm text-gray-500 underline"
      >
         Archive Conversation
      </button>
      
      {/* 🔘 TOGGLE VIEW */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => {
            setShowArchived(false);
          }}
          className={`px-3 py-1 rounded ${
            !showArchived ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Active
        </button>
        
        <button
          onClick={() => {
            setShowArchived(true);
          }}
          className={`px-3 py-1 rounded ${
            showArchived ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Archived
        </button>
      </div>

      {/* 🔥 CONVERSATION */}
      <div className="mt-6 space-y-3">
        <h2 className="font-semibold text-gray-800">Conversation</h2>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={
              messages.length > 0 &&
              selectedMessages.length === messages.length
            }
             onChange={(e) => {
               if (e.target.checked) {
                setSelectedMessages(messages.map((m) => m.id));
               } else {
                 setSelectedMessages([]);
               }
             }}
           />
           <span className="text-sm text-gray-600">Select All</span>
        </div>
         
         {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages yet.</p>
        ) : (
           <div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 rounded-lg bg-gray-100 border flex items-start gap-3"
              >
                {/* ✅ CHECKBOX */}
                <input
                  type="checkbox"
                  checked={selectedMessages.includes(msg.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                     setSelectedMessages((prev) => [...prev, msg.id]);
                    } else {
                      setSelectedMessages((prev) =>
                        prev.filter((id) => id !== msg.id)
                       );
                    }
                  }}
                />

                {/* MESSAGE BUBBLE */}
                <div
                  className={`p-3 rounded-2xl ${
                    msg.sender_id === booking.owner_id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>

                {/* ✅ FIXED STRUCTURE */}
                <div className="flex flex-col">

                </div>
              </div>
            ))}
 
            {/* 🔥 ARCHIVE SELECTED BUTTON */}
            {selectedMessages.length > 0 && (
              <button
                onClick={async () => {
                  const { error } = await supabase
                    .from("inquiries")
                    .update({ archived: !showArchived }) 
                    .in("id", selectedMessages);

                  if (error) {
                   alert("Failed to update messages");
                   return;
                  }

                   alert(showArchived ? "Messages restored" : "Messages archived");

                  setSelectedMessages([]);
                  setShowArchived((prev) => prev);

               setTimeout(async () => {
                  const { data } = await supabase
                    .from("inquiries")
                    .select("*")
                    .order("created_at", { ascending: false });

                  const filtered = (data || []).filter((msg) => {
                    if (msg.listing_id !== booking.listings.id) return false;

                    if (showArchived) {
                      return msg.archived === true;
                    } else {
                      return msg.archived !== true;
                    }
                  });

                   setShowArchived((prev) => prev);
                }, 200);
                 }}

                className="text-sm text-red-500 underline mt-2"
               >
                 {showArchived ? "Unarchive Selected" : "Archive Selected Messages"} 
               </button>
             )}
           </div>
         )}
      </div>
   </div> 
 );  
 }