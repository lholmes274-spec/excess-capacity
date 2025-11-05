// src/app/listings/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) setListing(data);
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading listing...</div>;
  if (!listing) return <div className="p-8 text-red-500">Listing not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-2xl mt-6 border border-gray-100">
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

      {/* ✅ Price Section */}
      {listing.basePrice && (
        <p className="text-2xl font-semibold text-green-700 mt-2">
          ${listing.basePrice}
          <span className="text-base font-normal text-gray-600">
            {" "}
            {listing.duration ? listing.duration : "per unit"}
          </span>
        </p>
      )}

      {/* ✅ Notes (supports both "notes" and "note" fields) */}
      {(listing.notes || listing.note) && (
        <p className="mt-3 text-sm text-gray-600 italic">
          {listing.notes || listing.note}
        </p>
      )}

      {/* ✅ Pickup Instructions (supports both "pickup_instru" and "pickup_instructions") */}
      {(listing.pickup_instru || listing.pickup_instructions) && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 mb-2">
            Pickup & Instructions
          </h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">
            {listing.pickup_instru || listing.pickup_instructions}
          </p>
        </div>
      )}

      {/* ✅ Contact Section */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Contact Information</h3>
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
