export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  // ✅ Always fetch fresh listings from Supabase
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error fetching listings:", error);
    return (
      <div className="min-h-screen flex justify-center items-center text-red-600 font-semibold">
        Failed to load listings. Please try again later.
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-gray-600">
        <h1 className="text-2xl font-bold mb-2">No Listings Available</h1>
        <p className="text-gray-500">New opportunities will appear here soon.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-800">
          ProsperityHub Marketplace
        </h1>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl shadow hover:shadow-xl transition duration-300 overflow-hidden border border-gray-200"
            >
              {/* Image Section */}
              <div className="relative h-48 w-full">
                {listing.image_url ? (
                  <Image
                    src={listing.image_url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500 text-sm">
                    No image
                  </div>
                )}
              </div>

              {/* Info Section */}
              <div className="p-4 flex flex-col h-full">
                <h2 className="text-lg font-semibold text-gray-800 mb-1">
                  {listing.title}
                </h2>
                <p className="text-sm text-gray-500 mb-3">
                  {listing.location || "No location provided"}
                </p>

                <div className="mt-auto flex items-center justify-between">
                  <p className="text-lg font-bold text-gray-700">
                    ${Number(listing.basePrice ?? 0).toFixed(2)}
                  </p>

                  {/* Book Now Button */}
                  <Link
                    href={`/checkout?listing_id=${listing.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-400 text-sm">
          © {new Date().getFullYear()} ProsperityHub. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
