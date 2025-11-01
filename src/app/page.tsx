"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    basePrice: "",
    type: "",
    state: "",
    city: "",
    zip: "",
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);

  // ✅ 1. Handle form inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ 2. Fetch all listings
  const fetchListings = async () => {
    try {
      const res = await fetch("/api/get-listings");
      const data = await res.json();
      if (res.ok) setListings(data);
      else console.error("Failed to fetch listings:", data);
    } catch (err) {
      console.error("Error loading listings:", err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // ✅ 3. Add a new listing
  const handleAddListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/add-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("❌ Failed to add listing: " + data.error);
      } else {
        alert("✅ Listing added successfully!");
        setFormData({
          title: "",
          description: "",
          location: "",
          basePrice: "",
          type: "",
          state: "",
          city: "",
          zip: "",
        });
        fetchListings(); // refresh list
      }
    } catch (error) {
      console.error("Add listing error:", error);
      alert("Unexpected error while adding listing.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 4. Book a specific listing (Step 2)
  const handleBookListing = async (item: any) => {
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title,
          amount: item.basePrice || 0,
          listingId: item.id,
        }),
      });

      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout for " + item.title);
      }
    } catch (err) {
      console.error("Book Listing error:", err);
      alert("Error booking listing.");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      {/* ---------- ADD LISTING FORM ---------- */}
      <h1 className="text-2xl font-bold mb-4">Add Listing</h1>

      <form
        onSubmit={handleAddListing}
        className="flex flex-col gap-3 w-full max-w-md border p-4 rounded-lg bg-white shadow"
      >
        <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} className="border p-2 rounded" required />
        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} className="border p-2 rounded" />
        <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} className="border p-2 rounded" />
        <input name="basePrice" placeholder="Base Price" type="number" value={formData.basePrice} onChange={handleChange} className="border p-2 rounded" />
        <input name="type" placeholder="Type" value={formData.type} onChange={handleChange} className="border p-2 rounded" />
        <input name="state" placeholder="State" value={formData.state} onChange={handleChange} className="border p-2 rounded" />
        <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="border p-2 rounded" />
        <input name="zip" placeholder="ZIP Code" value={formData.zip} onChange={handleChange} className="border p-2 rounded" />

        <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          {loading ? "Adding..." : "Add Listing"}
        </button>
      </form>

      {/* ---------- LISTINGS SECTION ---------- */}
      <div className="w-full max-w-5xl mt-10">
        <h2 className="text-xl font-semibold mb-4">Available Listings</h2>

        {listings.length === 0 ? (
          <p className="text-gray-500">No listings found yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((item: any) => (
              <div key={item.id} className="border p-5 rounded-xl shadow bg-white flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <p className="text-sm text-gray-800">
                    📍 {item.city}, {item.state}
                  </p>
                  <p className="text-sm font-semibold text-green-700 mt-1">
                    💲 {item.basePrice || 0}
                  </p>
                </div>

                <button
                  onClick={() => handleBookListing(item)}
                  className="mt-4 bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
                >
                  Book Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
