"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    basePrice: "",
    type: "",
    state: "",
    city: "",
    zip: "",
  });

  // Fetch all listings
  async function fetchListings() {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setListings(data);
  }

  useEffect(() => {
    fetchListings();
  }, []);

  // Add new listing
  async function addListing(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.basePrice) return alert("Please fill required fields");

    const { error } = await supabase.from("listings").insert([
      {
        title: form.title,
        description: form.description,
        location: form.location,
        basePrice: form.basePrice,
        type: form.type,
        state: form.state,
        city: form.city,
        zip: form.zip,
      },
    ]);

    if (error) {
      alert("❌ Error adding listing");
      console.error(error);
    } else {
      alert("✅ Listing added successfully!");
      setForm({
        title: "",
        description: "",
        location: "",
        basePrice: "",
        type: "",
        state: "",
        city: "",
        zip: "",
      });
      fetchListings();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 py-10 px-4 sm:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-10 border border-amber-200">
        <h1 className="text-center text-5xl font-extrabold mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 drop-shadow-md">
            Manage & Explore Listings
          </span>
        </h1>

        {/* Add Listing Form */}
        <form
          onSubmit={addListing}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-6 border border-amber-200 shadow-inner mb-10"
        >
          {Object.keys(form).map((key) => (
            <input
              key={key}
              type="text"
              placeholder={
                key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")
              }
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm hover:shadow-md transition-all"
            />
          ))}

          <button
            type="submit"
            className="col-span-1 md:col-span-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-2xl hover:from-amber-600 hover:to-yellow-700 transition-all duration-300"
          >
            Add Listing
          </button>
        </form>

        {/* Available Listings */}
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center md:text-left">
          Available Listings
        </h2>

        {listings.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-lg">
            No listings available. Add your first one above!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-amber-200 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-xl font-semibold text-amber-700 mb-2 capitalize">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    📍 {listing.city ? `${listing.city}, ${listing.state}` : "Unknown"}
                  </p>
                  <p className="text-lg text-green-600 font-semibold">
                    ${listing.basePrice}
                  </p>
                </div>

                <Link
                  href={`/book/${listing.id}`}
                  className="mt-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-xl hover:scale-105 hover:from-green-600 hover:to-emerald-700 transition-all text-center"
                >
                  Book Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-600 text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-amber-600">ProsperityHub</span>. All
        rights reserved.
      </footer>
    </main>
  );
}
