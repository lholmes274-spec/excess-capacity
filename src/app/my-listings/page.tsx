// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setListings([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Fetch all listings that belong to this user
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your listings...</p>
      </div>
    );

  if (!userId)
    return (
      <div className="text-center py-20">
        <p className="text-lg text-red-600 font-semibold">
          Please log in to view your listings.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Go to Login
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">My Listings</h1>

      {listings.length === 0 ? (
        <p className="text-gray-600 text-center">
          You haven't created any listings yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const thumbnail =
              listing.image_urls?.[0] || listing.image_url || null;

            return (
              <div
                key={listing.id}
                className="bg-white border rounded-lg shadow-sm p-4"
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={listing.title}
                    className="w-full h-44 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-44 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-gray-500 text-sm">
                    No Image
                  </div>
                )}

                <h2 className="text-lg font-semibold mb-1">{listing.title}</h2>
                <p className="text-gray-600 text-sm mb-1">
                  ${listing.baseprice} / day
                </p>
                {listing.city && listing.state && (
                  <p className="text-sm text-gray-500 mb-3">
                    {listing.city}, {listing.state}
                  </p>
                )}

                <div className="flex justify-between">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </Link>

                  <Link
                    href={`/edit-listing/${listing.id}`}
                    className="text-orange-600 hover:underline text-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
