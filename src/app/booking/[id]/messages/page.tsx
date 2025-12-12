// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

/* -----------------------------
   Booking Messages Page
------------------------------*/
export default function BookingMessagesPage() {
  const { id: bookingId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  /* -----------------------------
     Load booking + messages
  ------------------------------*/
  useEffect(() => {
    async function load() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) {
          router.push("/login");
          return;
        }

        setCurrentUserId(authData.user.id);

        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bookingError || !bookingData) {
          setError("Booking not found or access denied.");
          setLoading(false);
          return;
        }

        setBooking(bookingData);

        const { data: messageData, error: messageError } = await supabase
          .from("booking_messages")
          .select("*")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: true });

        if (messageError) {
          setError("Unable to load messages.");
          setLoading(false);
          return;
        }

        setMessages(messageData || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Unexpected error loading conversation.");
        setLoading(false);
      }
    }

    if (bookingId) load();
  }, [bookingId, router]);

  /* -----------------------------
     Send Message (SERVER API)
  ------------------------------*/
  async function sendMessage() {
    if (!messageText.trim() || sending) return;

    setSending(true);

    try {
      const res = await fetch(`/api/booking/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_id: currentUserId,
          message: messageText.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Message send failed");
      }

      setMessageText("");

      // Reload messages
      const { data } = await supabase
        .from("booking_messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  /* -----------------------------
     Loading / Error
  ------------------------------*/
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading conversation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="text-blue-600 underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isProvider = currentUserId === booking.owner_id;

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl shadow p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Booking Conversation
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          You are communicating with the{" "}
          <strong>{isProvider ? "Booker" : "Provider"}</strong> for this booking.
        </p>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto border rounded-lg p-4 mb-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-gray-500 text-sm">
              No messages yet. Start the conversation.
            </p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.sender_id === currentUserId
                  ? "bg-green-100 ml-auto text-right"
                  : "bg-gray-200 mr-auto"
              }`}
            >
              <p className="text-gray-800">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message…"
            className="flex-1 border rounded-lg px-4 py-2"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>

        <Link
          href="/my-bookings"
          className="mt-6 text-sm text-gray-600 underline text-center"
        >
          Back to My Bookings
        </Link>
      </div>
    </div>
  );
}
