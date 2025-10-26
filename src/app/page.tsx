"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { v4 as uuid } from "uuid";
import { supabase } from "@/lib/supabaseClient";

type ListingRow = {
  id: string;
  owner: string;
  type: string;
  title: string;
  units: number | null;
  location: string | null;
  base_price: number | null; // <- matches DB column
  notes: string | null;
  created_at?: string;
};

export default function Page() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [filteredListings, setFilteredListings] = useState<ListingRow[]>([]);
  const [newListing, setNewListing] = useState({
    title: "",
    location: "",
    basePrice: "", // UI field; mapped to DB base_price on insert
    type: "workspace",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(false);

  // Load listings
  useEffect(() => {
    async function loadListings() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading listings:", error.message);
        return;
      }

      const normalized = (data || []).map((item: any) => ({
        ...item,
        base_price: Number(item.base_price ?? 0),
        units: Number(item.units ?? 0),
      })) as ListingRow[];

      setListings(normalized);
      setFilteredListings(normalized);
    }
    loadListings();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setNewListing((prev) => ({ ...prev, [name]: value }));
  }

  // Insert uses base_price (snake_case)
  async function handleAddListing(e: React.FormEvent) {
    e.preventDefault();

    if (!newListing.title || !newListing.location || !newListing.basePrice) {
      alert("Please fill all fields.");
      return;
    }

    setLoading(true);

    const rowToInsert = {
      id: uuid(),
      owner: "You",
      type: newListing.type,
      title: newListing.title,
      units: 1,
      location: newListing.location,
      base_price: parseFloat(newListing.basePrice), // <- correct column
      notes: "",
    };

    const { data, error } = await supabase
      .from("listings")
      .insert(rowToInsert)
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error("Insert error:", error.message);
      alert("Failed to add listing: " + error.message);
      return;
    }

    const normalized: ListingRow = {
      ...(data as any),
      base_price: Number((data as any).base_price ?? 0),
      units: Number((data as any).units ?? 0),
    };

    setListings((prev) => [normalized, ...prev]);
    setFilteredListings((prev) => [normalized, ...prev]);
    setNewListing({ title: "", location: "", basePrice: "", type: "workspace" });
  }

  // Checkout
  async function handleBook(listing: ListingRow) {
    try {
      const payload = {
        id: listing.id,
        title: listing.title,
        basePrice: Number(listing.base_price ?? 0),
      };

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing: payload }),
      });

      const { url, error } = await res.json();
      if (error) throw new Error(error);
      if (url) window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Failed to start Stripe checkout.");
    }
  }

  // Search + filter
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = listings.filter((l) => {
      const matchesSearch =
        (l.title || "").toLowerCase().includes(q) ||
        (l.location || "").toLowerCase().includes(q) ||
        (l.owner || "").toLowerCase().includes(q);
      const matchesType = filterType === "all" || l.type === filterType;
      return matchesSearch && matchesType;
    });
    setFilteredListings(filtered);
  }, [searchQuery, filterType, listings]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <motion.h1
        className="text-3xl font-bold mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Excess Capacity Sharing Marketplace
      </motion.h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Add Listing */}
        <motion.div
          className="bg-white rounded-2xl shadow p-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-xl font-semibold mb-4">Add New Listing</h2>
          <form onSubmit={handleAddListing} className="space-y-4">
            <input
              type="text"
              name="title"
              value={newListing.title}
              onChange={handleChange}
              placeholder="Title (e.g., Storage Shed, Desk Space)"
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              name="location"
              value={newListing.location}
              onChange={handleChange}
              placeholder="Location (e.g., Elizabethtown, KY)"
              className="w-full border p-2 rounded"
            />
            <input
              type="number"
              name="basePrice"
              value={newListing.basePrice}
              onChange={handleChange}
              placeholder="Base Price ($)"
              className="w-full border p-2 rounded"
              step="0.01"
              min="0"
            />
            <select
              name="type"
              value={newListing.type}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="workspace">Workspace</option>
              <option value="parking">Parking</option>
              <option value="storage">Storage</option>
              <option value="housing">Housing</option>
              <option value="equipment">Equipment</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
            >
              {loading ? "Adding..." : "Add Listing"}
            </button>
          </form>
        </motion.div>

        {/* Right: Listings */}
        <motion.div
          className="bg-white rounded-2xl shadow p-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-xl font-semibold mb-4">Available Listings</h2>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Search by title, location, or owner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="all">All types</option>
              <option value="workspace">Workspace</option>
              <option value="parking">Parking</option>
              <option value="storage">Storage</option>
              <option value="housing">Housing</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>

          {filteredListings.length === 0 ? (
            <p className="text-gray-500 text-sm">No listings found.</p>
          ) : (
            <ul className="space-y-4">
              {filteredListings.map((l) => (
                <motion.li
                  key={l.id}
                  className="border rounded-xl p-4 shadow-sm bg-gray-50"
                  whileHover={{ scale: 1.01 }}
                >
                  <h3 className="text-lg font-semibold">{l.title}</h3>
                  <p className="text-sm text-gray-500">
                    {l.location} • ${Number(l.base_price ?? 0).toFixed(2)} / day
                  </p>
                  <p className="text-xs text-gray-400">
                    Type: {l.type} • Units: {l.units ?? 0} • Posted by {l.owner}
                  </p>
                  <button
                    disabled={(l.units ?? 0) < 1}
                    onClick={() => handleBook(l)}
                    className={`mt-3 px-4 py-1 rounded text-sm text-white ${
                      (l.units ?? 0) < 1
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {(l.units ?? 0) < 1 ? "Sold Out" : "Book Now"}
                  </button>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </main>
  );
}
