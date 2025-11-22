// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function DemoListingsPage() {
  const [demoListings, setDemoListings] = useState([]);

  useEffect(() => {
    loadDemoListings();
  }, []);

  const loadDemoListings = async () => {
    const { data } = await supabase
      .from("listings")
      .select("*")
      .eq("demo_mode", true);

    setDemoListings(data || []);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* TOP BANNER */}
      <img
        src="/prosperity-banner.png"
        alt="Prosperity Hub Banner"
        className="w-full h-[85px] object-cover"
      />

      {/* PAGE HEADER */}
      <div className="text-center mt-10 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Demo Listings
        </h1>
        <p className="text-gray-600 mt-3 max-w-xl mx-auto">
          Explore example listings to see how Prosperity Hub™ works.
        </p>
      </div>

      {/* DEMO LISTINGS GRID */}
      <div className="mt-12 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {demoListings.map((listing: any) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
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

        {demoListings.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            No demo listings yet. Add some from your dashboard.
          </p>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-20 py-10 text-center text-gray-600 text-sm border-t bg-white">
        <div className="flex justify-center space-x-6 mb-3">
          <Link href="/about" className="hover:text-black">About</Link>
          <Link href="/services" className="hover:text-black">Services</Link>
          <Link href="/contact" className="hover:text-black">Contact</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
        </div>

        <div>© {new Date().getFullYear()} Prosperity Voyage LLC</div>
      </footer>
    </div>
  );
}
