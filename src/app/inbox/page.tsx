// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function InboxPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInbox() {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user || null;

      const guestEmail = localStorage.getItem("guest_email");

      // Only block if NO user AND NO guest email
      if (!sessionUser && !guestEmail) {
        router.push("/login");
        return;
      }

      // Only set userId if logged in
      if (sessionUser?.id) {
       setUserId(sessionUser.id);
      }

      // 🔥 NEW — support logged-in users AND guests

      let query = supabase
        .from("inquiries")
        .select(`
          *,
          listings ( title )
        `);

      // Logged-in user messages
      if (sessionUser?.id) {
        query = query.or(`sender_id.eq.${sessionUser.id},receiver_id.eq.${sessionUser.id}`);
      }

      // Guest messages
      if (!sessionUser?.id && guestEmail) {
        query = query.eq("guest_email", guestEmail);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (!error && data) {
        setMessages(data);
      }

      setLoading(false);
    }

    loadInbox();
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-600">
        Loading inbox...
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-8 text-center text-gray-600">
        No messages yet.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-orange-800">
        Inbox
      </h1>

      <div className="space-y-4">
        {messages.map((msg) => {
          const isSent = msg.sender_id === userId;

          return (
            <div
              key={msg.id}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">
                  {msg.listings?.title || "Listing"}
                </span>

                <span className="text-sm text-gray-500">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-gray-700 mb-2">
                {msg.message}
              </p>

              <span
                className={`text-xs font-semibold ${
                  isSent ? "text-blue-600" : "text-green-600"
                }`}
              >
                {isSent ? "Sent" : "Received"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}