"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase.from("listings").select("*");
      if (error) console.error("Error fetching listings:", error);
      else setListings(data || []);
    };
    fetchListings();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-blue-100 text-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-6xl py-10"
      >
        <h1 className="text-4xl sm:text-6xl font-bold text-center mb-8 text-emerald-700">
          Prosperity Hub — Share Your Space, Grow Together 🌿
        </h1>

        <p className="text-center text-gray-700 mb-12 max-w-2xl mx-auto">
          Browse and book from available listings. Whether you have an extra desk,
          parking spot, or service, Prosperity Hub helps you earn through shared capacity.
        </p>

        {listings.length === 0 ? (
          <p className="text-center text-gray-500">
            No listings available yet. Check back soon!
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <motion.div
                key={listing.id}
                whileHover={{ scale: 1.03 }}
                className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-2xl font-semibold text-emerald-700 mb-2">
                    {listing.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{listing.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="font-semibold text-gray-800">
                    ${listing.price.toFixed(2)}
                  </span>
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
                    Book Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <footer className="mt-12 text-sm text-gray-600">
        © {new Date().getFullYear()} Prosperity Voyage Living Trust. All rights reserved.
      </footer>
    </main>
  );
}
