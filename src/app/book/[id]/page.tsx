"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function BookPage() {
  const params = useParams();
  const { id } = params;
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchListing() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", String(id)) // ✅ FIX: ensure 'id' is always treated as a string
        .single();

      if (error) {
        console.error("❌ Error fetching listing:", error);
      } else {
        setListing(data);
      }
      setLoading(false);
    }

    fetchListing();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading listing details...
      </div>
    );

  if (!listing)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
        <p>Listing not found.</p>
        <Link href="/" className="text-blue-500 mt-3 underline">
          ← Go back home
        </Link>
      </div>
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-100 py-12 px-6 flex flex-col items-center">
      <div className="max-w-lg bg-white p-8 rounded-2xl shadow-xl border border-amber-200">
        {/* ✅ Version marker for deployment confirmation */}
        <h1 className="text-3xl font-extrabold text-amber-700 mb-3">
          {listing.title} <span className="text-gray-400 text-lg">— v2</span>
        </h1>

        <p className="text-gray-600 mb-2">
          {listing.description || "No description."}
        </p>

        <p className="text-gray-800 font-semibold mb-4">
          Location: {listing.city ? `${listing.city}, ${listing.state}` : "Unknown"}
        </p>

        <p className="text-green-600 text-2xl font-bold mb-6">
          ${listing.baseprice}
        </p>

        {/* ——— Pickup & Contact Details ——— */}
        <div className="mt-6 p-5 rounded-xl border border-amber-200 bg-amber-50/60 text-left">
          <h2 className="text-lg font-semibold text-amber-700 mb-2">
            Pickup & Contact
          </h2>

          <div className="space-y-1 text-gray-700">
            <p>
              <span className="font-medium">Address:</span>{" "}
              {listing.address_line1
                ? `${listing.address_line1}${
                    listing.address_line2 ? ", " + listing.address_line2 : ""
                  }`
                : "—"}
            </p>

            <p>
              <span className="font-medium">City/State/Zip:</span>{" "}
              {listing.city || listing.state || listing.zip
                ? `${listing.city || ""}${
                    listing.state ? ", " + listing.state : ""
                  }${listing.zip ? " " + listing.zip : ""}`
                : "—"}
            </p>

            <p>
              <span className="font-medium">Contact:</span>{" "}
              {listing.contact_name || "—"}
            </p>

            <p>
              <span className="font-medium">Phone:</span>{" "}
              {listing.contact_phone || "—"}
            </p>

            <p>
              <span className="font-medium">Email:</span>{" "}
              {listing.contact_email || "—"}
            </p>

            <p className="mt-2">
              <span className="font-medium">Instructions:</span>
              <br />
              {listing.pickup_instru || "—"}
            </p>
          </div>
        </div>

        <Link
          href={`/checkout?listing_id=${listing.id}`}
          className="block mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 hover:from-green-600 hover:to-emerald-700 transition-all text-center"
        >
          Proceed to Checkout
        </Link>
      </div>
    </main>
  );
}
