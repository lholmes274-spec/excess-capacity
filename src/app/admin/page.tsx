"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Listing = {
  id: string;
  title: string;
  location?: string | null;
  baseprice?: number | null;
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

  // Mount & Auth setup
  useEffect(() => {
    setMounted(true);
    const envCode = process.env.NEXT_PUBLIC_ADMIN_CODE ?? "";
    const finalCode = envCode || "VoyageAccess2025!";
    setAdminCode(finalCode);

    const flag = localStorage.getItem("adminAuthorized");
    const lastLogin = localStorage.getItem("adminLastLogin");

    if (flag === "true" && lastLogin) {
      const elapsed = Date.now() - parseInt(lastLogin, 10);
      if (elapsed < LOGOUT_TIMEOUT) {
        setAuthorized(true);
      } else {
        localStorage.removeItem("adminAuthorized");
        localStorage.removeItem("adminLastLogin");
      }
    }
  }, []);

  // Load listings once authorized
  useEffect(() => {
    if (!authorized) return;

    async function load() {
      try {
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setListings(data || []);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load listings");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [authorized]);

  if (!mounted)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading Admin Panel…
      </div>
    );

  // Admin Locked Screen
  if (!authorized)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-3xl font-bold mb-4">Admin Access Restricted</h1>
        <input
          type="password"
          placeholder="Enter access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="border border-gray-300 p-2 rounded mb-4 w-64 text-center"
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
        <p className="text-sm text-gray-400 mt-6">
          © {new Date().getFullYear()} ProsperityHub Admin
        </p>
      </div>
    );

  // Begin Edit Mode
  const handleEdit = (listing: Listing) => {
    setEditingId(listing.id);

    const numeric = listing.baseprice ?? 0;

    setEditData({
      title: listing.title,
      location: listing.location || "",
      baseprice: numeric,
    });

    setPriceInput(`$${numeric.toFixed(2)}`);
  };

  const handleChange = (field: keyof Listing, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
    setPriceInput("");
  };

  // SAVE LISTING FIXED
  const handleSave = async (id: string) => {
    setSaving(true);

    try {
      const numericPrice =
        parseFloat(priceInput.replace(/[^0-9.]/g, "")) || 0;

      const updatePayload = {
        title: editData.title,
        location: editData.location,
        baseprice: numericPrice,
      };

      const { error } = await supabase
        .from("listings")
        .update(updatePayload)
        .eq("id", id);

      if (error) throw error;

      // FIXED TYPE ERROR – cast result as Listing
      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? ({
                ...l,
                title: updatePayload.title ?? l.title,
                location: updatePayload.location ?? l.location,
                baseprice: numericPrice,
              } as Listing)
            : l
        )
      );

      alert("Listing updated!");
      handleCancel();
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE LISTING
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;

    setDeleting(id);
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;

      setListings((prev) => prev.filter((l) => l.id !== id));

      alert("Listing deleted!");
    } catch (err: any) {
      alert("Failed: " + err.message);
    } finally {
      setDeleting(null);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center">
        Loading listings…
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex justify-center items-center text-red-600">
        {error}
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">
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

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="min-w-full bg-white border-collapse">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3 text-left font-semibold">Title</th>
              <th className="p-3 text-left font-semibold">Location</th>
              <th className="p-3 text-left font-semibold">Price</th>
              <th className="p-3 text-left font-semibold">Created</th>
              <th className="p-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>

          <tbody>
            {listings.map((l) => (
              <tr
                key={l.id}
                className="border-t hover:bg-gray-50 transition-colors"
              >
                {editingId === l.id ? (
                  <>
                    <td className="p-2">
                      <input
                        type="text"
                        value={editData.title || ""}
                        onChange={(e) =>
                          handleChange("title", e.target.value)
                        }
                        className="border p-1 rounded w-full"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        value={editData.location || ""}
                        onChange={(e) =>
                          handleChange("location", e.target.value)
                        }
                        className="border p-1 rounded w-full"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        className="border p-1 rounded w-full text-right"
                      />
                    </td>

                    <td className="p-2">
                      {l.created_at
                        ? new Date(l.created_at).toLocaleString()
                        : "—"}
                    </td>

                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => handleSave(l.id)}
                        disabled={saving}
                        className="px-3 py-1 bg-green-600 text-white rounded"
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>

                      <button
                        onClick={handleCancel}
                        className="px-3 py-1 bg-gray-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{l.title}</td>
                    <td className="p-2">{l.location || "—"}</td>
                    <td className="p-2">
                      ${Number(l.baseprice ?? 0).toFixed(2)}
                    </td>
                    <td className="p-2">
                      {l.created_at
                        ? new Date(l.created_at).toLocaleString()
                        : "—"}
                    </td>

                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(l)}
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(l.id)}
                        disabled={deleting === l.id}
                        className={`px-3 py-1 rounded text-white ${
                          deleting === l.id
                            ? "bg-gray-400"
                            : "bg-red-600 hover:bg-red-700"
                        }`}
                      >
                        {deleting === l.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
