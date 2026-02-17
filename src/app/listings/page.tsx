// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

type Listing = {
  id: string;
  title: string;
  description: string;
  baseprice: number;
  type?: string | null;
  city?: string | null;
  state?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  pricing_type?: string | null;
  demo_mode?: boolean;
  listing_status?: string | null;
  transaction_type?: string | null; // ✅ Added
};

function ListingsContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const selectedType = searchParams.get("type");

  // Fetch listings (PUBLIC: ACTIVE + NON-DEMO ONLY)
  useEffect(() => {
    async function fetchListings() {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("demo_mode", false)
          .eq("listing_status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (err) {
        console.error("❌ Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  // Filtering logic
  useEffect(() => {
    let filtered = [...listings];

    if (selectedType) {
      filtered = filtered.filter(
        (listing) =>
          listing.type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    if (search.trim()) {
      filtered = filtered.filter((listing) =>
        [listing.title, listing.description, listing.city, listing.state]
          .filter(Boolean)
          .some((field) =>
            field!.toLowerCase().includes(search.toLowerCase())
          )
      );
    }

    setFilteredListings(filtered);
  }, [listings, search, selectedType]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading listings...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-6">
        {selectedType
          ? `Explore ${
              selectedType.charAt(0).toUpperCase() + selectedType.slice(1)
            } Listings`
          : "Explore Available Listings"}
      </h1>

      {/* Search Box */}
      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Search listings by keyword, city, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-2/3 lg:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredListings.length === 0 ? (
        <p className="text-gray-600 text-center">
          No listings found for this category or search term.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => {
            const thumbnail =
              listing.image_urls?.[0] ||
              listing.image_url ||
              null;

            const displayPricing =
              listing.pricing_type
                ? listing.pricing_type.replace("_", " ")
                : "";

            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="block bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4"
              >
                {/* Image + Badge Wrapper */}
                <div className="relative mb-3">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={listing.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      No Image
                    </div>
                  )}

                  {/* Rent / Sale Badge */}
                  {listing.transaction_type && (
                    <div
                      className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm ${
                        listing.transaction_type === "booking"
                          ? "bg-blue-600"
                          : "bg-green-600"
                      }`}
                    >
                      {listing.transaction_type === "booking"
                        ? "Rent"
                        : "Sale"}
                    </div>
                  )}
                </div>

                <h2 className="text-lg font-semibold mb-1">
                  {listing.title}
                </h2>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {listing.description}
                </p>

                <p className="text-blue-700 font-medium mb-2">
                  ${listing.baseprice}
                  {displayPricing ? ` / ${displayPricing}` : ""}
                </p>

                {listing.city && listing.state && (
                  <p className="text-sm text-gray-500">
                    {listing.city}, {listing.state}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading...</p>}>
      <ListingsContent />
    </Suspense>
  );
}
