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
    baseprice: "",
    type: "",
    state: "",
    city: "",
    zip: "",
    address_line1: "",
    address_line2: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    pickup_instru: "",
  });

  // ✅ Fetch all listings
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

  // ✅ Add listing
  async function addListing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.title || !form.baseprice) {
      return alert("Please fill required fields");
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      const { error } = await supabase.from("listings").insert([
        {
          title: form.title,
          description: form.description,
          location: form.location,
          basePrice: Number(form.baseprice),
          type: form.type,
          state: form.state,
          city: form.city,
          zip: form.zip,
          address_line1: form.address_line1,
          address_line2: form.address_line2,
          contact_name: form.contact_name,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          pickup_instru: form.pickup_instru,
          owner_id: user?.id || null,
          demo_mode: false, // ✅ Default all new listings as real (not demo)
        },
      ]);

      if (error) {
        console.error("❌ Error adding listing:", error);
        alert("❌ Error adding listing. Please try again.");
      } else {
        alert("✅ Listing added successfully!");
        setForm({
          title: "",
          description: "",
          location: "",
          baseprice: "",
          type: "",
          state: "",
          city: "",
          zip: "",
          address_line1: "",
          address_line2: "",
          contact_name: "",
          contact_phone: "",
          contact_email: "",
          pickup_instru: "",
        });
        fetchListings();
      }
    } catch (err: any) {
      console.error("⚠️ Unexpected error:", err);
      alert("⚠️ Something went wrong while adding your listing.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 py-10 px-4 sm:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-10 border border-amber-200">
        {/* 🌐 Intro */}
        <h1 className="text-center text-5xl font-extrabold mb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 drop-shadow-md">
            Dynamic Excess Capacity Sharing
          </span>
        </h1>
        <p className="text-center text-gray-700 text-lg mb-8">
          Manage & Explore Listings that unlock hidden potential.
        </p>

        {/* Add Listing Form */}
        <form
          onSubmit={addListing}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-6 border border-amber-200 shadow-inner mb-10"
        >
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
          <input
            type="text"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
          <input
            type="text"
            placeholder="Base Price"
            value={form.baseprice}
            onChange={(e) => setForm({ ...form, baseprice: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
          <input
            type="text"
            placeholder="Type (service, storage, housing, etc.)"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
          />

          {/* Contact + Pickup */}
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm md:col-span-2 min-h-[100px]"
          />

          <button
            type="submit"
            className="col-span-1 md:col-span-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-2xl hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 mt-4"
          >
            Add Listing
          </button>
        </form>

        {/* Listings */}
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
                className={`bg-white rounded-xl border border-amber-200 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between ${
                  listing.demo_mode ? "opacity-80" : ""
                }`}
              >
                <div>
                  <h3 className="text-xl font-semibold text-amber-700 mb-2 capitalize">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    📍 {listing.city}, {listing.state}
                  </p>
                  <p className="text-lg text-green-600 font-semibold">
                    ${listing.basePrice}
                  </p>
                </div>

                <Link
                  href={`/listings/${listing.id}`}
                  className={`mt-5 py-2.5 text-white font-medium rounded-lg shadow-md text-center transition-all ${
                    listing.demo_mode
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 hover:from-green-600 hover:to-emerald-700"
                  }`}
                >
                  {listing.demo_mode ? "Demo Listing" : "Book Now"}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
