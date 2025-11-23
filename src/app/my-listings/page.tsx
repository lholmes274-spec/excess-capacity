// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function MyListingsPage() {
  const [listings, setListings] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        setListings([]);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
      } else {
        setListings(data || []);
      }

      setLoading(false);
    }

    load();
  }, []);

  // ⭐ OPEN Delete Modal
  function openDeleteModal(listing) {
    setDeleteTarget(listing);
  }

  // ❌ CLOSE Delete Modal
  function closeDeleteModal() {
    setDeleteTarget(null);
  }

  // ⭐ DELETE LISTING
  async function deleteListing(listingId) {
    setDeleting(true);

    const res = await fetch("/api/delete-listing", {
      method: "POST",
      body: JSON.stringify({ listing_id: listingId }),
    });

    setDeleting(false);

    if (!res.ok) {
      alert("Failed to delete listing.");
      return;
    }

    // Remove instantly from UI
    setListings((prev) => prev.filter((l) => l.id !== listingId));

    closeDeleteModal();
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading your listings...</p>
      </div>
    );

  if (!userId)
    return (
      <div className="text-center py-20">
        <p className="text-lg text-red-600 font-semibold">
          Please log in to view your listings.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Go to Login
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">My Listings</h1>

      {listings.length === 0 ? (
        <p className="text-gray-600 text-center">
          You haven't created any listings yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => {
            const thumbnail =
              listing.image_urls?.[0] || listing.image_url || null;

            return (
              <div
                key={listing.id}
                className="bg-white border rounded-lg shadow-sm p-4"
              >
                {thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={listing.title}
                    className="w-full h-44 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-44 bg-gray-200 rounded-lg mb-3 flex items-center justify-center text-gray-500 text-sm">
                    No Image
                  </div>
                )}

                <h2 className="text-lg font-semibold mb-1">{listing.title}</h2>

                <p className="text-gray-600 text-sm mb-1">
                  ${listing.baseprice}
                </p>

                {listing.city && listing.state && (
                  <p className="text-sm text-gray-500 mb-3">
                    {listing.city}, {listing.state}
                  </p>
                )}

                {/* Button Row */}
                <div className="flex justify-between mt-2">
                  <Link
                    href={`/listings/${listing.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </Link>

                  <Link
                    href={`/edit-listing/${listing.id}`}
                    className="text-green-600 hover:underline text-sm"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => openDeleteModal(listing)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center">
            <h2 className="font-semibold text-lg mb-4 text-red-700">
              Delete Listing?
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete:
              <br />
              <span className="font-semibold">{deleteTarget.title}</span>?
            </p>

            <div className="flex justify-between">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                onClick={() => deleteListing(deleteTarget.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
