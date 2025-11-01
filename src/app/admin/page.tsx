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
  // 🔒 Access + mount states
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [code, setCode] = useState("");
  const [adminCode, setAdminCode] = useState<string>("");

  // ✅ Dashboard data states
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Listing>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState<string>("");

  // ✅ Auto logout timer (in ms)
  const LOGOUT_TIMEOUT = 60 * 60 * 1000; // 1 hour = 3600000 ms
  let logoutTimer: NodeJS.Timeout | null = null;

  // ✅ Handle mount + load code
  useEffect(() => {
    setMounted(true);

    // Try reading env variable (browser-safe)
    const envCode = process.env.NEXT_PUBLIC_ADMIN_CODE ?? "";
    console.log("🔐 Loaded admin code:", envCode);

    // Fallback if not injected (for production)
    const finalCode = envCode || "VoyageAccess2025!";
    setAdminCode(finalCode);

    // Restore session if valid
    const authFlag = localStorage.getItem("adminAuthorized");
    const lastLogin = localStorage.getItem("adminLastLogin");

    if (authFlag === "true" && lastLogin) {
      const elapsed = Date.now() - parseInt(lastLogin, 10);
      if (elapsed < LOGOUT_TIMEOUT) {
        setAuthorized(true);
      } else {
        // Expired
        localStorage.removeItem("adminAuthorized");
        localStorage.removeItem("adminLastLogin");
      }
    }
  }, []);

  // ✅ Set up auto logout countdown
  useEffect(() => {
    if (!authorized) return;

    const setTimer = () => {
      // Clear any existing timer
      if (logoutTimer) clearTimeout(logoutTimer);

      logoutTimer = setTimeout(() => {
        alert("Session expired — you’ve been logged out for security.");
        localStorage.removeItem("adminAuthorized");
        localStorage.removeItem("adminLastLogin");
        setAuthorized(false);
      }, LOGOUT_TIMEOUT);
    };

    // Start initial timer
    setTimer();

    // Reset timer on activity
    const resetTimer = () => {
      clearTimeout(logoutTimer!);
      setTimer();
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);

    return () => {
      clearTimeout(logoutTimer!);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [authorized]);

  // ✅ Fetch listings when authorized
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

  // 🚀 Wait until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-600">
        Loading Admin Panel...
      </div>
    );
  }

  // 🔒 Lock screen
  if (!authorized) {
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
  }

  // ✅ Admin dashboard (unchanged below)
  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmDelete) return;
    setDeleting(id);
    try {
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw error;
      setListings((prev) => prev.filter((l) => l.id !== id));
      alert("Listing deleted successfully!");
    } catch (err: any) {
      console.error("❌ Delete error:", err.message);
      alert("Failed to delete listing.");
    } finally {
      setDeleting(null);
    }
  };

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

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const numericPrice = parseFloat(priceInput.replace(/[^0-9.]/g, "")) || 0;
      const { error } = await supabase
        .from("listings")
        .update({
          title: editData.title,
          location: editData.location,
          basePrice: numericPrice,
          units: editData.units,
        })
        .eq("id", id);

      if (error) throw error;

      setListings((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, title: editData.title || l.title, location: editData.location || l.location, basePrice: numericPrice, units: editData.units ?? l.units }
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

  const handlePriceInputChange = (value: string) => {
    setPriceInput(value);
    const numeric = parseFloat(value.replace(/[^0-9.]/g, "")) || 0;
    handleChange("basePrice", numeric);
  };

  const handlePriceBlur = () => {
    const numericValue = parseFloat(priceInput.replace(/[^0-9.]/g, ""));
    if (isNaN(numericValue)) {
      setPriceInput("$0.00");
      handleChange("basePrice", 0);
    } else {
      setPriceInput(`$${numericValue.toFixed(2)}`);
      handleChange("basePrice", numericValue);
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
                          onChange={(e) => handlePriceInputChange(e.target.value)}
                          onBlur={handlePriceBlur}
                          placeholder="$0.00"
                          className="border rounded p-1 w-full text-right focus:ring-2 focus:ring-blue-400"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          value={editData.units ?? 1}
                          min={1}
                          step={1}
                          onChange={(e) => {
                            const val = Math.floor(Number(e.target.value));
                            if (isNaN(val) || val < 1) return;
                            handleChange("units", val);
                          }}
                          className="border rounded p-1 w-full text-right focus:ring-2 focus:ring-blue-400"
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
