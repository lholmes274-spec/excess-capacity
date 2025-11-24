// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);

      // Load subscription status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_subscribed, membership_tier")
        .eq("id", data.user.id)
        .single();

      setProfile(profileData);
    };

    loadUser();
  }, [router]);

  const isSubscribed = profile?.is_subscribed === true;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Banner */}
      <div className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 text-black py-3 text-center font-semibold">
        Prosperity Hub™ — Dynamic Excess Capacity Sharing Platform
      </div>

      {/* Dashboard */}
      <div className="flex justify-center px-4 mt-10">
        <div className="w-full max-w-2xl">

          {/* Welcome text with Pro badge */}
          <h1 className="text-2xl font-bold mb-6">
            Welcome, {user?.email} {isSubscribed && "💎"}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 place-items-center">

            <Link href="/add-listing" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">Add Listing</h3>
              </div>
            </Link>

            <Link href="/my-listings" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">My Listings</h3>
              </div>
            </Link>

            <Link href="/my-bookings" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">My Bookings</h3>
              </div>
            </Link>

            <Link href="/listings" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">Browse Listings</h3>
              </div>
            </Link>

            {/* ⭐ IF USER IS PRO — Show non-clickable “Active” box */}
            {isSubscribed && (
              <div className="col-span-1 sm:col-span-2 w-full max-w-md">
                <div className="p-6 bg-white border-2 border-green-500 rounded-xl shadow text-center">
                  <h3 className="text-lg font-semibold text-green-700">
                    💎 Pro Membership — Active
                  </h3>
                  <p className="text-sm mt-1 text-gray-600">
                    You have unlimited access.
                  </p>
                </div>
              </div>
            )}

            {/* ⭐ IF NOT PRO — Show clickable upgrade button */}
            {!isSubscribed && (
              <div className="col-span-1 sm:col-span-2 w-full max-w-md">
                <Link href="/subscribe">
                  <div className="p-6 bg-white border-2 border-yellow-500 rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                    <h3 className="text-lg font-semibold text-yellow-700">
                      ⭐ Pro Membership
                    </h3>
                    <p className="text-sm mt-1 text-gray-600">
                      Unlock premium features
                    </p>
                  </div>
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-10 text-center text-gray-600 text-sm border-t bg-white">
        <div className="flex justify-center space-x-6 mb-3">
          <Link href="/about" className="hover:text-black">About</Link>
          <Link href="/services" className="hover:text-black">Services</Link>
          <Link href="/contact" className="hover:text-black">Contact</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
        </div>
        <div>© {new Date().getFullYear()} Prosperity Voyage LLC</div>
      </footer>

    </div>
  );
}
