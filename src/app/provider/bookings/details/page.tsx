// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProviderBookingDetailsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [booking, setBooking] = useState(null);

  useEffect(() => {
    async function load() {
      if (!id) return;

      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      setBooking(data);
    }

    load();
  }, [id]);

  if (!booking) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1>Booking Details</h1>
      <p>Status: {booking.status}</p>
      <p>Total: ${booking.final_amount}</p>
    </div>
  );
}