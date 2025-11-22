// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
    };
    loadUser();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Top Banner */}
      <div className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 text-black py-3 text-center font-semibold">
        Prosperity Hub™ — Dynamic Excess Capacity Sharing Platform
      </div>

      {/* Dashboard Container */}
      <div className="flex justify-center px-4 mt-10">
        <div className="w-full max-w-2xl">

          <h1 className="text-2xl font-bold mb-6">
            Welcome{user ? `, ${user.email}` : ""} 👋
          </h1>

          {/* Dashboard Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* FIXED: Correct Add Listing Link */}
            <Link href="/add-listing">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">Add Listing</h3>
              </div>
            </Link>

            <Link href="/my-listings">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">My Listings</h3>
              </div>
            </Link>

            <Link href="/my-bookings">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">My Bookings</h3>
              </div>
            </Link>

            {/* FIXED: Browse Listings → /listings */}
            <Link href="/listings">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">Browse Listings</h3>
              </div>
            </Link>

          </div>

          <div className="mt-10 text-center">
            <Link
              href="/demo"
              className="text-blue-600 font-medium hover:underline"
            >
              View Demo Listings
            </Link>
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
