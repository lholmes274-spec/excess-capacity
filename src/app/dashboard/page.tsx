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
  const [openingPortal, setOpeningPortal] = useState(false);

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
          stripe_payouts_enabled,
          stripe_requirements_currently_due
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
        alert("Unable to open Stripe.");
      }
    } catch (err) {
      console.error("Stripe connect error:", err);
      alert("Stripe connection failed.");
    } finally {
      setConnectingStripe(false);
    }
  };

  // ✅ NEW — open Stripe dashboard for verification / email confirmation
  const handleOpenStripeDashboard = async () => {
    try {
      setOpeningPortal(true);

      const res = await fetch("/api/stripe/login-link", {
        method: "POST",
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to open Stripe dashboard.");
      }
    } catch (err) {
      console.error("Stripe dashboard login error:", err);
      alert("Unable to open Stripe dashboard.");
    } finally {
      setOpeningPortal(false);
    }
  };

  // Manage subscription via Stripe portal
  const handleManageSubscription = async () => {
    try {
      setOpeningPortal(true);

      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to open subscription portal.");
      }
    } catch (err) {
      console.error("Customer portal error:", err);
      alert("Unable to open subscription portal.");
    } finally {
      setOpeningPortal(false);
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

  const stripeRequirements: string[] =
    profile?.stripe_requirements_currently_due || [];

  const stripeRequirementLabels: Record<string, string> = {
    email: "Confirm your email address",
    external_account: "Add a bank account",
    "individual.verification.document": "Verify your identity",
    "company.verification.document": "Verify your business documents",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="w-full bg-gradient-to-r from-yellow-300 to-yellow-500 text-black py-3 text-center font-semibold">
        Prosperity Hub™ — Dynamic Excess Capacity Sharing Platform
      </div>

      {/* Dashboard */}
      <div className="flex justify-center px-4 mt-10">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold mb-2">
            Welcome, {user?.email} {isSubscribed && "💎"}
          </h1>

          {stripeReady && (
            <p className="text-sm text-green-700 mb-6">
              ✅ Stripe payouts are active
            </p>
          )}

          {/* Stripe Payout Status */}
          <div className="mb-6">
            {!profile?.stripe_account_id && (
              <div className="p-5 bg-white border-2 border-red-400 rounded-xl shadow">
                <h3 className="font-semibold text-red-700">
                  ❌ Stripe account not connected
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Connect Stripe to receive payouts.
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
                  ⚠️ Stripe verification required
                </h3>

                {stripeRequirements.length > 0 ? (
                  <>
                    <p className="text-sm text-gray-700 mt-2 font-medium">
                      Action needed:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700 mt-1">
                      {stripeRequirements.map((req: string) => (
                        <li key={req}>
                          {stripeRequirementLabels[req] || req}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 mt-2">
                    Stripe is reviewing your account. Additional verification
                    may be required.
                  </p>
                )}

                <button
                  onClick={handleOpenStripeDashboard}
                  disabled={openingPortal}
                  className="mt-4 px-4 py-2 bg-black text-white rounded hover:opacity-90 disabled:opacity-50"
                >
                  {openingPortal
                    ? "Opening Stripe dashboard..."
                    : "Go to Stripe to complete verification"}
                </button>
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

                  <button
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                    className="mt-4 px-4 py-2 border border-gray-400 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    {openingPortal
                      ? "Opening subscription manager..."
                      : "Manage subscription"}
                  </button>
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
