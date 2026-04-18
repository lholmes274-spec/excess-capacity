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
  const [userEmail, setUserEmail] = useState(null); // ✅ ADDED
  const [deletingId, setDeletingId] = useState(null);
  const [view, setView] = useState("active"); 

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
      setUserEmail(user.email); // ✅ ADDED

      const { data, error } = await supabase
        .from("bookings")
        .select("*, listings!left(*)")
        .or(
          `user_id.eq.${user.id},guest_email.ilike.${user.email}`
        )
        .eq("archived_by_booker", view === "hidden")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading orders:", error);
      } else {
        setOrders(data || []);
      }

      setLoading(false);
    }

    load();
  }, [view]);

  async function toggleOrder(order) {
    const isHidden = order.archived_by_booker;

    const confirmed = confirm(
        isHidden
         ? "Restore this order to your active view?"
         : "Remove this order from your view? You can still access it later."
    );
    if (!confirmed) return;

    setDeletingId(order.id);

    const { error } = await supabase
      .from("bookings")
      .update({ archived_by_booker: !isHidden })
      .eq("id", order.id)
      .eq("user_id", userId);

    if (error) {
      alert("Failed to remove order.");
      setDeletingId(null);
      return;
    }

    // remove from current view instantly
    setOrders((prev) => prev.filter((o) => o.id !== order.id));

    setDeletingId(null);
  }

  // ✅ NEW FUNCTION (CORRECT PLACEMENT)
  async function handleCompletePayment(order) {
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: order.id,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong.");
    }
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

    <button
       onClick={() => window.location.reload()}
       className="mb-6 px-4 py-2 bg-blue-600 text-white rounded"
    >
  Refresh Data
</button>

      <div className="flex justify-center gap-4 mb-6">
         <button
           onClick={() => setView("active")}
           className={`px-5 py-2 rounded-full text-sm font-semibold transition shadow ${
            view === "active"
              ? "bg-green-600 text-white shadow-md"
              : "bg-green-100 text-green-700 hover:bg-green-200"
         }`}
         >
          🟢 Active
         </button>

         <button
            onClick={() => setView("hidden")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition shadow ${
              view === "hidden"
                ? "bg-gray-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
         >
          🗑️ Hidden
         </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">
          You have not placed any orders yet.
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
                {o?.id && (
                  <Link href={`/my-bookings/${o.id}`}>
                    <img
                      src={thumbnail}
                      alt={listing?.title}
                      className="w-full h-48 object-cover cursor-pointer"
                    />
                  </Link>
                )}

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
                    Booked on:{" "}
                    {o.created_at
                      ? new Intl.DateTimeFormat("en-US", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone:
                            Intl.DateTimeFormat().resolvedOptions().timeZone,
                        }).format(new Date(o.booking_date))
                      : "—"}
                  </p>

                  {o.start_date && o.start_date !== "" ? (
                    <p className="text-sm text-gray-700 mt-1">
                      Scheduled:{" "}
                      {new Date(o.start_date).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(o.end_date).toLocaleDateString()}
                    </p>
                  ) : (
                    <p className="text-sm text-orange-600 mt-1">
                      Schedule: To be confirmed
                    </p>
                  )}

                  <p className="text-sm text-gray-600 mt-1">
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {o.status}
                    </span>
                  </p>

                  {/* ✅ UPDATED BUTTON SECTION */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Link
                      href={`/my-bookings/${o.id}`}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium shadow hover:bg-green-700 transition"
                    >
                      View Booking Details
                    </Link>

                    {o.status === "pending" &&
                      userEmail === o.guest_email && (
                        <button
                          onClick={() => handleCompletePayment(o)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow hover:bg-blue-700 transition"
                        >
                          Complete Payment
                        </button>
                      )}

                    {/* 🔥 NEW DELETE BUTTON */}
                    <button
                      onClick={() => toggleOrder(o)}
                      disabled={deletingId === o.id}
                       className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium shadow hover:bg-gray-300 transition disabled:opacity-50"
                    >
                      {deletingId === o.id
                        ? "Updating..."
                        : o.archived_by_booker
                        ? "Restore"
                        : "Remove from my view"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}