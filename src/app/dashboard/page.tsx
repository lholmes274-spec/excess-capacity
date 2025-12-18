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
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          `
          is_subscribed,
          membership_tier,
          stripe_account_id,
          stripe_account_status,
          stripe_charges_enabled,
          stripe_payouts_enabled
        `
        )
        .eq("id", data.user.id)
        .single();

      setProfile(profileData);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleConnectStripe = async () => {
    try {
      setConnectingStripe(true);

      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to start Stripe onboarding.");
      }
    } catch (err) {
      console.error("Stripe connect error:", err);
      alert("Stripe connection failed.");
    } finally {
      setConnectingStripe(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  const isSubscribed = profile?.is_subscribed === true;
  const stripeReady =
    profile?.stripe_charges_enabled && profile?.stripe_payouts_enabled;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 text-black py-3 text-center font-semibold">
        Prosperity Hub™ — Dynamic Excess Capacity Sharing Platform
      </div>

      {/* Dashboard */}
      <div className="flex justify-center px-4 mt-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">
            Welcome, {user?.email} {isSubscribed && "💎"}
          </h1>

          {/* Stripe Payout Status */}
          <div className="mb-6">
            {!profile?.stripe_account_id && (
              <div className="p-5 bg-white border-2 border-red-400 rounded-xl shadow">
                <h3 className="font-semibold text-red-700">
                  ❌ Payouts not set up
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Connect Stripe to receive payouts for your listings.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="mt-3 px-4 py-2 bg-black text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  {connectingStripe ? "Connecting..." : "Connect Stripe"}
                </button>
              </div>
            )}

            {profile?.stripe_account_id && !stripeReady && (
              <div className="p-5 bg-white border-2 border-yellow-400 rounded-xl shadow">
                <h3 className="font-semibold text-yellow-700">
                  ⚠️ Stripe setup incomplete
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Stripe needs more information before payouts can be enabled.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={connectingStripe}
                  className="mt-3 px-4 py-2 bg-black text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  {connectingStripe ? "Opening Stripe..." : "Finish Setup"}
                </button>
              </div>
            )}

            {stripeReady && (
              <div className="p-5 bg-white border-2 border-green-500 rounded-xl shadow">
                <h3 className="font-semibold text-green-700">
                  ✅ Payouts enabled
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  You will receive automatic payouts to your bank account.
                </p>
              </div>
            )}
          </div>

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

            <Link href="/provider/bookings" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center border border-green-200">
                <h3 className="text-lg font-semibold">
                  Bookings on My Listings
                </h3>
              </div>
            </Link>

            <Link href="/listings" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">Browse Listings</h3>
              </div>
            </Link>

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
    </div>
  );
}
