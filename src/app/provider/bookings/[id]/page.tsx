// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams } from "next/navigation";

export default function ProviderBookingPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

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