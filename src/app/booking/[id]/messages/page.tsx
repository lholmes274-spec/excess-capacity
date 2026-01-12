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

  const [otherUserName, setOtherUserName] = useState<string>("");

  // 🔔 Banner state (soft prompt)
  const [showNameBanner, setShowNameBanner] = useState(false);

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

        // ---------------------------------
        // Resolve other participant (CORRECT ROLES)
        // ---------------------------------
        const otherUserId =
          authData.user.id === bookingData.user_id
            ? bookingData.owner_id
            : bookingData.user_id;

        if (otherUserId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, full_name, first_name")
            .eq("id", otherUserId)
            .single();

          const displayName =
            profile?.display_name ||
            profile?.full_name ||
            profile?.first_name ||
            "";

          setOtherUserName(displayName);

          // 🔔 Show banner if NO display name exists
          if (!displayName) {
            setShowNameBanner(true);
          }
        }

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
     Send Message
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

      if (!res.ok) throw new Error("Message send failed");

      setMessageText("");

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

  /* -----------------------------
     UI
  ------------------------------*/
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
      <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl shadow p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Conversation{otherUserName ? ` with ${otherUserName}` : ""}
        </h1>

        {/* 🔔 Soft display-name banner */}
        {showNameBanner && (
          <div className="mt-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 flex justify-between items-center gap-4">
            <span>
              👋 Add a display name so others can see your name in conversations.
            </span>
            <div className="flex gap-3 shrink-0">
              <Link
                href="/profile"
                className="text-blue-700 font-semibold underline"
              >
                Add display name
              </Link>
              <button
                onClick={() => setShowNameBanner(false)}
                className="text-blue-700 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {booking?.title && (
          <p className="text-sm text-gray-600 mb-6">
            Regarding: <strong>{booking.title}</strong>
          </p>
        )}

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
