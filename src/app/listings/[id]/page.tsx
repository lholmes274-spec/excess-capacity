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

  // -------------------------------
  // LOAD LOGGED-IN USER (CLIENT SIDE)
  // -------------------------------
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data?.session?.user || null;
      setUserId(sessionUser?.id || null);
    }
    loadUser();
  }, []);

  // -------------------------------
  // Load Listing
  // -------------------------------
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

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!listing)
    return <div className="p-8 text-red-500">Listing not found.</div>;

  // -------------------------------
  // OWNERSHIP CHECK
  // -------------------------------
  const isOwner = userId && userId === listing.owner_id;

  // -------------------------------
  // OPTION B: BLOCK OWNER FROM SEEING THEIR OWN CHECKOUT PAGE
  // -------------------------------
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

  const handleCheckout = () => {
    if (listing.demo_mode) {
      alert("Demo Only – Checkout disabled");
    } else {
      router.push(`/checkout?listing_id=${listing.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-2xl mt-6 border border-gray-100">

      {/* MAIN IMAGE */}
      <div className="mb-6">
        {selectedImage ? (
          <img
            src={selectedImage}
            className="w-full h-80 object-cover rounded-lg shadow border"
            alt={listing.title}
          />
        ) : (
          <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
            No Image Available
          </div>
        )}

        {/* GALLERY Thumbnails */}
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
            per unit
          </span>
        </p>
      )}

      {/* PUBLIC PICKUP INSTRUCTIONS */}
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

      {/* CONTACT INFO */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">
          Contact Information
        </h3>
        <p>
          <strong>Contact:</strong> {listing.contact_name || "—"}
        </p>
        <p>
          <strong>Phone:</strong> {listing.contact_phone || "—"}
        </p>
        <p>
          <strong>Email:</strong> {listing.contact_email || "—"}
        </p>
      </div>

      {/* CHECKOUT BUTTON — ONLY FOR NON-OWNERS */}
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
