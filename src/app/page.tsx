// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [realListings, setRealListings] = useState([]);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    const { data: realData } = await supabase
      .from("listings")
      .select("*")
      .eq("demo_mode", false)
      .limit(6);

    setRealListings(realData || []);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* TOP BRAND BANNER */}
      <img
        src="/prosperity-banner.png"
        alt="Prosperity Hub Banner"
        className="w-full h-[85px] object-cover"
      />

      {/* HERO SECTION */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Unlock Your Local Prosperity
        </h1>
        <p className="text-gray-600 mt-3 max-w-xl mx-auto">
          List unused items, rent from neighbors, and discover opportunities
          within your local community.
        </p>

        {/* BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Link href="/signup">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-lg font-semibold transition">
              Get Started
            </button>
          </Link>

          <Link href="/demo">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-full text-lg font-semibold transition">
              View Demo Listings
            </button>
          </Link>
        </div>
      </div>

      {/* REAL LISTINGS */}
      <div className="mt-14 px-4 max-w-5xl mx-auto mb-20">
        <h2 className="text-2xl font-semibold mb-4">Available Listings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {realListings.map((listing: any) => (
            <Link
              key={listing.id}
              href={`/listings/${listing.id}`}
              className="bg-white rounded-xl shadow p-4 border border-gray-200 hover:shadow-lg transition"
            >
              <img
                src={listing.image_url}
                className="w-full h-40 object-cover rounded-lg"
              />

              <h3 className="text-lg font-semibold mt-3">{listing.title}</h3>
              <p className="text-gray-600 text-sm">
                {listing.city}, {listing.state}
              </p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
