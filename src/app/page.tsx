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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4 sm:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-10 border border-gray-200">
        <h1 className="text-center text-4xl font-extrabold mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600">
            Manage & Explore Listings
          </span>
        </h1>

        {/* Add Listing Form */}
        <form
          onSubmit={addListing}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-inner mb-10"
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
              className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          ))}

          <button
            type="submit"
            className="col-span-1 md:col-span-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-yellow-600 hover:to-amber-700 transition-all duration-300"
          >
            Add Listing
          </button>
        </form>

        {/* Available Listings */}
        <h2 className="text-2xl font-bold mb-5 text-gray-800">Available Listings</h2>

        {listings.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No listings available. Add your first one above!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-2xl transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 capitalize">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    📍 {listing.city ? `${listing.city}, ${listing.state}` : "Unknown"}
                  </p>
                  <p className="text-sm text-green-600 font-semibold">
                    ${listing.basePrice}
                  </p>
                </div>

                <Link
                  href={`/checkout?listing_id=${listing.id}`}
                  className="mt-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all text-center"
                >
                  Book Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center mt-10 text-gray-500 text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-amber-500">ProsperityHub</span>. All
        rights reserved.
      </footer>
    </main>
  );
}
