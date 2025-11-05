"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  location?: string | null;
  basePrice?: number | null;
  units?: number | null;
  created_at?: string | null;
};

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState("");
  const [adminCode, setAdminCode] = useState<string>("");

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Listing>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");

  const LOGOUT_TIMEOUT = 60 * 60 * 1000; // 1 hour

  // ✅ Mount setup
  useEffect(() => {
    setMounted(true);
    const envCode = process.env.NEXT_PUBLIC_ADMIN_CODE ?? "";
    const finalCode = envCode || "VoyageAccess2025!";
    setAdminCode(finalCode);

    const authFlag = localStorage.getItem("adminAuthorized");
    const lastLogin = localStorage.getItem("adminLastLogin");

    if (authFlag === "true" && lastLogin) {
      const elapsed = Date.now() - parseInt(lastLogin, 10);
      if (elapsed < LOGOUT_TIMEOUT) {
        setAuthorized(true);
      } else {
        localStorage.removeItem("adminAuthorized");
        localStorage.removeItem("adminLastLogin");
      }
    }
  }, []);

  // ✅ Fetch listings
  useEffect(() => {
    if (!authorized) return;

    const fetchListings = async () => {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (err: any) {
        console.error("❌ Error loading listings:", err.message);
        setError("Failed to load listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [authorized]);

  // 🔒 Lock screen before auth
  if (!mounted)
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        Loading Admin Panel...
      </div>
    );

  if (!authorized)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">
          Admin Access Restricted
        </h1>
        <p className="text-gray-600 mb-6">
          Please enter your secure access code to continue.
        </p>
        <input
          type="password"
          placeholder="Enter access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border border-gray-300 p-2 rounded mb-4 w-64 text-center focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={() => {
            if (code === adminCode) {
              setAuthorized(true);
              localStorage.setItem("adminAuthorized", "true");
              localStorage.setItem("adminLastLogin", Date.now().toString());
            } else {
              alert("❌ Incorrect access code");
            }
          }}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Enter
        </button>
        <p className="mt-6 text-sm text-gray-400">
          © {new Date().getFullYear()} ProsperityHub Admin
        </p>
      </div>
    );

  // ✅ Edit setup
  const handleEdit = (listing: Listing) => {
    setEditingId(listing.id);
    const numericPrice = listing.basePrice ?? 0;
    setEditData({
      title: listing.title,
      location: listing.location || "",
      basePrice: numericPrice,
      units: listing.units ?? 1,
    });
    setPriceInput(`$${numericPrice.toFixed(2)}`);
  };

  const handleChange = (field: keyof Listing, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
    setPriceInput("");
  };

  // ✅ Save updates
  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const numericPrice = parseFloat(priceInput.replace(/[^0-9.]/g, "")) || 0;

      const updatePayload = {
        title: editData.title,
        location: editData.location,
        ["basePrice"]: numericPrice,
        units: editData.units ?? 1,
      };

      const { error } = await supabase
        .from("listings")
        .update(updatePayload)
        .eq("id", id);

      if (error) throw error;

      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? ({
                ...l,
                title: editData.title,
                location: editData.location,
                basePrice: numericPrice,
                units: editData.units ?? 1,
              } as Listing)
            : l
        )
      );

      alert("✅ Listing updated successfully!");
      handleCancel();
    } catch (err: any) {
      console.error("❌ Save error:", err.message);
      alert("Failed to update listing: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Delete listing (FIXED)
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);

      if (error) {
        console.error("❌ Delete failed:", error.message);
        alert("Failed to delete listing: " + error.message);
        return;
      }

      // 🔁 Double-check that deletion persisted
      const { data: verify } = await supabase
        .from("listings")
        .select("id")
        .eq("id", id);

      if (verify && verify.length > 0) {
        alert("⚠️ Deletion may not have persisted (check Supabase RLS rules).");
      } else {
        setListings((prev) => prev.filter((l) => l.id !== id));
        alert("✅ Listing deleted successfully!");
      }
    } catch (err: any) {
      console.error("❌ Delete error:", err.message);
      alert("Failed to delete listing: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500">Loading listings...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Admin Dashboard – Listings
      </h1>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            localStorage.removeItem("adminAuthorized");
            localStorage.removeItem("adminLastLogin");
            window.location.reload();
          }}
          className="text-sm text-gray-500 underline"
        >
          Log out
        </button>
      </div>

      {listings.length === 0 ? (
        <p className="text-center text-gray-500">No listings found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-lg border border-gray-200">
          <table className="min-w-full bg-white border-collapse">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Title</th>
                <th className="p-3 text-left font-semibold text-gray-700">Location</th>
                <th className="p-3 text-left font-semibold text-gray-700">Price</th>
                <th className="p-3 text-left font-semibold text-gray-700">Units</th>
                <th className="p-3 text-left font-semibold text-gray-700">Created</th>
                <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-t hover:bg-gray-50 transition-colors">
                  {editingId === l.id ? (
                    <>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editData.title || ""}
                          onChange={(e) => handleChange("title", e.target.value)}
                          className="border rounded p-1 w-full"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={editData.location || ""}
                          onChange={(e) => handleChange("location", e.target.value)}
                          className="border rounded p-1 w-full"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={priceInput}
                          onChange={(e) => setPriceInput(e.target.value)}
                          placeholder="$0.00"
                          className="border rounded p-1 w-full text-right"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={editData.units ?? 1}
                          min={1}
                          onChange={(e) =>
                            handleChange("units", Number(e.target.value))
                          }
                          className="border rounded p-1 w-full text-right"
                        />
                      </td>
                      <td className="p-2">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-2 flex gap-2">
                        <button
                          onClick={() => handleSave(l.id)}
                          disabled={saving}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{l.title}</td>
                      <td className="p-2">{l.location || "—"}</td>
                      <td className="p-2">${Number(l.basePrice ?? 0).toFixed(2)}</td>
                      <td className="p-2">{l.units ?? 1}</td>
                      <td className="p-2">
                        {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="p-2 flex gap-2">
                        <button
                          onClick={() => handleEdit(l)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          disabled={deleting === l.id}
                          className={`px-3 py-1 rounded text-white ${
                            deleting === l.id
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {deleting === l.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
