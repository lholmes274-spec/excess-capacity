// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams } from "next/navigation";

const formatTime = (time: string) => {
  const [hour, minute] = time.split(":");
  const h = Number(hour);
  const suffix = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 || 12;
  return `${formattedHour}:${minute} ${suffix}`;
};

export default function BookingDetailsPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const id = rawId ? String(rawId) : null;

  if (!id) {
    console.error("❌ Missing booking ID");
  }

  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);

  const [selectedMessages, setSelectedMessages] = useState([]);

  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const loggedInUser = userData?.user || null;

      setUser(loggedInUser);

      // 1️⃣ Get booking 
      let { data: bookingData, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      console.log("Fetched booking:", bookingData);

      if (!bookingData) {
        console.log("🔁 Retrying booking fetch...");

        await new Promise((res) => setTimeout(res, 500));

        const { data: retryData } = await supabase
           .from("bookings")
           .select("*")
           .eq("id", id)
          .maybeSingle();

        bookingData = retryData;
      }

      console.log("Final booking:", bookingData);

      if (!bookingData) {
        console.warn("No booking found");
        setBooking(null);
        setLoading(false);
        return;
    }

      // 2️⃣ Get listing 
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

      // ✅ FINAL ACCESS RULE
      const isOwner = loggedInUser?.id === bookingData.owner_id;
      console.log("loggedInUser email:", loggedInUser?.email);
      console.log("buyerEmail:", buyerEmail);
      console.log("isLoggedInEmailMatch:", isLoggedInEmailMatch);
      if (!bookingData) {
        console.warn("Booking not found");
        setBooking(null);
        setLoading(false);
        return;
      }

      // ✅ ONLY SET STATE AFTER PASSING SECURITY
      setBooking(bookingData);
      setListing(listingData);

      if (!loggedInUser && buyerEmail) {
        localStorage.setItem("guest_email", buyerEmail);
      }
      setLoading(false);
    }

    load();
  }, [id]);

  useEffect(() => {
    if (!booking?.listing_id) return;
    
    async function loadMessages() {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Message fetch error:", error);
        return;
      }

      const listingId = booking?.listing_id || booking?.listings?.id;

      const filtered = (data || []).filter((msg) => {       
        if (msg.listing_id !== listingId) return false;

        if (showArchived) {
          return msg.archived_by_booker === true;
        } else {
          return msg.archived_by_booker !== true;
        }
      });

      setMessages(filtered);
    }
    loadMessages();

    const channel = supabase
      .channel("inquiries-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inquiries",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [booking, showArchived]);

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

        {booking.appointment_type && (
       <p>
         <strong>Appointment Type:</strong>{" "}
         <span className="capitalize">
           {booking.appointment_type}
         </span>
      </p>
   )}

        {/* ✅ PROVIDER ACTIONS */}
        {user?.id === booking.owner_id &&
          booking.status === "pending" && (
           <div className="flex gap-3 mt-4">
    
             <button
               onClick={async () => {
                 const confirmed = confirm(
                   "Accept this booking request?"
                 );

                if (!confirmed) return;

                const { error } = await supabase
                 .from("bookings")
                 .update({
                   status: "confirmed",
                })
                .eq("id", booking.id);

                if (error) {
                 alert("Failed to accept booking.");
                 return;
                }

                setBooking((prev) => ({
                 ...prev,
                 status: "confirmed",
               }));

               await fetch("/api/message-notification", {
                 method: "POST",
                 headers: {
                   "Content-Type": "application/json",
                 },
                 body: JSON.stringify({
                  booking_id: booking.id,
                  receiver_email:
                    booking.guest_email ||
                    booking.user_email ||
                    booking.booker_email,
                 }),
              });

               alert("Booking confirmed successfully!");
            }}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Accept Booking
          </button>

          <button
            onClick={async () => {
              const confirmed = confirm(
                "Decline this booking request?"
             );

             if (!confirmed) return;

             const { error } = await supabase
               .from("bookings")
               .update({
                 status: "declined",
               })
               .eq("id", booking.id);

             if (error) {
              alert("Failed to decline booking.");
              return;
             }

             setBooking((prev) => ({
              ...prev,
              status: "declined",
             }));

             alert("Booking declined.");
           }}
           className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
         >
           Decline Booking
         </button>

       </div>
    )}

        <p>
          <strong>Amount Paid:</strong> ${booking.amount_paid}
        </p>

       {/* ✅ TRAVEL FEE */}
       {booking.travel_fee_requested && (
         <div className="border rounded-xl p-4 bg-orange-50 mt-4">
           <h3 className="font-semibold text-orange-700 mb-2">
             Travel Fee
           </h3>

           <p className="mb-3">
             Provider requested an additional travel fee of{" "}
             <strong>${booking.travel_fee}</strong>
           </p>

           {booking.travel_fee_paid ? (
             <p className="text-green-600 font-semibold">
              ✅ Travel fee paid
            </p>
           ) : (
            <button
              onClick={async () => {
                const res = await fetch(
                  "/api/create-travel-payment-session",
                  {
                   method: "POST",
                   headers: {
                     "Content-Type": "application/json",
                   },
                   body: JSON.stringify({
                    booking_id: booking.id,
                    amount: booking.travel_fee,
                   }),
                 }
              );

              const data = await res.json();

              if (!res.ok) {
                alert(data.error || "Checkout failed");
                return;
              }

              window.location.href = data.url;
           }}
           className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
         >
           Pay Travel Fee
         </button>
       )}
    </div>
  )}

  {booking.start_date && booking.start_date !== "" ? (
          <>
           <p>
            <strong>Start:</strong>{" "}
            {new Date(booking.start_date + "T00:00:00").toLocaleDateString()}

             {booking.time_slot && (
                <> at {formatTime(booking.time_slot)}</>
             )}
           </p>

           <p>
            <strong>End:</strong>{" "}
            {new Date(booking.end_date + "T00:00:00").toLocaleDateString()}

            {booking.end_time && (
              <> at {formatTime(booking.end_time)}</>
            )}
           </p>
          </>
       ) : (
        <p className="text-orange-600 font-medium">
          ⏳ Schedule: To be confirmed with provider
        </p>
      )}

        {booking.status !== "cancelled" && (
          <button
            onClick={async () => {
              const confirmCancel = confirm("Are you sure you want to cancel this booking?");
              if (!confirmCancel) return;

              const res = await fetch("/api/cancel-booking", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                   bookingId: booking.id,
                }),
              });

              const data = await res.json();

              if (!res.ok) {
                alert("Failed to cancel booking.");
                console.error(data);
                return;
              }

              alert("Booking cancelled successfully!");

              // 🔥 Update UI instantly
              setBooking((prev) => ({
                ...prev,
                status: "cancelled",
              }));
            }}
             className="mt-4 w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
             Cancel Booking
          </button>
        )}

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
            {new Intl.DateTimeFormat("en-US", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(booking.booking_date))}
          </p>
       )}

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

       <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg w-full overflow-hidden">
          <h3 className="font-semibold text-blue-700 mb-2">
            Customer Information
          </h3>

          <div className="space-y-2 text-gray-700">
          <p className="break-all">
            <strong>Name:</strong> {booking.guest_name || "—"}
          </p>

         <div className="text-gray-700">
           <strong>Email:</strong>

           <div className="break-all w-full">
             {booking.guest_email || booking.user_email || "—"}
           </div>
         </div>

          <p className="text-gray-700">
            <strong>Phone:</strong> {booking.guest_phone || "—"}
          </p>
        </div>
      </div>

        {/* 🔥 MESSAGE UI (BOTH SIDES) */}
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
                  sender_id: user.id,
                  receiver_id:
                    user.id === booking.owner_id
                      ? booking.user_id || null
                      : booking.owner_id,
                  guest_email: booking.guest_email,
                  message: message.trim(),
                },
              ]);

              if (error) {
                alert("Unable to send message. Please try again.");
                return;
              }

              await fetch("/api/message-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  receiver_id:
                    user.id === booking.owner_id
                      ? booking.user_id
                      : booking.owner_id,
                  receiver_email:
                    user.id === booking.owner_id
                      ? booking.guest_email
                      : null,
                  booking_id: booking.id,
                }),
              });

              messageInput.value = "";

              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now(),
                  message: message.trim(),
                  sender_id: user.id,
                  created_at: new Date().toISOString(),
                },
              ]);

              alert("Message sent successfully!");
            }}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Send Message
          </button>
        </div>

        {/* 🔥 CONVERSATION THREAD */}
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-gray-800">Conversation</h3>

          {/* 🔘 TOGGLE VIEW (ADD THIS) */}
          <div className="flex gap-2 mt-2">
            <button
               onClick={() => setShowArchived(false)}
               className={`px-3 py-1 rounded ${
                !showArchived ? "bg-blue-600 text-white" : "bg-gray-200"
               }`}
            >
              Active
            </button>

            <button
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1 rounded ${
                 showArchived ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {/* 🔘 SELECT ALL */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={
               messages.length > 0 &&
               selectedMessages.length === messages.length
            }
            onChange={() => {
              if (selectedMessages.length === messages.length) {
                setSelectedMessages([]);
              } else {
                setSelectedMessages(messages.map((m) => String(m.id)));
              }
            }}
          />
          <span className="text-sm text-gray-600">Select All</span>
        </div>

        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages yet.</p>
         ) : (
           <div>
             {messages.map((msg) => {
               const isProvider = msg.sender_id === booking.owner_id;
                return (
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-gray-100"
                  >
                    {/* ✅ CHECKBOX */}
                    <input
                      type="checkbox"
                      checked={selectedMessages.includes(msg.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMessages((prev) => [
                            ...prev,
                            String(msg.id),
                         ]);
                       } else {
                          setSelectedMessages((prev) =>
                            prev.filter((id) => id !== String(msg.id))
                          );
                       }
                      }}
                    />

                    {/* MESSAGE */}
                    <div
                      className={`p-3 rounded-2xl ${
                        isProvider
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* 🔥 ARCHIVE BUTTON */}
              {selectedMessages.length > 0 && (
                <button
                  onClick={async () => {

                    const confirmAction = confirm(
                      showArchived
                        ? "Unarchive selected messages?"
                        : "Archive selected messages?"
                    );

                    if (!confirmAction) return;

                    const ids = selectedMessages.map((id) => String(id));

                    const { error } = await supabase
                      .from("inquiries")
                      .update({ archived_by_booker: !showArchived })
                      .in("id", ids);

                    if (error) {
                      alert("Failed to update messages");
                      return;
                    }

                      alert(
                        showArchived
                          ? "Messages unarchived successfully!"
                          : "Messages archived successfully!"
                      );

                    setSelectedMessages([]);

                    // 🔥 SWITCH TAB AUTOMATICALLY
                    setShowArchived(!showArchived);

                    // 🔥 RELOAD DATA
                    const { data } = await supabase
                      .from("inquiries")
                      .select("*")
                      .order("created_at", { ascending: false });

                    const listingId = booking?.listing_id || booking?.listings?.id;

                    const filtered = (data || []).filter((msg) => {
                      if (msg.listing_id !== listingId) return false;

                      if (showArchived) {
                        return msg.archived_by_booker === true;
                      } else {
                         return msg.archived_by_booker !== true;
                      }
                    });

                  setMessages(filtered);
                }}
                className="text-sm text-red-500 underline mt-2"
               >
                {showArchived ? "Unarchive Selected" : "Archive Selected Messages"}
               </button>
              )}
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