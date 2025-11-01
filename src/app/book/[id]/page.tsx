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
        .eq("id", id)
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
        <h1 className="text-3xl font-extrabold text-amber-700 mb-3">
          {listing.title}
        </h1>
        <p className="text-gray-600 mb-2">{listing.description || "No description."}</p>
        <p className="text-gray-800 font-semibold mb-4">
          Location: {listing.city ? `${listing.city}, ${listing.state}` : "Unknown"}
        </p>
        <p className="text-green-600 text-2xl font-bold mb-6">
          ${listing.basePrice}
        </p>

        <Link
          href={`/checkout?listing_id=${listing.id}`}
          className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:scale-105 hover:from-green-600 hover:to-emerald-700 transition-all"
        >
          Proceed to Checkout
        </Link>
      </div>
    </main>
  );
}
