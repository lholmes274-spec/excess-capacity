// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BookingDetailsPage() {
  const { id } = useParams();
  console.log("Booking ID from URL:", id);

  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function load() {
      if (!id) return;

      // Load logged-in user (may be null if guest checkout)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const loggedInUser = session?.user || null;
      setUser(loggedInUser);

      // 1️⃣ Get booking ONLY
      const { data: bookingData, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      console.log("Fetched booking:", bookingData);

      if (error || !bookingData) {
        console.error("Booking not found:", error);
        setLoading(false);
        return;
      }

      // 2️⃣ Get listing separately
      const { data: listingData } = await supabase
        .from("listings")
        .select("*")
        .eq("id", bookingData.listing_id)
        .single();

      // ⭐ SECURITY CHECK
      const buyerId = bookingData.user_id;
      const buyerEmail = 
        bookingData.guest_email ||
        bookingData.user_email ||
        bookingData.email ||
        null;

      const isLoggedInBuyer =
        loggedInUser?.id && buyerId === loggedInUser.id;

      const isLoggedInEmailMatch =
        loggedInUser?.email &&
        buyerEmail &&
        loggedInUser.email.toLowerCase().trim() === buyerEmail.toLowerCase().trim();

      const isGuestEmailMatch =
        !loggedInUser && typeof window !== "undefined"
          ? localStorage.getItem("guest_email") === buyerEmail
          : false;

      // 🔥 TEMP ALLOW if booking email exists (prevents false block after login redirect)
      const isOwner = loggedInUser?.id === bookingData.owner_id;
      if (!isLoggedInBuyer && !isLoggedInEmailMatch && !isGuestEmailMatch && !isOwner) {
        console.warn("Unauthorized access to booking");
        setBooking(null);
        setLoading(false);
        return;
      }

      // ✅ ONLY SET STATE AFTER PASSING SECURITY
      setBooking(bookingData);
      setListing(listingData);

      // 🔥 LOAD CONVERSATION MESSAGES
      const { data: messagesData } = await supabase
        .from("inquiries")
        .select("*")
        .eq("listing_id", bookingData.listing_id)
        .eq("guest_email", bookingData.guest_email)
        .order("created_at", { ascending: true });

      if (messagesData) {
         setMessages(messagesData);
      }

      if (!loggedInUser && buyerEmail) {
        localStorage.setItem("guest_email", buyerEmail);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading booking details...</p>
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-600 text-xl font-semibold mb-4">
          Order not found or access denied.
        </p>
        <Link
          href="/my-bookings"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Back to My Orders
        </Link>
      </div>
    );

  const thumbnail =
    listing?.image_urls?.[0] || listing?.image_url || "/no-image.png";

  const isPurchase = listing?.pricing_type === "for_sale";

  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">
        {isPurchase ? "Order Details" : "Booking Details"}
      </h1>

      <img
        src={thumbnail}
        className="w-full h-64 object-cover rounded-lg shadow mb-6"
      />

      <h2 className="text-2xl font-semibold mb-2 text-orange-700">
        {listing?.title}
      </h2>

      <p className="text-gray-600 mb-4">{listing?.description}</p>

      <div className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-4">
        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize">{booking.status}</span>
        </p>

        <p>
          <strong>Amount Paid:</strong> ${booking.amount_paid}
        </p>

        {!isPurchase && booking.days != null && (
          <p>
            <strong>Duration:</strong>{" "}
             {booking.days}{" "}
             {listing?.pricing_type === "per_night" ? "nights" : "days"}
          </p>
       )}        

         {!isPurchase && (
          <p>
            <strong>Booking Created:</strong>{" "}
            {new Date(booking.created_at).toLocaleDateString()}
          </p>
       )}

        <p>
          <strong>Stripe Session:</strong> {booking.stripe_session_id}
        </p>

        <hr />

        {listing?.pickup_instructions && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-700 mb-2">
              Pickup Instructions
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {listing.pickup_instructions}
            </p>
          </div>
        )}

        {listing?.private_instructions && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-2">
              Private Instructions
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {listing.private_instructions}
            </p>
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Address</h3>
          <p className="text-gray-700">
            {listing.address_line1}
            <br />
            {listing.address_line2 && <>{listing.address_line2}<br /></>}
            {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-700 mb-2">Customer Information</h3>

          <p className="text-gray-700">
            <strong>Name:</strong> {booking.guest_name || "—"}
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> {booking.guest_email || booking.user_email || "—"}
          </p>
          <p className="text-gray-700">
            <strong>Phone:</strong> {booking.guest_phone || "—"}
          </p>
        </div>

        {/* 🆕 MESSAGE CUSTOMER UI */}
        {user?.id === booking.owner_id && (
          <div className="mt-4 space-y-2">
            <textarea
              placeholder="Type your message to the customer..."
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
                  listing_id: booking.listing_id,
                  sender_id: user.id,
                  receiver_id: booking.user_id || null,
                  guest_email: booking.guest_email,
                  message: message.trim(),
                 },
              ]);

              if (error) {
                alert("Unable to send message. Please try again.");
                return;
              }

              // 🔔 Trigger email notification
              await fetch("/api/message-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  receiver_id: booking.user_id,
                  receiver_email: booking.guest_email,
                  booking_id: booking.id,
                }),
              });

              messageInput.value = "";

              alert("Message sent successfully!");
            }}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Send Message
          </button>
          </div>
         )}

         {/* 🔥 CONVERSATION THREAD */}
         {messages.length > 0 && (
           <div className="mt-6 space-y-3">
             <h3 className="font-semibold text-gray-800">Conversation</h3>

             {messages.map((msg) => {
               const isProvider = msg.sender_id === booking.owner_id;

               return (
                 <div
                   key={msg.id}
                   className={`p-3 rounded-lg ${
                     isProvider ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
                   }`}
                 >
                   <p className="text-sm">{msg.message}</p>
                   <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                   </p>
                 </div>
             );
           })}
         </div>
       )}

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mt-4">
          <h3 className="font-semibold text-gray-800 mb-2">Provider Information</h3>
          
          <p className="text-gray-700">
            <strong>Name:</strong> {listing.contact_name || "—"}
          </p>
          <p className="text-gray-700">
            <strong>Phone:</strong> {listing.contact_phone || "—"}
          </p>
          {/* 🔥 NEW — Guide users to messaging first */}
          <div className="mt-2 text-sm text-gray-600">
            For best response time, please use the in-app messaging system.
          </div>
          <p className="text-gray-700">
            <strong>Email:</strong> {listing.contact_email || "—"}
          </p>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link
          href="/my-bookings"
          className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition"
        >
          Back to My Bookings
        </Link>
      </div>
    </div>
  );
}
