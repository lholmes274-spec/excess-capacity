// @ts-nocheck
"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
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

  // 🔥 NEW — Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  // ✅ NEW — SHIPPING
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");

  // quantity for rentals only
  const [days, setDays] = useState<number>(1);

  // ➕ START — booking requirements
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // fallback if listing has no slots
  const defaultSlots = [
    "09:00","10:00","11:00","12:00",
    "13:00","14:00","15:00","16:00",
    "17:00","18:00","19:00"
  ];

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
        .select("start_date, end_date, time_slot")
        .eq("listing_id", id)
        .in("status", ["paid", "completed", "confirmed"]);

      if (error || !data) return;

      const ranges = data.map((booking) => ({
        from: new Date(booking.start_date + "T00:00:00"),
        to: new Date(booking.end_date + "T00:00:00"),
        time_slot: booking.time_slot
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

  const PLATFORM_FEE = 5;
  const subtotal =
    !isForSale && listing.baseprice && days
      ? Number(listing.baseprice) * Number(days)
      : Number(listing.baseprice || 0);

  const totalPrice = subtotal + PLATFORM_FEE;

  // 🚫 Prevent booking if price invalid
  const invalidPrice =  
    !listing.baseprice || Number(listing.baseprice) <= 0;

    const handleCheckout = async () => {
    
    // Allow guest users — no redirect

      console.log("🔥 HANDLE CHECKOUT STARTED 🔥");

      // ✅ REQUIRE SHIPPING FOR SALES (ADD HERE)
      if (isForSale) {
        if (!shippingAddress || !shippingCity || !shippingState || !shippingZip) {
          alert("Please fill out all shipping information.");
          return;
        }
       }

    // ➕ START — enforce required booking dates
    const isService = listing.pricing_type === "per_service";

    // ✅ NEW — require time selection for time slot listings
    if (listing.booking_mode === "time_slots") {
      if (!selectedTime) {
        alert("Please select a time for your booking.");
        return;
      }
    }

    if (!isForSale && !isService) {
      if (!startDate || !endDate) {
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

   // ✅ NEW — prevent double booking SAME TIME SLOT
   if (listing.booking_mode === "time_slots") {
    const { data: sameTimeBookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("start_date", startDate)
      .eq("time_slot", selectedTime)
      .in("status", ["paid", "completed", "confirmed"]);

    if (sameTimeBookings && sameTimeBookings.length > 0) {
      alert("This time slot is already booked. Please select another time.")
      return;
    }
   }

   // ✅ REQUIRE GUEST INFO BEFORE CHECKOUT
   if (!userId) {
    if (!guestName || !guestEmail) {
      alert("Please enter your name and email.");
      return;
    }
   }

   if (listing.demo_mode) {
     alert("Example Only – Checkout disabled");
     return;
   } 

   let url = "";

   if (isForSale) {
    url = `/checkout?listing_id=${listing.id}&transaction_type=sale&guest=true&guest_email=${guestEmail}`;
   } else if (isService) {
    url = `/checkout?listing_id=${listing.id}&transaction_type=booking&days=1&guest_email=${guestEmail}`;
   } else {
    url = `/checkout?listing_id=${listing.id}&transaction_type=booking&start_date=${startDate}&end_date=${endDate}&time_slot=${selectedTime}&days=${Number(days || 1)}&guest_email=${guestEmail}`;
   }

   console.log("🚀 REDIRECT URL:", url);
   router.push(url);
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
                className={`w-20 h-20 object-cover bg-white rounded-lg border cursor-pointer transition ${
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
      <p className="text-gray-700 mb-4 break-words whitespace-pre-wrap">
        {listing.description}
      </p>

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

        <div className="w-full overflow-hidden">
          <div className="w-full">
            <div className="scale-[0.95] sm:scale-100 origin-top">
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
        </div>
      </div>
    </div>

    {/* TIME SLOTS */}
    {listing.booking_mode === "time_slots" && (
      <div>
        <label className="block font-semibold text-gray-800 mb-2">
          Select Time *
        </label>

        <div className="grid grid-cols-3 gap-2">
          {(listing.time_slots && listing.time_slots.length > 0
            ? listing.time_slots
            : [
                "09:00","10:00","11:00","12:00",
                "13:00","14:00","15:00","16:00",
                "17:00","18:00","19:00"
              ]
          ).map((time) => {

           const isBooked = bookedRanges.some((booking) => {
             return (
               booking.start_date === startDate &&
               booking.time_slot === time
             );
           });

           return (
             <button
               key={time}
               type="button"
               disabled={isBooked}
               onClick={() => !isBooked && setSelectedTime(time)}
               className={`border rounded-lg py-2 text-sm font-medium ${
                 isBooked
                   ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                   : selectedTime === time
                   ? "bg-orange-600 text-white"
                   : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isBooked ? `${time} (Unavailable)` : time}
              </button>
          );
         })}
        </div>
      </div>
    )}
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

            <div className="mt-4 space-y-1 text-gray-900">
              <p className="text-sm">
                Subtotal: {formatCurrency(Number(subtotal), listing.currency)}
              </p>
              <p className="text-sm">
                Service fee: {formatCurrency(PLATFORM_FEE, listing.currency)}
              </p>
              <p className="text-lg font-semibold">
                Total: {formatCurrency(Number(totalPrice), listing.currency)}
              </p>
            </div>
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
            placeholder="Your Name"
            className="w-full border p-2 rounded"
            onChange={(e) => setGuestName(e.target.value)}
          />
          <input
            placeholder="Email"
            className="w-full border p-2 rounded"
            onChange={(e) => setGuestEmail(e.target.value)}
          />
          <input
            placeholder="Phone (optional)"
            className="w-full border p-2 rounded"
            onChange={(e) => setGuestPhone(e.target.value)}
          />
        </div>
      )}

          {/* ✅ NEW — SHIPPING (ONLY FOR SALES) */}
          {isForSale && (
            <div className="space-y-3 pt-4">
              <h3 className="font-semibold text-gray-800">
                Shipping Information
              </h3>

             <input
               placeholder="Address"
               className="w-full border p-2 rounded"
               onChange={(e) => setShippingAddress(e.target.value)}
             />

             <input
               placeholder="City"
               className="w-full border p-2 rounded"
               onChange={(e) => setShippingCity(e.target.value)}
             />

             <input
               placeholder="State"
               className="w-full border p-2 rounded"
               onChange={(e) => setShippingState(e.target.value)}
             />

             <input
               placeholder="Zip Code"
               className="w-full border p-2 rounded"
               onChange={(e) => setShippingZip(e.target.value)}
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
           buttonText = "Book Service";
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
              ? "Photo Required Before Booking"
              : listing.demo_mode
              ? "Example Listing – Checkout Disabled"
              : invalidPrice
              ? "Price Not Set – Booking Disabled"
              : buttonText}
          </button>
         );
      })()}
    </div>
  );
}
