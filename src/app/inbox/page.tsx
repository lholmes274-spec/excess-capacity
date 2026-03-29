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
  const [showArchived, setShowArchived] = useState(false); // 🔥 NEW
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadInbox() {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user || null;

      const guestEmail = localStorage.getItem("guest_email");

      if (!sessionUser && !guestEmail) {
        router.push("/login");
        return;
      }

      if (sessionUser?.id) {
        setUserId(sessionUser.id);
      }

      let query = supabase
        .from("inquiries")
        .select(`
          *,
          listings ( title )
        `);

      // 🔥 LOGGED-IN USERS
      if (sessionUser?.id) {
        if (showArchived) {
          // SHOW archived
          query = query.or(`and(sender_id.eq.${sessionUser.id},archived_by_sender.eq.true),and(receiver_id.eq.${sessionUser.id},archived_by_receiver.eq.true)`);
        } else {
          // SHOW inbox (not archived)
          query = query.or(`and(sender_id.eq.${sessionUser.id},archived_by_sender.eq.false),and(receiver_id.eq.${sessionUser.id},archived_by_receiver.eq.false)`);
        }
      }

      // 🔥 GUEST (no archive support)
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
  }, [router, showArchived]);

  async function handleArchive(msg) {
    if (!userId) return;

    const isSender = msg.sender_id === userId;

    if (isSender) {
      await supabase
        .from("inquiries")
        .update({ archived_by_sender: true })
        .eq("id", msg.id);
    } else {
      await supabase
        .from("inquiries")
        .update({ archived_by_receiver: true })
        .eq("id", msg.id);
    }

    setMessages((prev) => prev.filter((m) => m.id !== msg.id));
  }

  async function handleUnarchive(msg) {
    if (!userId) return;

    const isSender = msg.sender_id === userId;

    if (isSender) {
      await supabase
        .from("inquiries")
        .update({ archived_by_sender: false })
        .eq("id", msg.id);
    } else {
      await supabase
        .from("inquiries")
        .update({ archived_by_receiver: false })
        .eq("id", msg.id);
    }
  }

  // ✅ FIXED: moved OUTSIDE
  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  }

  // ✅ FIXED: moved OUTSIDE
  async function handleBulkArchive() {
    if (!userId || selectedIds.length === 0) return;

    const updates = selectedIds.map((id) => {
      const msg = messages.find((m) => m.id === id);
      const isSender = msg.sender_id === userId;

      return supabase
        .from("inquiries")
        .update(
          isSender
            ? { archived_by_sender: true }
            : { archived_by_receiver: true }
        )
        .eq("id", id);
    });

    await Promise.all(updates);

    setMessages((prev) => prev.filter((m) => !selectedIds.includes(m.id)));
    setSelectedIds([]);
  }

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
        {showArchived ? "No archived messages." : "No messages yet."}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4 text-orange-800">
        Inbox
      </h1>

      {/* 🔥 NEW TOP BAR */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedIds.length === messages.length && messages.length > 0}
            onChange={() => {
              if (selectedIds.length === messages.length) {
                setSelectedIds([]);
              } else {
                setSelectedIds(messages.map((m) => m.id));
              }
            }}
          />
          <span className="text-sm text-gray-600">Select All</span>
        </div>

        {/* ✅ FIXED BUTTON */}
        <button
          onClick={handleBulkArchive}
          className="text-sm bg-red-500 text-white px-3 py-1 rounded"
        >
          Archive Selected
        </button>
      </div>

      {/* 🔥 TOGGLE */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-3 py-1 rounded ${
            !showArchived ? "bg-orange-600 text-white" : "bg-gray-200"
          }`}
        >
          Inbox
        </button>

        <button
          onClick={() => setShowArchived(true)}
          className={`px-3 py-1 rounded ${
            showArchived ? "bg-orange-600 text-white" : "bg-gray-200"
          }`}
        >
          Archived
        </button>
      </div>

      <div className="space-y-4">
        {messages.map((msg) => {
          const isSent = msg.sender_id === userId;

          return (
            <div
              key={msg.id}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(msg.id)}
                    onChange={() => toggleSelect(msg.id)}
                  />

                  <span className="font-semibold text-gray-800">
                    {msg.listings?.title || "Listing"}
                  </span>
                </div>

                <span className="text-sm text-gray-500">
                  {new Date(msg.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-gray-700 mb-2">
                {msg.message}
              </p>

              <div className="flex justify-between items-center">
                <span
                  className={`text-xs font-semibold ${
                    isSent ? "text-blue-600" : "text-green-600"
                  }`}
                >
                  {isSent ? "Sent" : "Received"}
                </span>

                {userId && (
                  showArchived ? (
                    <button
                      onClick={() => handleUnarchive(msg)}
                      className="text-xs text-gray-500 hover:text-green-600"
                    >
                      Unarchive
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchive(msg)}
                      className="text-xs text-gray-500 hover:text-red-600"
                    >
                      Archive
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}