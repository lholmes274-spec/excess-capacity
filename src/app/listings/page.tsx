// @ts-nocheck
"use client";
console.log("🔥 VERSION TEST 3 🔥");
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
  country?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  pricing_type?: string | null;
  demo_mode?: boolean;
  listing_status?: string | null;
  transaction_type?: string | null;
  currency?: string | null;
  created_at?: string;
};

function ListingsContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("newest");
  const [locationFilter, setLocationFilter] = useState("all");

  const searchParams = useSearchParams();
  const selectedType = searchParams.get("type");

  useEffect(() => {
    async function fetchListings() {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("demo_mode", false)
          .eq("listing_status", "active");

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

  // 🔥 NORMALIZE LOCATION (KEY FIX)
  const getNormalizedLocation = (l: Listing) => {
    if (!l.city) return null;

    const city = l.city.trim().toLowerCase();
    const country = l.country?.toLowerCase();

    if (country === "united states" || country === "usa") {
      return `${city},${l.state?.trim().toLowerCase()}`;
    }

    if (country === "dominican republic") {
      return `${city},rd`;
    }

    return `${city},${l.state?.trim().toLowerCase() || ""}`;
  };

  // 🔥 FORMAT FOR DISPLAY (CLEAN UI)
  const formatLocationDisplay = (loc: string) => {
    const [city, state] = loc.split(",");

    const formattedCity =
      city.charAt(0).toUpperCase() + city.slice(1);

    const formattedState = state?.toUpperCase();

    return `${formattedCity}, ${formattedState}`;
  };

  // 🔥 UNIQUE LOCATIONS (FIX DUPLICATES)
  const uniqueLocations = Array.from(
    new Set(
      listings
        .map((l) => getNormalizedLocation(l))
        .filter(Boolean)
    )
  );

  useEffect(() => {
    let filtered = [...listings];

    // TYPE FILTER
    if (selectedType) {
      filtered = filtered.filter(
        (listing) =>
          listing.type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    // SEARCH FILTER
    if (search.trim()) {
      filtered = filtered.filter((listing) =>
        [listing.title, listing.description, listing.city, listing.state]
          .filter(Boolean)
          .some((field) =>
            field!.toLowerCase().includes(search.toLowerCase())
          )
      );
    }

    // 📍 LOCATION FILTER (FIXED)
    if (locationFilter !== "all") {
      filtered = filtered.filter(
        (listing) =>
          getNormalizedLocation(listing) === locationFilter
      );
    }

    // 🔥 SORTING
    if (sortOption === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at || "").getTime() -
          new Date(a.created_at || "").getTime()
      );
    } else if (sortOption === "price_low") {
      filtered.sort((a, b) => (a.baseprice || 0) - (b.baseprice || 0));
    } else if (sortOption === "price_high") {
      filtered.sort((a, b) => (b.baseprice || 0) - (a.baseprice || 0));
    }

    setFilteredListings(filtered);
  }, [listings, search, selectedType, sortOption, locationFilter]);

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

      {/* SEARCH + SORT + LOCATION */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
        <input
          type="text"
          placeholder="Search listings by keyword, city, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-2/3 lg:w-1/2 p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg shadow-sm"
        >
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="p-3 border border-gray-300 rounded-lg shadow-sm"
        >
          <option value="all">All Locations</option>
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {formatLocationDisplay(loc)}
            </option>
          ))}
        </select>
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

            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="block bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4"
              >
                <div className="relative mb-3">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={listing.title}
                      className="w-full h-48 object-cover object-top rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500">
                      Image Coming Soon
                    </div>
                  )}

                  {(listing.type || listing.transaction_type) && (
                    <div
                      className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold rounded-full text-white ${
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