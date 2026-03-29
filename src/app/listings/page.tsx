// @ts-nocheck
"use client";
console.log("🔥 VERSION TEST 2 🔥");
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
  transaction_type?: string | null;
};

function ListingsContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const selectedType = searchParams.get("type");

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
              listing.image_urls?.[0] || listing.image_url || null;

            let displayPricing = "";

            if (listing.type === "service") {
              displayPricing = "per service";
            } else if (listing.transaction_type === "sale") {
               displayPricing = "for sale";
            } else if (listing.pricing_type) {
              displayPricing = listing.pricing_type.replace("_", " ");
            }

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
                    <div className="w-full h-48 rounded-lg flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 mb-2 opacity-60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16l4-4a3 3 0 014 0l4 4m0 0l2-2a3 3 0 014 0l3 3M4 19h16"
                        />
                      </svg>

                      <p className="text-sm font-semibold">
                        Image Coming Soon
                      </p>
                      <p className="text-xs opacity-70">
                        Submitted by Seller
                      </p>
                    </div>
                  )}

                  {(listing.type || listing.transaction_type) && (
                    <div
                      className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm ${
                        listing.type === "service"
                          ? "bg-purple-600"
                          : listing.transaction_type === "sale"
                          ? "bg-green-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {listing.type === "service"
                        ? "Service"
                        : listing.transaction_type === "sale"
                        ? "Sale"
                        : "Rent"}
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
                   {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: listing.currency || "USD",
                    minimumFractionDigits: 0,
                  }).format(Number(listing.baseprice))}

                  {listing.transaction_type !== "sale" && displayPricing && (
                    <span className="text-sm text-gray-600">
                    {" "}
                    / {displayPricing}
                    </span>
                  )}
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