"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type PaymentRow = {
  id: number;
  stripe_session_id: string;
  listing_id: string;
  amount: number;
  currency: string;
  payment_intent_id: string | null;
  customer_email: string | null;
  status: string;
  created_at: string;
};

type ListingRow = {
  id: string;
  title: string;
  owner: string;
  type: string;
  location: string | null;
  units: number | null;
  base_price: number | null;
  created_at: string;
};

export default function AdminPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const [{ data: pData, error: pErr }, { data: lData, error: lErr }] =
        await Promise.all([
          supabase
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("listings")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      if (pErr) throw new Error(pErr.message);
      if (lErr) throw new Error(lErr.message);

      setPayments((pData || []) as PaymentRow[]);
      setListings(
        (lData || []).map((row: any) => ({
          ...row,
          base_price: Number(row.base_price ?? 0),
          units: Number(row.units ?? 0),
        })) as ListingRow[]
      );
    } catch (e: any) {
      console.error("Admin load error:", e?.message || e);
      setErr(e?.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function fmtMoney(amount: number, currency = "usd") {
    const code = (currency || "usd").toUpperCase();
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        minimumFractionDigits: 2,
      }).format(Number(amount || 0));
    } catch {
      return `$${Number(amount || 0).toFixed(2)} ${code}`;
    }
  }

  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={loadAll}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {err && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Payments */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Recent Payments</h2>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto border rounded-xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Listing ID</th>
                    <th className="px-3 py-2 text-left">Session</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{fmtDate(p.created_at)}</td>
                      <td className="px-3 py-2">{fmtMoney(p.amount, p.currency)}</td>
                      <td className="px-3 py-2">{p.customer_email || "—"}</td>
                      <td className="px-3 py-2">{p.status}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.listing_id}</td>
                      <td className="px-3 py-2 font-mono text-xs">{p.stripe_session_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Listings */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Listings & Inventory</h2>
          {listings.length === 0 ? (
            <p className="text-sm text-gray-500">No listings found.</p>
          ) : (
            <div className="overflow-x-auto border rounded-xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Owner</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Location</th>
                    <th className="px-3 py-2 text-left">Price</th>
                    <th className="px-3 py-2 text-left">Units</th>
                    <th className="px-3 py-2 text-left">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((l) => (
                    <tr key={l.id} className="border-t">
                      <td className="px-3 py-2">{fmtDate(l.created_at)}</td>
                      <td className="px-3 py-2">{l.title}</td>
                      <td className="px-3 py-2">{l.owner}</td>
                      <td className="px-3 py-2">{l.type}</td>
                      <td className="px-3 py-2">{l.location || "—"}</td>
                      <td className="px-3 py-2">
                        {Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(l.base_price ?? 0))}
                      </td>
                      <td className="px-3 py-2">{Number(l.units ?? 0)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{l.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
