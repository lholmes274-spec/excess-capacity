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

  // quantity for rentals only
  const [days, setDays] = useState<number>(1);

  // ➕ START — booking requirements
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [estimatedTimeWindow, setEstimatedTimeWindow] = useState<string>("");

  // ➕ START — auto-calculate days from selected dates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Base date difference (used for nights or days)
      const diffTime = end.getTime() - start.getTime();
      const rawDays = Math.floor(
        diffTime / (1000 * 60 * 60 * 24)
      );

      const calculatedDays =
        listing?.pricing_type === "per_night"
          ? rawDays
          : rawDays + 1;

      if (calculatedDays > 0) {
        setDays(calculatedDays);
      }
    }
  }, [startDate, endDate, listing?.pricing_type]);

  // ✅ FIX — clear end date if it becomes earlier than start date
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        setEndDate("");
      }
    }
  }, [startDate]);

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

  // 🚫 Block public access to paused listings
  if (listing.listing_status === "paused" && !isOwner) {
    return (
      <div className="p-8 text-center text-gray-600">
        This listing is currently unavailable.
      </div>
    );
  }

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

  const isForSale = listing.transaction_type === "sale";
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPrice =
    !isForSale && listing.baseprice && days
      ? Number(listing.baseprice) * Number(days)
      : listing.baseprice;

  const handleCheckout = () => {
    if (!userId) {
      router.push(`/signup?redirect=/listings/${listing.id}`);
      return;
    }

    // ➕ START — enforce required booking dates
    if (!isForSale && (!startDate || !endDate)) {
      alert("Please select a start and end date for your booking.");
      return;
    }

    if (listing.demo_mode) {
      alert("Demo Only – Checkout disabled");
    } else {
      router.push(
        isForSale
          ? `/checkout?listing_id=${listing.id}&transaction_type=sale`
          : `/checkout?listing_id=${listing.id}` +
              `&transaction_type=booking` +
              `&start_date=${startDate}` +
              `&end_date=${endDate}` +
              `&time_window=${estimatedTimeWindow}` +
              `&days=${days}`
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
          <div className="w-full h-[500px] rounded-xl flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 shadow border">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mb-3 opacity-60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16l4-4a3 3 0 014 0l4 4m0 0l2-2a3 3 0 014 0l3 3M4 19h16"
              />
            </svg>

            <p className="text-lg font-semibold">
              Image Coming Soon
            </p>
            <p className="text-sm opacity-70">
              Submitted by Seller
            </p>
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
        <>
          <p className="text-2xl font-semibold text-green-700 mt-2">
            {formatCurrency(Number(listing.baseprice), listing.currency)}
            {!isForSale && (
            <span className="text-base font-normal text-gray-600">
              {" "}
              / {formattedPricing}
            </span>
            )}
          </p>

          {listing.pricing_type === "per_service" && (
            <p className="text-sm text-gray-600 mt-1">
              Service length: 2 hours
            </p>
          )}

          {/* SERVICE MINIMUM */}
          {listing.pricing_type === "per_hour" && (
            <p className="text-sm text-gray-600 mt-1">
              Minimum booking: 2 hours
            </p>
          )}
        </>
      )}

      {/* ➕ START — REQUIRED BOOKING DATES */}
      {!isForSale && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block font-semibold text-gray-800 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-800 mb-1">
              End Date *
            </label>
            <input
              type="date"
              min={startDate || new Date().toISOString().split("T")[0]}
              value={endDate}
              disabled={!startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-800 mb-1">
              Estimated Time Window (optional)
            </label>
            <select
              value={estimatedTimeWindow}
              onChange={(e) => setEstimatedTimeWindow(e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            >
              <option value="">Select</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
        </div>
      )}

      {/* RENTAL ONLY: QUANTITY + TOTAL */}
      {!isForSale &&
        (listing.pricing_type === "per_day" ||
          listing.pricing_type === "per_night" ||
          listing.pricing_type === "per_month") && (
          <>
            <div className="mt-4">
              <label className="block font-semibold text-gray-800 mb-1">
                {listing.pricing_type === "per_month"
                  ? "Number of months"
                  : listing.pricing_type === "per_night"
                  ? "Number of nights"
                  : "Number of days"}
              </label>
              <input
                type="number"
                value={days}
                readOnly
                className="w-32 border rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <p className="mt-3 text-lg font-semibold text-gray-900">
              Total: {formatCurrency(Number(totalPrice), listing.currency)}
            </p>
          </>
        )}

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

      {(() => {
         const isForSale = listing.transaction_type === "sale";
         const isService =
           !isForSale && listing.pricing_type === "per_service";

         let buttonText = "";
         let buttonColor = "";

         if (isForSale) {
          buttonText = "Purchase Now";
          buttonColor = "bg-green-600 hover:bg-green-700"
         } else if (isService) {
           buttonText = "Book Service";
           buttonColor = "bg-purple-600 hover:bg-purple-700";
         } else {
           buttonText = "Reserve Now";
           buttonColor = "bg-blue-600 hover:bg-blue-700";
         }

         return (
           <button
             className={`mt-6 w-full text-white py-3 rounded-lg font-semibold transition ${
               listing.demo_mode
                 ? "bg-gray-400 cursor-not-allowed"
                 : buttonColor
            }`}
            onClick={handleCheckout}
          >
            {listing.demo_mode
              ? "Demo Listing – Checkout Disabled"
              : buttonText}
          </button>
         );
      })()}
    </div>
  );
}
