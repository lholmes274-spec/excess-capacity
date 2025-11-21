// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  const router = useRouter();
  const [showConfirmMessage, setShowConfirmMessage] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) return;
      router.push("/signup");
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=signup") || hash.includes("access_token")) {
      setShowConfirmMessage(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  }, [router]);

  async function fetchListings() {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setListings(data);
  }

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 py-10 px-4 sm:px-8 lg:px-16">

      {showConfirmMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          ✅ Email confirmed — redirecting to login...
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-10 border border-amber-200">

        {/* HERO */}
        <h1 className="text-center text-5xl font-extrabold mb-2 text-amber-700 drop-shadow-md">
          Dynamic Excess Capacity Sharing
        </h1>
        <p className="text-center text-gray-700 text-lg mb-8">
          Manage & Explore Listings that unlock hidden potential.
        </p>

        {/* CTA BUTTON */}
        <div className="flex justify-center gap-6 mb-10">
          <Link
            href="/add-listing"
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition"
          >
            ➕ Add Listing
          </Link>
        </div>

        {/* LISTINGS SECTION */}
        <h2
          id="listings"
          className="text-3xl font-bold mb-6 text-gray-800 text-center md:text-left"
        >
          Available Listings
        </h2>

        {listings.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-lg">
            No listings available. Add your first one!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}  // ✅ FIXED PATH
                className="block bg-white rounded-xl border border-amber-200 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6"
              >
                {/* MAIN IMAGE */}
                <div className="w-full h-40 mb-4">
                  <img
                    src={listing.image_url || "/no-image.png"} // ✅ MAIN IMAGE
                    className="w-full h-full object-cover rounded-lg border"
                    alt={listing.title}
                  />
                </div>

                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-amber-700 mb-2 capitalize">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    📍{" "}
                    {listing.city
                      ? `${listing.city}, ${listing.state}`
                      : listing.location || "—"}
                  </p>

                  <p className="text-lg text-green-600 font-semibold">
                    ${listing.baseprice} {/* ✅ FIXED */}
                  </p>
                </div>

                {!listing.demo_mode ? (
                  <div className="mt-5">
                    <span className="block text-sm text-gray-500 italic text-center">
                      Click to view or book
                    </span>
                    <div className="mt-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md py-2.5 text-center">
                      Book Now
                    </div>
                  </div>
                ) : (
                  <button
                    disabled
                    className="mt-5 w-full py-2.5 bg-gray-400 text-white font-medium rounded-lg shadow-md cursor-not-allowed"
                  >
                    Demo Listing
                  </button>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
