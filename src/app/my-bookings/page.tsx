// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("bookings")
        .select("*, listings!left(*)")
        .eq("user_id", user.id)
        .eq("hidden_by_booker", false) // ✅ ONLY SHOW NON-HIDDEN
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading orders:", error);
      } else {
        setOrders(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function deleteOrder(orderId) {
    const confirmed = confirm(
      "This will remove the order from your view only. Continue?"
    );
    if (!confirmed) return;

    setDeletingId(orderId);

    const { error } = await supabase
      .from("bookings")
      .update({ hidden_by_booker: true })
      .eq("id", orderId)
      .eq("user_id", userId);

    console.log("HIDE ERROR:", error);
    
    if (error) {
      alert("Failed to remove order.");
      setDeletingId(null);
      return;
    }

    // Remove from UI only
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    setDeletingId(null);
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your orders...</p>
      </div>
    );

  if (!userId)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-xl font-semibold text-red-600 mb-4">
          You must be logged in to view your orders.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Login
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">My Orders</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">
          You haven’t placed any orders yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((o) => {
            const listing = o.listings || {};
            const thumbnail =
              listing?.image_urls?.[0] ||
              listing?.image_url ||
              "/no-image.png";

            const isPurchase = listing?.pricing_type === "for_sale";

            return (
              <div
                key={o.id}
                className="relative bg-white border border-gray-200 rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                <Link href={`/my-bookings/${o.id}`}>
                  <img
                    src={thumbnail}
                    alt={listing?.title}
                    className="w-full h-48 object-cover"
                  />
                </Link>

                <div className="p-4">
                  <h2 className="font-semibold text-lg mb-1">
                    {listing?.title}
                  </h2>

                  <p className="text-gray-500 text-sm mb-2">
                    {listing?.city}, {listing?.state}
                  </p>

                  {isPurchase ? (
                    <p className="text-blue-700 font-medium text-sm">
                      One-time purchase
                    </p>
                  ) : (
                    <p className="text-green-700 font-medium text-sm">
                      ${listing?.baseprice} / hour
                    </p>
                  )}

                  <p className="text-gray-700 font-semibold mt-1">
                    You paid: ${o.amount_paid}
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Ordered on:{" "}
                    {o.created_at
                      ? new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          timeZone:
                            Intl.DateTimeFormat().resolvedOptions().timeZone,
                        }).format(new Date(o.created_at))
                      : "—"}
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {o.status}
                    </span>
                  </p>

                  <Link
                    href={`/booking/${o.id}/messages`}
                    className="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium shadow hover:bg-green-700 transition"
                  >
                    View Conversation
                  </Link>
                </div>

                <button
                  onClick={() => deleteOrder(o.id)}
                  disabled={deletingId === o.id}
                  className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-lg text-sm shadow hover:bg-red-700 transition"
                >
                  {deletingId === o.id ? "Removing..." : "Remove"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
