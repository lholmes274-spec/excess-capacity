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

  // ✅ Listing activation metric
  const [listingCount, setListingCount] = useState<number>(0);

  // 🔑 NEW — gate Stripe UI until sync completes
  const [stripeSynced, setStripeSynced] = useState(false);

  const [connectingStripe, setConnectingStripe] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const params = new URLSearchParams(window.location.search);
      const fromStripe = params.get("from") === "stripe";

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // 🔑 FIRST FETCH — may be stale
      const { data: initialProfile } = await supabase
        .from("profiles")
        .select(
          `
          is_subscribed,
          membership_tier,
          stripe_account_id,
          stripe_account_status,
          stripe_charges_enabled,
          stripe_payouts_enabled,
          stripe_requirements_currently_due,
          signup_country
        `
        )
        .eq("id", user.id)
        .single();

      if (!initialProfile?.signup_country) {
       try {
         fetch("/api/geo-reconcile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
          }),
         });
       } catch (err) {
         console.error("Geo reconcile failed:", err);
       }
      }

      // ⭐ ALWAYS reconcile Stripe → Supabase when Stripe is connected
      if (initialProfile?.stripe_account_id) {
        fetch("/api/stripe/sync-account", {
          method: "POST",
        }).catch(() => {});

        // Clean URL if returning from Stripe
        if (fromStripe) {
        window.history.replaceState({}, "", window.location.pathname); 
        }
      }

      // 🔑 SECOND FETCH — guaranteed fresh
      const { data: syncedProfile } = await supabase
        .from("profiles")
        .select(
          `
          is_subscribed,
          membership_tier,
          stripe_account_id,
          stripe_account_status,
          stripe_charges_enabled,
          stripe_payouts_enabled,
          stripe_requirements_currently_due,
          signup_country
        `
        )
        .eq("id", user.id)
        .single();

      setProfile(syncedProfile);

      // ✅ Fetch listing count
      const { count, error: countError } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })

      if (countError) {
       console.error("Listing count fetch error:", JSON.stringify(countError, null, 2));
      }

      setListingCount(count || 0);

      // 🔑 Stripe → Supabase reconciliation complete
      setStripeSynced(true);

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
         window.location.href = `${data.url}?from=stripe`;
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

  const handleOpenStripeDashboard = async () => {
    try {
      setOpeningPortal(true);

      const res = await fetch("/api/stripe/login-link", {
        method: "POST",
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = `${data.url}?from=stripe`;
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
  const stripeStatus = profile?.stripe_account_status;

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

          {/* 🚀 First Listing Activation */}
          {listingCount === 0 && (
            <div className="mt-6 p-6 rounded-2xl shadow-md border border-yellow-400 bg-yellow-50">
              <h3 className="text-lg font-semibold text-yellow-800">
                🚀 Complete Your First Listing (Takes 5 Minutes)
              </h3>

              <p className="text-sm text-gray-700 mt-2">
                Start earning by sharing your unused space, tools, equipment, or services.
              </p>

              <ul className="list-disc list-inside text-sm text-gray-700 mt-3 space-y-1">
                <li>Upload 1 photo</li>
                <li>Add a title</li>
                <li>Set a price</li>
              </ul>

              <p className="text-sm text-gray-600 mt-3">
                You can edit anytime.
              </p>

              <Link href="/add-listing">
                <div className="mt-4 w-full text-center px-4 py-3 rounded-lg font-semibold text-black bg-gradient-to-r from-yellow-300 to-yellow-500 hover:opacity-90 transition">
                  Create My First Listing
                </div>
              </Link>
             </div>
            )}

          {stripeSynced && profile?.stripe_charges_enabled && profile?.stripe_payouts_enabled && (
            <p className="text-sm text-green-700 mb-4">
              ✅ Stripe payments are active
            </p>
          )}

          {/* 🔑 ALWAYS AVAILABLE WHEN STRIPE IS CONNECTED */}
          {stripeSynced && profile?.stripe_account_id && (
            <div className="mb-6">
              <button
                onClick={handleOpenStripeDashboard}
                disabled={openingPortal}
                className="px-4 py-2 bg-black text-white rounded hover:opacity-90 disabled:opacity-50"
              >
                {openingPortal
                  ? "Opening Stripe dashboard..."
                  : "View Stripe dashboard"}
              </button>
            </div>
          )}

          {/* Stripe Payments & Verification Status */}
          <div className="mb-6">
            {!profile?.stripe_account_id && (
              <div className="p-5 bg-white border-2 border-red-400 rounded-xl shadow">
                <h3 className="font-semibold text-red-700">
                  ❌ Stripe account not connected
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Connect Stripe to receive payments.
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

            {stripeSynced && profile?.stripe_account_id && !(profile?.stripe_charges_enabled && profile?.stripe_payouts_enabled) && (

              <div className="p-5 bg-white border-2 border-yellow-400 rounded-xl shadow">
                <h3 className="font-semibold text-yellow-700">
                  {stripeRequirements.length > 0
                  ? "⚠️ Action Required"
                  : "⏳ Verification in Progress"}
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
                  <>
                    <p className="text-sm text-gray-700 mt-2">
                      Your Stripe account has been created and linked to Prosperity Hub.
                      Stripe is completing a standard background review.                                        
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Most accounts are approved instantly and can accept payments right away.
                      If additional review is required, verification typically takes
                      <strong> 1–5 business days</strong>.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      During this time, payments may be temporarily unavailable.
                      No action is required from you unless Stripe requests
                      additional information.
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      If additional information is required, it will appear in
                      your Stripe dashboard and Stripe will notify you directly.
                      No action is needed unless prompted.
                    </p>
                    <p className="text-xs text-gray-500 mt-4 italic">
                      Account status may briefly change while Stripe completes processing.
                      This page will automatically reflect the final status once finished.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 text-sm font-semibold text-gray-500 mt-2 text-center">
            Create / Manage
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

            <div className="sm:col-span-2 text-sm font-semibold text-gray-500 mt-4">
              I Paid
            </div>
                          
            <Link href="/my-bookings" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center">
                <h3 className="text-lg font-semibold">My Orders</h3>
              </div>
            </Link>

            <div className="sm:col-span-2 text-sm font-semibold text-gray-500 mt-4">
              I Earn
            </div>
            
            <Link href="/provider/bookings" className="w-full">
              <div className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition cursor-pointer text-center border border-green-200">
                <h3 className="text-lg font-semibold">
                  Orders on My Listings
                </h3>
              </div>
            </Link>

            <div className="sm:col-span-2 text-sm font-semibold text-gray-500 mt-4">
              Explore
            </div>

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
                    You can create unlimited listings.
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
                      Upgrade to create unlimited listings.
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
