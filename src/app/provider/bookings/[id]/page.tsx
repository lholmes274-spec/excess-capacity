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

  const [bookerProfile, setBookerProfile] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      // BOOKING
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      setBooking(bookingData);
      if (!bookingData) return;

      // LISTING
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("id", bookingData.listing_id)
        .single();

      setListing(listingData);

      // 👤 BOOKER PROFILE
      if (bookingData.user_id) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", bookingData.user_id)
          .single();

        setBookerProfile(data);
      }

      // 🏢 PROVIDER PROFILE
      if (listingData?.owner_id) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", listingData.owner_id)
          .single();

        setProviderProfile(data);
      }

      // 💬 MESSAGES
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
        ? listing.owner_id
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
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* 🧾 LISTING */}
      {listing && (
        <div className="border rounded-lg overflow-hidden shadow-sm">
          {listing.image_url && (
            <img src={listing.image_url} className="w-full h-64 object-cover" />
          )}
          <div className="p-4">
            <h2 className="text-lg font-semibold">{listing.title}</h2>
            <p className="text-gray-600 text-sm mt-1">
              {listing.description}
            </p>
            <p className="mt-2 font-medium">${listing.baseprice}</p>
          </div>
        </div>
      )}

      {/* 📦 BOOKING */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-2">Booking Summary</h3>
        <p>Status: <span className="font-medium">{booking.status}</span></p>
        <p>Total: <span className="font-medium">${booking.final_amount || listing?.baseprice || 0}</span></p>
      </div>

      {/* 👤 BOOKER */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-2">Booked By</h3>
        <p>
          {bookerProfile?.display_name || "Guest User"}
        </p>
        <p className="text-sm text-gray-500">
          {booking.user_email}
        </p>
      </div>

      {/* 🏢 PROVIDER */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-2">Provider</h3>
        <p>
          {providerProfile?.display_name || "Provider"}
        </p>
        <p className="text-sm text-gray-500">
          {providerProfile?.email}
        </p>
      </div>

      {/* 💬 CHAT */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold mb-3">Conversation</h3>

        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 rounded text-sm ${
                msg.sender_id === user?.id
                  ? "bg-blue-500 text-white text-right"
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