export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const { data: listings, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error loading listings:", error);
    return (
      <div className="min-h-screen flex justify-center items-center text-red-600 font-semibold">
        Failed to load listings. Please try again later.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-center text-4xl md:text-5xl font-extrabold mb-12">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600">
            ProsperityHub Marketplace
          </span>
        </h1>

        {/* Listings grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {listings?.map((listing) => (
            <div
              key={listing.id}
              className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300 group"
            >
              {/* Image */}
              <div className="relative h-56 w-full overflow-hidden">
                {listing.image_url ? (
                  <Image
                    src={listing.image_url}
                    alt={listing.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    priority
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    No image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col h-full">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-yellow-600 transition-colors">
                  {listing.title}
                </h2>

                <p className="text-gray-500 text-sm mb-4">
                  {listing.location || "Location not provided"}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-lg font-bold text-gray-800">
                    ${Number(listing.basePrice ?? 0).toFixed(2)}
                  </span>

                  <Link
                    href={`/checkout?listing_id=${listing.id}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-yellow-600 hover:to-amber-700 transition-all"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold text-yellow-600">ProsperityHub</span>.
          All rights reserved.
        </footer>
      </div>
    </main>
  );
}
