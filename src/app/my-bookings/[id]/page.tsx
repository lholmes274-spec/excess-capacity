// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function BookingDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;

      // Logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email || null);

      // Fetch booking with listing relation
      const { data, error } = await supabase
        .from("bookings")
        .select("*, listings(*)")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Booking not found:", error);
        setLoading(false);
        return;
      }

      // Security check — user must own this booking
      if (data.user_email !== user?.email && data.guest_email !== user?.email) {
        setBooking(null);
        setLoading(false);
        return;
      }

      setBooking(data);
      setListing(data.listings);
      setLoading(false);
    }

    load();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading booking details...</p>
      </div>
    );

  if (!booking)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-600 text-xl font-semibold mb-4">
          Booking not found or access denied.
        </p>
        <Link
          href="/my-bookings"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Back to My Bookings
        </Link>
      </div>
    );

  const thumbnail =
    listing?.image_urls?.[0] || listing?.image_url || "/no-image.png";

  return (
    <div className="container mx-auto px-6 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Booking Details</h1>

      {/* Listing Image */}
      <img
        src={thumbnail}
        className="w-full h-64 object-cover rounded-lg shadow mb-6"
      />

      {/* Listing Title */}
      <h2 className="text-2xl font-semibold mb-2 text-orange-700">
        {listing?.title}
      </h2>

      <p className="text-gray-600 mb-4">{listing?.description}</p>

      {/* Booking Information */}
      <div className="bg-white border border-gray-200 rounded-xl shadow p-6 space-y-4">
        <p>
          <strong>Status:</strong>{" "}
          <span className="capitalize">{booking.status}</span>
        </p>

        <p>
          <strong>Amount Paid:</strong> ${booking.amount_paid}
        </p>

        <p>
          <strong>Booking Date:</strong>{" "}
          {new Date(booking.booking_date).toLocaleDateString()}
        </p>

        <p>
          <strong>Stripe Session:</strong> {booking.stripe_session_id}
        </p>

        <hr />

        {/* Pickup Instructions */}
        {listing?.pickup_instructions && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-700 mb-2">
              Pickup Instructions
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {listing.pickup_instructions}
            </p>
          </div>
        )}

        {/* Private Instructions (only if logged in) */}
        {userEmail && listing?.private_instructions && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h3 className="font-semibold text-green-700 mb-2">
              Private Instructions
            </h3>
            <p className="text-gray-700 whitespace-pre-line">
              {listing.private_instructions}
            </p>
          </div>
        )}

        {/* Address */}
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Address</h3>
          <p className="text-gray-700">
            {listing.address_line1}
            <br />
            {listing.address_line2 && <>{listing.address_line2}<br /></>}
            {listing.city}, {listing.state} {listing.zip}
          </p>
        </div>

        {/* Contact Info */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-700 mb-2">Contact</h3>
          <p className="text-gray-700">
            <strong>Name:</strong> {listing.contact_name || "—"}
          </p>
          <p className="text-gray-700">
            <strong>Phone:</strong> {listing.contact_phone || "—"}
          </p>
          <p className="text-gray-700">
            <strong>Email:</strong> {listing.contact_email || "—"}
          </p>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link
          href="/my-bookings"
          className="px-6 py-3 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition"
        >
          Back to My Bookings
        </Link>
      </div>
    </div>
  );
}
