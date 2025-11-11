"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation"; // ✅ Added for redirect

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  const router = useRouter();
  const [showConfirmMessage, setShowConfirmMessage] = useState(false);

  const [form, setForm] = useState({
    title: "",
    location: "",
    baseprice: "",
    type: "",
    state: "",
    city: "",
    zip: "",
    description: "",
    address_line1: "",
    address_line2: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    pickup_instructions: "",
    demo_mode: false,
  });

  // ✅ Only check if user is logged in (don’t auto-redirect unsubscribed)
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) return;
      const user = data?.user;
      if (!user) router.push("/signup");
    };
    checkUser();
  }, [router]);

  // ✅ Detect Supabase email confirmation and redirect to /login
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=signup") || hash.includes("access_token")) {
      setShowConfirmMessage(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [router]);

  // ✅ Fetch listings
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

  // ✅ Add new listing (restricted to subscribed users)
  async function addListing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.title || !form.baseprice) {
      return alert("Please fill in the required fields.");
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      alert("Please sign in before adding a listing.");
      router.push("/signup");
      return;
    }

    // Check subscription before allowing listing creation
    const { data: profile, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("is_subscribed")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      alert("Unable to verify subscription status. Please try again.");
      return;
    }

    if (!profile?.is_subscribed) {
      alert("Please subscribe to unlock this feature.");
      router.push("/subscribe");
      return;
    }

    const { error } = await supabase.from("listings").insert([
      {
        title: form.title,
        location: form.location,
        basePrice: Number(form.baseprice),
        type: form.type,
        state: form.state,
        city: form.city,
        zip: form.zip,
        description: form.description,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        pickup_instructions: form.pickup_instructions,
        demo_mode: form.demo_mode,
        owner_id: user?.id || null,
      },
    ]);

    if (error) {
      console.error("❌ Error adding listing:", error);
      alert("❌ Failed to add listing. Check console for details.");
    } else {
      alert("✅ Listing added successfully!");
      setForm({
        title: "",
        location: "",
        baseprice: "",
        type: "",
        state: "",
        city: "",
        zip: "",
        description: "",
        address_line1: "",
        address_line2: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        pickup_instructions: "",
        demo_mode: false,
      });
      fetchListings();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 py-10 px-4 sm:px-8 lg:px-16">
      {/* ✅ Confirmation Message */}
      {showConfirmMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium z-50">
          ✅ Email confirmed — redirecting to login...
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-10 border border-amber-200">
        {/* 🌐 Brand Header */}
        <h1 className="text-center text-5xl font-extrabold mb-2 text-amber-700 drop-shadow-md">
          Dynamic Excess Capacity Sharing
        </h1>
        <p className="text-center text-gray-700 text-lg mb-8">
          Manage & Explore Listings that unlock hidden potential.
        </p>

        {/* 🧾 Add Listing Form */}
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
          <input
            type="text"
            placeholder="State"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
          <input
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
          <input
            type="text"
            placeholder="Zip Code"
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm md:col-span-2 min-h-[100px]"
          />

          {/* 📦 Pickup & Contact Info */}
          <div className="md:col-span-2 mt-2 border-t border-amber-200 pt-4">
            <h3 className="text-lg font-semibold text-amber-700 mb-3">
              Pickup & Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Address Line 1"
                value={form.address_line1}
                onChange={(e) =>
                  setForm({ ...form, address_line1: e.target.value })
                }
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <input
                type="text"
                placeholder="Address Line 2 (optional)"
                value={form.address_line2}
                onChange={(e) =>
                  setForm({ ...form, address_line2: e.target.value })
                }
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <input
                type="text"
                placeholder="Contact Name"
                value={form.contact_name}
                onChange={(e) =>
                  setForm({ ...form, contact_name: e.target.value })
                }
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <input
                type="text"
                placeholder="Contact Phone"
                value={form.contact_phone}
                onChange={(e) =>
                  setForm({ ...form, contact_phone: e.target.value })
                }
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <input
                type="email"
                placeholder="Contact Email"
                value={form.contact_email}
                onChange={(e) =>
                  setForm({ ...form, contact_email: e.target.value })
                }
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm"
              />
              <textarea
                placeholder="Pickup Instructions (e.g., access code, directions)"
                value={form.pickup_instructions}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pickup_instructions: e.target.value,
                  })
                }
                className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 shadow-sm md:col-span-2 min-h-[100px]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="col-span-1 md:col-span-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-2xl hover:from-amber-600 hover:to-yellow-700 transition-all duration-300 mt-4"
          >
            Add Listing
          </button>
        </form>

        {/* 🏠 Listings Section */}
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
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="block bg-white rounded-xl border border-amber-200 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 p-6"
              >
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-amber-700 mb-2 capitalize">
                    {listing.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    📍{" "}
                    {listing.city
                      ? `${listing.city}, ${listing.state}`
                      : "—"}
                  </p>
                  <p className="text-lg text-green-600 font-semibold">
                    ${listing.basePrice}
                  </p>
                </div>

                {/* ✅ Buttons */}
                {listing.demo_mode ? (
                  <button
                    disabled
                    className="mt-5 w-full py-2.5 bg-gray-400 text-white font-medium rounded-lg shadow-md cursor-not-allowed"
                  >
                    Demo Listing
                  </button>
                ) : (
                  <div className="mt-5">
                    <span className="block text-sm text-gray-500 italic text-center">
                      Click to view or book
                    </span>
                    <div className="mt-2 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg shadow-md py-2.5 text-center">
                      Book Now
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
