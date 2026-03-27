// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

export default function ProviderBookingPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // ✅ booking
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      setBooking(bookingData);

      if (!bookingData) return;

      // ✅ listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("id", bookingData.listing_id)
        .single();

      setListing(listingData);

      // ✅ messages
      const { data: msgs } = await supabase
        .from("inquiries")
        .select("*")
        .eq("listing_id", bookingData.listing_id)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
    }

    load();
  }, [id]);

  async function sendMessage() {
    if (!newMessage.trim() || !booking || !user) return;

    const receiverId =
      booking.user_id === user.id
        ? booking.owner_id
        : booking.user_id;

    await supabase.from("inquiries").insert([
      {
        listing_id: booking.listing_id,
        sender_id: user.id,
        receiver_id: receiverId,
        message: newMessage,
      },
    ]);

    setNewMessage("");

    const { data: msgs } = await supabase
      .from("inquiries")
      .select("*")
      .eq("listing_id", booking.listing_id)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
  }

  if (!booking) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Booking Details</h1>

      {/* 🧾 LISTING INFO */}
      {listing && (
        <div className="border p-4 rounded space-y-3">
          <h2 className="font-semibold">{listing.title}</h2>

          {listing.image_url && (
            <img
              src={listing.image_url}
              className="w-full max-w-md rounded"
            />
          )}

          <p className="text-sm text-gray-600">
            {listing.description}
          </p>

          <p className="font-medium">
            Price: ${listing.baseprice}
          </p>
        </div>
      )}

      {/* 💰 BOOKING INFO */}
      <div className="border p-4 rounded">
        <p>Status: {booking.status}</p>
        <p>
          Total: $
          {booking.final_amount ||
            listing?.baseprice ||
            0}
        </p>
      </div>

      {/* 💬 MESSAGES */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-3">Conversation</h2>

        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">No messages yet</p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded text-sm ${
                msg.sender_id === user?.id
                  ? "bg-blue-100 text-right"
                  : "bg-gray-100 text-left"
              }`}
            >
              {msg.message}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="border p-2 flex-1 rounded"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}