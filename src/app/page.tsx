// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [realListings, setRealListings] = useState([]);
  const [user, setUser] = useState(undefined); // undefined = loading, null = no user

  // Load listings and check auth
  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);

      const { data: realData } = await supabase
        .from("listings")
        .select("*")
        .eq("demo_mode", false)
        .limit(6);

      setRealListings(realData || []);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ⭐ PREMIUM GRADIENT BANNER WITH BLUE TITLE BOX */}
      <div className="w-full flex justify-center px-4 mt-6">
        <div
          className="
            w-full 
            max-w-[1300px]
            rounded-2xl 
            shadow-xl 
            py-10 
            px-6 
            text-center 
            text-white
            bg-gradient-to-r 
            from-[#0f172a] 
            via-[#142c45] 
            to-[#d4a934]
          "
          style={{
            borderRadius: "18px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
          }}
        >

          {/* 🔵 Blue rectangle behind the title */}
          <div className="inline-block bg-[#0057ff] px-6 py-2 rounded-md">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">
              Prosperity Hub™
            </h1>
          </div>

          <p className="text-xl mt-4 font-semibold opacity-95">
            Dynamic Excess Capacity Sharing Platform
          </p>
        </div>
      </div>

      {/* HERO SECTION */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Unlock Your Local Prosperity
        </h1>
        <p className="text-gray-600 mt-3 max-w-xl mx-auto">
          List unused items, rent from neighbors, and discover opportunities
          within your local community.
        </p>

        {/* CTA BUTTONS (ONLY WHEN LOGGED OUT) */}
        {user === null && (
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
        )}
      </div>

      {/* AVAILABLE LISTINGS */}
      <div className="mt-14 px-4 max-w-5xl mx-auto mb-20">
        <h2 className="text-2xl font-semibold mb-4">Available Listings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {realListings.map((listing) => (
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
