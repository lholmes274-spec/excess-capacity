// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 🔹 NEW: number of days selector
  const [days, setDays] = useState<number>(1);

  // Load logged-in user
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      setUserId(sessionUser?.id || null);
    }
    loadUser();
  }, []);

  // Build final image list
  const buildImageList = (listing) => {
    let images = [];

    if (listing.image_url) images.push(listing.image_url);

    if (Array.isArray(listing.image_urls)) {
      images = [...images, ...listing.image_urls];
    }

    return images.filter(
      (url) =>
        typeof url === "string" &&
        url.startsWith("http") &&
        !url.includes("undefined") &&
        !url.includes("null")
    );
  };

  // Load listing
  useEffect(() => {
    if (!id) return;

    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setListing(data);

        const imgs = buildImageList(data);
        if (imgs.length > 0) setSelectedImage(imgs[0]);
      }

      setLoading(false);
    };

    fetchListing();
  }, [id]);

  // Not found
  if (!loading && !listing)
    return <div className="p-8 text-red-500">Listing not found.</div>;

  // Loading UI
  if (loading && !listing) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl mt-6 border border-gray-100">
        <div className="w-full h-80 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-6 bg-gray-200 rounded mt-6 w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded mt-4 animate-pulse" />
      </div>
    );
  }

  // Ownership check
  const isOwner = userId && userId === listing.owner_id;

  if (isOwner) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">
          You cannot book your own listing.
        </h2>

        <button
          onClick={() => router.push("/my-listings")}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Go to My Listings
        </button>
      </div>
    );
  }

  const finalImages = buildImageList(listing);

  const formattedPricing =
    listing.pricing_type ? listing.pricing_type.replace("_", " ") : "per unit";

  const totalPrice =
    listing.baseprice && days
      ? Number(listing.baseprice) * Number(days)
      : listing.baseprice;

  const handleCheckout = () => {
    if (!userId) {
      router.push(`/signup?redirect=/listings/${listing.id}`);
      return;
    }

    if (listing.demo_mode) {
      alert("Demo Only – Checkout disabled");
    } else {
      router.push(
        `/checkout?listing_id=${listing.id}&days=${days}`
      );
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-2xl mt-6 border border-gray-100">
      {/* MAIN IMAGE */}
      <div className="mb-6">
        {selectedImage ? (
          <img
            src={selectedImage}
            alt={listing.title}
            className="w-full max-h-[650px] object-cover rounded-xl shadow border"
          />
        ) : (
          <div className="w-full max-h-[650px] bg-gray-200 rounded-xl flex items-center justify-center text-gray-500">
            No Image Available
          </div>
        )}

        {/* GALLERY */}
        {finalImages.length > 1 && (
          <div className="flex gap-3 mt-3 overflow-x-auto">
            {finalImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 object-cover rounded-lg border cursor-pointer transition ${
                  selectedImage === img
                    ? "border-4 border-orange-600"
                    : "border-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* TITLE */}
      <h1 className="text-3xl font-bold text-orange-800 mb-2">
        {listing.title}
      </h1>

      {/* DESCRIPTION */}
      <p className="text-gray-700 mb-4">{listing.description}</p>

      {/* LOCATION */}
      {(listing.city || listing.location) && (
        <p className="text-gray-800 font-semibold mb-2">
          Location:{" "}
          <span className="text-gray-900">
            {listing.city
              ? `${listing.city}, ${listing.state}`
              : listing.location}
          </span>
        </p>
      )}

      {/* PRICE */}
      {listing.baseprice !== null && (
        <p className="text-2xl font-semibold text-green-700 mt-2">
          ${listing.baseprice}
          <span className="text-base font-normal text-gray-600">
            {" "}
            / {formattedPricing}
          </span>
        </p>
      )}

      {/* 🔹 NUMBER OF DAYS SELECTOR */}
      <div className="mt-4">
        <label className="block font-semibold text-gray-800 mb-1">
          Number of days
        </label>
        <input
          type="number"
          min={1}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-32 border rounded-lg px-3 py-2"
        />
      </div>

      {/* TOTAL */}
      <p className="mt-3 text-lg font-semibold text-gray-900">
        Total: ${totalPrice}
      </p>

      {/* PUBLIC INSTRUCTIONS */}
      {listing.pickup_instructions && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 mb-2">
            Pickup & Instructions
          </h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">
            {listing.pickup_instructions}
          </p>
        </div>
      )}

      {/* CHECKOUT BUTTON */}
      <button
        className={`mt-6 w-full text-white py-3 rounded-lg font-semibold transition ${
          listing.demo_mode
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
        onClick={handleCheckout}
      >
        {listing.demo_mode
          ? "Demo Listing – Checkout Disabled"
          : "Proceed to Checkout"}
      </button>
    </div>
  );
}
