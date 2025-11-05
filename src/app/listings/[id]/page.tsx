// src/app/listings/[id]/page.tsx
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(false); // ✅ Debug toggle
  const [isAdmin, setIsAdmin] = useState(false); // ✅ Admin visibility flag

  useEffect(() => {
    // ✅ Check admin access from localStorage or env variable
    const adminAuthorized =
      localStorage.getItem("adminAuthorized") === "true" ||
      process.env.NEXT_PUBLIC_ADMIN_CODE === "VoyageAccess2025!";
    setIsAdmin(adminAuthorized);

    if (!id) return;
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        console.log("🧩 Listing data from Supabase:", data); // Debug log
        setListing(data);
      } else {
        console.error("❌ Fetch error:", error);
      }
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  if (loading)
    return <div className="p-8 text-gray-500">Loading listing...</div>;
  if (!listing)
    return <div className="p-8 text-red-500">Listing not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-2xl mt-6 border border-gray-100">
      {/* ✅ Admin-Only Debug Mode */}
      {isAdmin && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className="px-3 py-1 text-sm rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition"
            >
              {debugMode ? "Hide Debug Info" : "Show Debug Info"}
            </button>
          </div>

          {debugMode && (
            <pre className="bg-gray-900 text-green-300 text-xs rounded-lg p-4 overflow-x-auto mb-6 border border-gray-700 shadow-inner">
              {JSON.stringify(listing, null, 2)}
            </pre>
          )}
        </>
      )}

      {/* ✅ Title */}
      <h1 className="text-3xl font-bold text-orange-800 mb-2">
        {listing.title}
      </h1>

      <p className="text-sm text-gray-500 mb-4">— v2</p>

      {/* ✅ Description */}
      <p className="text-gray-700 mb-4">{listing.description}</p>

      {/* ✅ Location */}
      {listing.location && (
        <p className="text-gray-800 font-semibold mb-2">
          Location: <span className="text-gray-900">{listing.location}</span>
        </p>
      )}

      {/* ✅ Dynamic Price Section */}
      {listing.basePrice && (
        <p className="text-2xl font-semibold text-green-700 mt-2">
          ${listing.basePrice}
          <span className="text-base font-normal text-gray-600">
            {" "}
            {listing.type?.toLowerCase() === "service"
              ? "per hour"
              : listing.type?.toLowerCase() === "housing"
              ? "per night"
              : listing.type?.toLowerCase() === "storage"
              ? "per month"
              : listing.type?.toLowerCase() === "vehicle"
              ? "per day"
              : listing.duration
              ? listing.duration
              : "per unit"}
          </span>
        </p>
      )}

      {/* ✅ Notes */}
      {(listing.notes || listing.note) && (
        <p className="mt-3 text-sm text-gray-600 italic">
          {listing.notes || listing.note}
        </p>
      )}

      {/* ✅ Pickup Instructions */}
      {(listing.pickup_instru ||
        listing.pickup_instructions ||
        listing.instructions ||
        listing.pickup ||
        listing.pickup_note) && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 mb-2">
            Pickup & Instructions
          </h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">
            {listing.pickup_instru ||
              listing.pickup_instructions ||
              listing.instructions ||
              listing.pickup ||
              listing.pickup_note}
          </p>
        </div>
      )}

      {/* ✅ Contact Section */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">
          Contact Information
        </h3>
        <p>
          <strong>Contact:</strong> {listing.contact_name || "—"}
        </p>
        <p>
          <strong>Phone:</strong> {listing.contact_phone || "—"}
        </p>
        <p>
          <strong>Email:</strong> {listing.contact_email || "—"}
        </p>
      </div>

      {/* ✅ CTA */}
      <button
        className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        onClick={() => alert("Demo Only – Checkout disabled")}
      >
        Proceed to Checkout
      </button>
    </div>
  );
}
