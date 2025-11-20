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

  // ⭐ NEW — selected image for gallery
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

        // ⭐ determine main image
        if (data.image_urls && data.image_urls.length > 0) {
          setSelectedImage(data.image_urls[0]);
        } else if (data.image_url) {
          setSelectedImage(data.image_url);
        }
      }

      setLoading(false);
    };

    fetchListing();
  }, [id]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!listing) return <div className="p-8 text-red-500">Listing not found.</div>;

  const handleCheckout = () => {
    if (listing.demo_mode) {
      alert("Demo Only – Checkout disabled");
    } else {
      router.push(`/checkout?listing_id=${listing.id}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-2xl mt-6 border border-gray-100">

      {/* ⭐⭐ NEW IMAGE GALLERY ⭐⭐ */}
      <div className="mb-6">

        {/* ⭐ MAIN IMAGE */}
        {selectedImage ? (
          <img
            src={selectedImage}
            className="w-full h-80 object-cover rounded-lg shadow border"
          />
        ) : (
          <div className="w-full h-80 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
            No Image Available
          </div>
        )}

        {/* ⭐ THUMBNAIL ROW */}
        {listing.image_urls && listing.image_urls.length > 1 && (
          <div className="flex gap-3 mt-3 overflow-x-auto">
            {listing.image_urls.map((img: string, index: number) => (
              <img
                key={index}
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

      {/* ⭐ TITLE */}
      <h1 className="text-3xl font-bold text-orange-800 mb-2">
        {listing.title}
      </h1>

      {/* ⭐ DESCRIPTION */}
      <p className="text-gray-700 mb-4">{listing.description}</p>

      {/* ⭐ LOCATION */}
      {listing.location && (
        <p className="text-gray-800 font-semibold mb-2">
          Location: <span className="text-gray-900">{listing.location}</span>
        </p>
      )}

      {/* ⭐ PRICE WITH LOGIC */}
      {listing.basePrice && (
        <p className="text-2xl font-semibold text-green-700 mt-2">
          ${listing.basePrice}
          <span className="text-base font-normal text-gray-600">
            {" "}
            {listing.type?.toLowerCase() === "service"
              ? "per hour"
              : listing.type?.toLowerCase() === "housing"
              ? "per night"
              : listing.type?.toLowerCase() === "storage"
              ? "per month"
              : listing.type?.toLowerCase() === "vehicle"
              ? "per day"
              : "per unit"}
          </span>
        </p>
      )}

      {/* ⭐ NOTES */}
      {(listing.notes || listing.note) && (
        <p className="mt-3 text-sm text-gray-600 italic">
          {listing.notes || listing.note}
        </p>
      )}

      {/* ⭐ PICKUP / INSTRUCTIONS */}
      {(listing.pickup_instru ||
        listing.pickup_instructions ||
        listing.instructions) && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800 mb-2">
            Pickup & Instructions
          </h3>
          <p className="text-gray-700 text-sm whitespace-pre-line">
            {listing.pickup_instru ||
              listing.pickup_instructions ||
              listing.instructions}
          </p>
        </div>
      )}

      {/* ⭐ CONTACT INFO */}
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

      {/* ⭐ CHECKOUT BUTTON */}
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
