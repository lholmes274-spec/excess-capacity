// @ts-nocheck
"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useLanguage } from "../../components/LanguageProvider";

export default function ListingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const isSpanishListing = listing?.title?.match(/[áéíóúñ]/i);

  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // 🔥 NEW — Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // quantity for rentals only
  const [days, setDays] = useState<number>(1);

  // ➕ START — booking requirements
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [estimatedTimeWindow, setEstimatedTimeWindow] = useState<string>("");

  // 🆕 NEW — booked date ranges
  const [bookedRanges, setBookedRanges] = useState<any[]>([]);

  // ➕ START — auto-calculate days from selected dates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const rawDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log("FINAL DAYS BEFORE CHECKOUT:", rawDays);
      console.log("START:", startDate, "END:", endDate);

      if (rawDays > 0) {
         setDays(rawDays);
      }
    }
  }, [startDate, endDate]);

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

  // 🆕 NEW — Load booked date ranges
  useEffect(() => {
    if (!id) return;

    async function loadBookedDates() {
      const { data, error } = await supabase
        .from("bookings")
        .select("start_date, end_date")
        .eq("listing_id", id)
        .in("status", ["paid", "completed", "confirmed"]);

      if (error || !data) return;

      const ranges = data.map((booking) => ({
        from: new Date(booking.start_date + "T00:00:00"),
        to: new Date(booking.end_date + "T00:00:00"),
      }));

      setBookedRanges(ranges);
    }

    loadBookedDates();
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

  // 🚫 Prevent booking if price invalid
  const invalidPrice =  
    !listing.baseprice || Number(listing.baseprice) <= 0;

    const handleCheckout = async () => {
    
    // Allow guest users — no redirect

      console.log("🔥 HANDLE CHECKOUT STARTED 🔥");

    // ➕ START — enforce required booking dates
    if (!isForSale) {
      if (!startDate || !endDate) {
      console.log("❌ STOPPED: missing dates");
      alert("Please select a start and end date for your booking.");
      return;
    }

    // 🔥 NEW — Check availability BEFORE redirecting
    const { data: overlappingBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", listing.id)
      .in("status", ["paid", "completed", "confirmed"])
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    if (overlappingBookings && overlappingBookings.length > 0) {
      console.log("❌ STOPPED: dates already booked");
      alert("These dates are already booked. Please select different dates.");
       return;
    }
   }

    // 🔥 NEW — Handle guest booking (NO Stripe)
    if (!userId) {
      console.log("🔥 USING API ROUTE 🔥");

      console.log("GUEST DATA:", guestName, guestEmail, guestPhone);

      if (!guestName || !guestEmail) {
       console.log("❌ STOPPED: missing guest info");
       alert("Please enter your name and email.");
      return;
    }

    console.log("🔥 ABOUT TO CALL API 🔥");

    const res = await fetch("/api/create-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: null,
        user_email: guestEmail, 
        booker_email: guestEmail, 
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        listing_id: listing.id,
        start_date: startDate,
        end_date: endDate,
        days: days,
        final_amount: totalPrice,
        status: "pending",
        owner_id: listing.owner_id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
       console.error("Booking failed:", data);
       alert(data.error || "Booking failed");
       return;
    }

   const newBooking = data;   

    // 🆕 AUTO-CREATE MESSAGE THREAD FOR BOOKING
    await supabase.from("inquiries").insert([
      {
        listing_id: listing.id,
        sender_id: null, // guest
        guest_email: guestEmail,
        receiver_id: listing.owner_id,
        message: `Booking request received. Respond above to proceed.`,
      },
    ]);

    // 🔔 Trigger email notification to provider
    await fetch("/api/booking-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiver_id: listing.owner_id,
        booking_id: newBooking.id, // 🔥 REQUIRED
        booking_status: "pending", // 🔥 REQUIRED
      }),
    });

    alert("Request sent! The provider will contact you through Prosperity Hub or using the contact details provided.");
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

      {invalidPrice && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded-lg text-sm text-yellow-800">
           ⚠️ This listing does not currently have a valid price set.
           The host must update pricing before bookings are enabled.
        </div>
      )}

      {/* ➕ START — REQUIRED BOOKING DATES */}
      {!isForSale && (
        <div className="mt-6 space-y-4">
          <label className="block font-semibold text-gray-800 mb-2">
            Select Booking Dates *
          </label>

          <DayPicker
            mode="range"
            selected={
              startDate && endDate
                ? {
                    from: new Date(startDate + "T00:00:00"),
                    to: new Date(endDate + "T00:00:00"),
                  }
                : undefined
          }
          onSelect={(range) => {
            if (!range?.from) return;

            const formatLocal = (date: Date) => {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              return `${y}-${m}-${d}`;
            };

            const from = formatLocal(range.from);
            const to = range.to ? formatLocal(range.to) : from;

            setStartDate(from);
            setEndDate(to);
          }}
          disabled={[
            { before: new Date() }, // disable past
            ...bookedRanges,        // disable booked
          ]}
          />

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

      {/* MESSAGE PROVIDER BUTTON */}
      {userId && !isOwner && (
        <button
          onClick={async () => {
            const message = prompt("Enter your message to the provider:");

            if (!message || message.trim() === "") return;

            // 🔥 GET USER EMAIL
            const {
              data: { user },
            } = await supabase.auth.getUser();

            const { error } = await supabase.from("inquiries").insert([
              {
                listing_id: listing.id,
                sender_id: userId,
                sender_email: user?.email,
                receiver_id: listing.owner_id,
                receiver_email: listing.contact_email,
                message: message.trim(),
              },
            ]);

            if (error) {
              console.error("MESSAGE INSERT ERROR:", error);
              alert(error.message || "Unable to send message.");
              return;
            }

            // 🔔 Trigger email notification
            await fetch("/api/message-notification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                receiver_id: listing.owner_id,
                receiver_email: listing.contact_email,
              }),
            });
          
            alert("Message sent successfully!");
          }}
          className="mt-4 w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          Message Provider
        </button>
      )}

      {/* CHECKOUT BUTTON */}

      {/* 🔥 NEW — Guest Info */}
      {!userId && (
        <div className="mt-6 space-y-3">
          <input
            placeholder={(isES || isSpanishListing) ? "Tu Nombre" : "Your Name"}
            className="w-full border p-2 rounded"
            onChange={(e) => setGuestName(e.target.value)}
          />
          <input
            placeholder={(isES || isSpanishListing) ? "Correo Electrónico" : "Email"}
            className="w-full border p-2 rounded"
            onChange={(e) => setGuestEmail(e.target.value)}
          />
          <input
            placeholder={(isES || isSpanishListing) ? "Teléfono (opcional)" : "Phone (optional)"}
            className="w-full border p-2 rounded"
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </div>
      )}

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
           buttonText = (isES || isSpanishListing)
              ? "Reservar Servicio"
              : "Book Service";
           buttonColor = "bg-purple-600 hover:bg-purple-700";
         } else {
           buttonText = "Reserve Now";
           buttonColor = "bg-blue-600 hover:bg-blue-700";
         }

         return (
           <button
             disabled={
               finalImages.length === 0 ||
               listing.demo_mode ||
               invalidPrice
            }
             className={`mt-6 w-full text-white py-3 rounded-lg font-semibold transition ${
               finalImages.length === 0 || listing.demo_mode || invalidPrice
                 ? "bg-gray-400 cursor-not-allowed"
                 : buttonColor
            }`}
            onClick={handleCheckout}
          >
            {finalImages.length === 0
              ? ((isES || isSpanishListing)
                ? "Se requiere foto antes de reservar"
                : "Photo Required Before Booking")
              : listing.demo_mode
              ? ((isES || isSpanishListing)
                ? "Demo – Reserva deshabilitada"
                 : "Demo Listing – Checkout Disabled")
              : invalidPrice
              ? ((isES || isSpanishListing)
                ? "Precio no establecido – Reserva deshabilitada"
                : "Price Not Set – Booking Disabled")
              : buttonText}
          </button>
         );
      })()}
    </div>
  );
}
