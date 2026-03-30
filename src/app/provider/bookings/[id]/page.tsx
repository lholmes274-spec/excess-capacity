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
  const [selectedImage, setSelectedImage] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);

  const [bookerProfile, setBookerProfile] = useState(null);
  const [providerProfile, setProviderProfile] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      // USER
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
      setSelectedImage(listingData?.image_url);

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
        .or(`
          sender_id.eq.${user?.id},
          receiver_id.eq.${user?.id},
          sender_email.eq.${user?.email},
          receiver_email.eq.${user?.email}
     `)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
    }

    load();
  }, [id]);

  async function sendMessage() {
    if (!newMessage.trim() || !booking || !user || !listing) return;

    const isProvider = user.id === listing.owner_id;

    let receiverId = null;
     
    if (isProvider) {
      // provider replying → send to booker

      if (bookerProfile?.id) {
        receiverId = bookerProfile.id;
      } else if (booking.user_id) {
        receiverId = booking.user_id;
      } else {
        receiverEmail = booking.guest_email;
     }

    } else {
      // booker sending → send to provider
      receiverId = listing.owner_id;
      receiverEmail = providerProfile?.email;
    }

    console.log("SENDING MESSAGE:", {
      sender: user.id,
      receiver: receiverId,
      bookingUser: booking.user_id,
      owner: listing.owner_id,
    });

    // ✅ INSERT MESSAGE
    const { error } = await supabase.from("inquiries").insert([
      {
        listing_id: booking.listing_id,
        sender_id: user.id,
        sender_email: user.email, 
        receiver_id: receiverId,
        receiver_email: receiverEmail, 
        message: newMessage,
      },
    ]);

    if (!error) {
      // 🔥 DETERMINE RECEIVER EMAIL CORRECTLY
      // 🔥 DO NOT redeclare receiverEmail

      if (user.id === listing.owner_id) {
        // provider sending → email booker
      if (booking.guest_email) {
        receiverEmail = booking.guest_email;
      } else if (booking.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", booking.user_id)
          .single();
        receiverEmail = profile?.email;
      }
      }

      else {
        // 🔥 booker sending → email provider
        receiverEmail = providerProfile?.email;
   }

      // ❌ DO NOT EMAIL YOURSELF
      if (receiverEmail && receiverEmail !== user.email) {
        await fetch("/api/message-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiver_id: receiverId,
            receiver_email: receiverEmail,
            booking_id: booking.id,
          }),
        });
      }

      // CLEAR INPUT
      setNewMessage("");

      // REFRESH MESSAGES
      const { data: msgs } = await supabase
        .from("inquiries")
        .select("*")
        .eq("listing_id", booking.listing_id)
        .or(`
          sender_id.eq.${user.id},
          receiver_id.eq.${user.id},
          sender_email.eq.${user.email},
          receiver_email.eq.${user.email}
      `)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
    }
  }

  if (!booking || !listing) return <p>Loading...</p>;

  const images = listing.image_urls || [listing.image_url];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* 🖼️ IMAGE GALLERY */}
      <div>
        {selectedImage && (
          <img
            src={selectedImage}
            className="w-full h-[350px] object-cover rounded-xl"
          />
        )}

        <div className="flex gap-2 mt-3">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              onClick={() => setSelectedImage(img)}
              className="w-20 h-20 object-cover rounded-lg cursor-pointer border"
            />
          ))}
        </div>
      </div>

      {/* 🧾 LISTING DETAILS */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-orange-700">
          {listing.title}
        </h1>

        <p className="text-gray-700 text-sm">
          {listing.description}
        </p>

        <p className="text-sm text-gray-500">
          Location: {listing.city}, {listing.state}
        </p>

        <p className="text-2xl font-bold text-green-600">
          ${listing.baseprice}
        </p>
      </div>

      {/* 📦 BOOKING */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h2 className="font-semibold text-lg mb-2">Booking Summary</h2>

        <p>Status: <span className="font-medium">{booking.status}</span></p>
        <p>
          Total:{" "}
          <span className="font-medium">
            ${booking.final_amount || listing.baseprice}
          </span>
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-4">

      {/* 👤 BOOKER */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h3 className="font-semibold mb-2">Customer Information</h3>

        <p>
          <strong>Name:</strong>{" "}
          {booking.guest_name || bookerProfile?.display_name || "—"}
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {booking.guest_email || booking.user_email || "—"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {booking.guest_phone || "—"}
        </p>
      </div>

      {/* 💬 CHAT */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h2 className="font-semibold text-lg mb-4">Conversation</h2>

      {/* 🏢 PROVIDER */}
      <div className="border rounded-xl p-5 shadow-sm bg-white">
        <h3 className="font-semibold mb-2">Provider</h3>
        <p>{providerProfile?.display_name || "Provider"}</p>
        <p className="text-sm text-gray-500">{providerProfile?.email}</p>
      </div>

    </div>

        <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-xs p-3 rounded-xl text-sm ${
                msg.sender_id === user?.id
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-100"
              }`}
            >
              {msg.message}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            className="border p-3 flex-1 rounded-lg"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />

          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-5 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}