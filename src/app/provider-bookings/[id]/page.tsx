// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

export default function ProviderBookingPage() {
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);

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

      // 🔥 LOAD MESSAGES (THIS IS THE KEY ADDITION)
      const { data: messagesData } = await supabase
        .from("inquiries")
        .select("*")
        .eq("booking_id", id)
        .order("created_at", { ascending: true });

      setMessages(messagesData || []);
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

      {/* 🔥 NEW — CONVERSATION SECTION */}
      <hr className="my-4" />

      <h2 className="font-semibold mb-2">Conversation</h2>

      {messages.length === 0 ? (
        <p className="text-gray-500 text-sm">No messages yet.</p>
      ) : (
        messages.map((msg) => {
          const isProvider = msg.sender_id === booking.owner_id;

          return (
            <div
              key={msg.id}
              className={`p-3 rounded-lg mb-2 ${
                isProvider ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          );
        })
      )}

      {/* 🔥 NEW — MESSAGE INPUT */}
      <div className="mt-4 space-y-2">
        <textarea
          placeholder="Type your message..."
          className="w-full border p-3 rounded-lg"
          id="messageBox"
        />

        <button
          onClick={async () => {
            const messageInput = document.getElementById("messageBox") as HTMLTextAreaElement;
            const message = messageInput?.value;

            if (!message || message.trim() === "") return;

            const { error } = await supabase.from("inquiries").insert([
              {
                booking_id: id,
                listing_id: booking.listing_id,
                sender_id: user?.id,
                receiver_id: booking.user_id || null,
                guest_email: booking.guest_email,
                message: message.trim(),
              },
            ]);

            if (error) {
              alert("Unable to send message.");
              return;
            }

            messageInput.value = "";

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                message: message.trim(),
                sender_id: user?.id,
                created_at: new Date().toISOString(),
              },
            ]);

            alert("Message sent!");
          }}
          className="mt-2 w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}