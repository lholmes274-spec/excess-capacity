"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Message = {
  id: string;
  listing_id: string;
  sender_id: string | null;
  message: string;
  created_at: string;
};

export default function InboxChatPage() {
  const params = useParams();
  const listingId = typeof params?.id === "string" ? params.id : "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Load user
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      setUserId(data?.session?.user?.id || null);
    }
    loadUser();
  }, []);

  // 🔹 Load messages
  useEffect(() => {
    async function loadMessages() {
      if (!listingId) return;

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      const { data, error } = await supabase
        .from("inquiries" as any)
        .select("*")
        .eq("listing_id", listingId)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages((data as unknown) as Message[]);
      }

      setLoading(false);
    }

    loadMessages();
  }, [listingId]);

  // 🔹 Send message
  async function sendMessage() {
    if (!newMessage.trim() || !userId || !listingId) return;

    // 🔥 STEP 1 — get listing owner
    const { data: listing } = await supabase
      .from("listings")
      .select("owner_id, contact_email")
      .eq("id", listingId)
      .single();

    if (!listing) {
      alert("Listing not found");
      return;
    }

    let receiverId = null;
    let receiverEmail = null;

    // 🔥 PROVIDER OR BOOKER LOGIC
    if (userId === listing.owner_id) {
      // provider → find last booker

      const { data: lastMessage } = await supabase
        .from("inquiries" as any)
        .select("sender_id, sender_email")
        .eq("listing_id", listingId)
        .not("sender_id", "is", null)
        .neq("sender_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const msg = lastMessage as any;

      receiverId = msg?.sender_id || null;
      receiverEmail = msg?.sender_email || null;

    } else {
      // booker → provider
      receiverId = listing.owner_id;

      // 🔥 GET REAL PROVIDER EMAIL FROM PROFILES
      const { data } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", listing.owner_id!)
        .single();

      const providerProfile = data as any;

       receiverEmail = providerProfile?.email;
    }

    // 🔥 STEP 2 — insert message
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("inquiries" as any).insert([
      {
        listing_id: listingId,
        sender_id: userId,
        sender_email: user?.email,
        receiver_id: receiverId,
        receiver_email: receiverEmail,
        message: newMessage.trim(),
      },
    ]);

    if (error) {
      console.error("Message send error:", error);
      alert(error.message);
      return;
    }

    // 🔥 STEP 3 — update UI
    const newMsg: Message = {
      id: Date.now().toString(),
      listing_id: listingId,
      sender_id: userId,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage("");

    // 🔥 STEP 4 — send email (FIXED POSITION)
    try {
      await fetch("/api/message-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_email: receiverEmail,
          message: newMessage,
          listing_id: listingId,
        }),
      });
    } catch (err) {
      console.error("Email send failed:", err);
    }
  }

  if (loading) {
    return <div className="p-6">Loading conversation...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Conversation</h1>

      <div className="space-y-3 mb-6">
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;

          return (
            <div
              key={msg.id}
              className={`p-3 rounded-lg max-w-[75%] ${
                isMine
                  ? "bg-blue-600 text-white ml-auto"
                  : "bg-gray-200 text-black"
              }`}
            >
              <p>{msg.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border p-3 rounded-lg"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>
    </div>
  );
}