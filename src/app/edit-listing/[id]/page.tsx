// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [listingStatus, setListingStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    baseprice: "",
    type: "",
    location: "",
    state: "",
    city: "",
    zip: "",
    address_line1: "",
    address_line2: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    pickup_instructions: "",
    private_instructions: "",
    demo_mode: false,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 🔔 Warn user about unsaved changes (refresh / close tab)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // 🔔 Warn user about unsaved changes on internal navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor || !anchor.href) return;

      const currentOrigin = window.location.origin;
      if (!anchor.href.startsWith(currentOrigin)) return;

      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave this page?"
      );

      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [hasUnsavedChanges]);

  // Load listing
  useEffect(() => {
    async function loadListing() {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        alert("Listing not found.");
        router.push("/");
        return;
      }

      setForm({
        title: data.title,
        description: data.description,
        baseprice: data.baseprice,
        type: data.type,
        location: data.location,
        state: data.state,
        city: data.city,
        zip: data.zip,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        pickup_instructions: data.pickup_instructions,
        private_instructions: data.private_instructions,
        demo_mode: data.demo_mode,
      });

      setListingStatus(data.listing_status || "active");
      setExistingImages(data.image_urls || []);
      setLoading(false);
    }

    loadListing();
  }, [id, router]);

  const handleChange = (e) => {
    setHasUnsavedChanges(true);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setNewImages(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
    setHasUnsavedChanges(true);
  };

  const handleRemoveImage = (url) => {
    setExistingImages(existingImages.filter((img) => img !== url));
    setHasUnsavedChanges(true);
  };

  // ✅ STAGE 3 — PAUSE / RESUME LOGIC
  const handleToggleStatus = async () => {
    const nextStatus =
      listingStatus === "active" ? "paused" : "active";

    const confirmed = window.confirm(
      nextStatus === "paused"
        ? "Pause this listing? It will not be bookable."
        : "Resume this listing so it can be booked again?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("listings")
      .update({ listing_status: nextStatus })
      .eq("id", id);

    if (error) {
      alert("Failed to update listing status.");
      return;
    }

    setListingStatus(nextStatus);
  };

  // 🔒 ACTUAL SAVE LOGIC
  const performSave = async () => {
    setSaving(true);

    let newUploadedUrls = [];

    for (const image of newImages) {
      const ext = image.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `listing-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, image);

      if (uploadError) {
        alert("Image upload failed.");
        console.error(uploadError);
        setSaving(false);
        return;
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      if (data?.publicUrl) newUploadedUrls.push(data.publicUrl);
    }

    const finalImages = [...existingImages, ...newUploadedUrls];
    const primaryImage = finalImages[0] || null;

    const { error } = await supabase
      .from("listings")
      .update({
        ...form,
        baseprice: Number(form.baseprice),
        image_url: primaryImage,
        image_urls: finalImages,
      })
      .eq("id", id);

    if (error) {
      alert("Error saving changes.");
      console.error(error);
      setSaving(false);
      return;
    }

    setHasUnsavedChanges(false);
    setSaving(false);
    setShowSuccessModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  if (loading) return <p className="text-center mt-10">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 relative">

      {/* CONFIRM SAVE MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              Confirm Changes
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save these changes?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-400"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  performSave();
                }}
                className="flex-1 bg-orange-600 text-white py-2 rounded-lg font-semibold hover:bg-orange-700"
              >
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-center">
            <h2 className="text-xl font-bold mb-2 text-green-700">
              Listing Updated
            </h2>
            <p className="text-gray-600 mb-6">
              Your changes were saved successfully.
            </p>

            <button
              type="button"
              onClick={() => router.push("/my-listings")}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-center text-orange-800">
        Edit Listing
      </h1>

      {/* ✅ STAGE 4 — STATUS + PAUSE / RESUME */}
      <div className="mb-6 flex items-center justify-between">
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            listingStatus === "active"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          Status: {listingStatus}
        </span>

        <button
          type="button"
          onClick={handleToggleStatus}
          className={`px-4 py-2 rounded-lg font-semibold ${
            listingStatus === "active"
              ? "bg-yellow-600 text-white hover:bg-yellow-700"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {listingStatus === "active" ? "Pause Listing" : "Resume Listing"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* TYPE */}
        <div>
          <label className="font-semibold block mb-1">Listing Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-white"
          >
            <option value="">Select Type</option>

            <optgroup label="Services">
              <option value="service">Service</option>
              <option value="consultant">Consultant</option>
            </optgroup>

            <optgroup label="Rentals & Items">
              <option value="tool">Tool</option>
              <option value="vehicle">Vehicle</option>
              <option value="recreation">Recreation</option>
              <option value="home">Home</option>
              <option value="furniture">Furniture</option>
              <option value="appliances">Appliances</option>
              <option value="electronics">Electronics</option>
            </optgroup>

            <optgroup label="Spaces">
              <option value="space">Space</option>
            </optgroup>

            <optgroup label="Other">
              <option value="other">Other</option>
            </optgroup>
          </select>
        </div>

        {/* TITLE */}
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Title"
        />

        {/* DESCRIPTION */}
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border rounded-lg"
          placeholder="Description"
        />

        {/* PRICE */}
        <input
          name="baseprice"
          value={form.baseprice}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Price"
        />

        {/* CONTACT */}
        <input
          name="contact_name"
          value={form.contact_name}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Contact Name"
        />

        <input
          name="contact_phone"
          value={form.contact_phone}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Contact Phone"
        />

        <input
          name="contact_email"
          value={form.contact_email}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Contact Email"
        />

        {/* ADDRESS */}
        <input
          name="address_line1"
          value={form.address_line1}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Address Line 1"
        />

        <input
          name="address_line2"
          value={form.address_line2}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Address Line 2"
        />

        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="City"
        />

        <input
          name="state"
          value={form.state}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="State"
        />

        <input
          name="zip"
          value={form.zip}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
          placeholder="Zip Code"
        />

        {/* INSTRUCTIONS */}
        <textarea
          name="pickup_instructions"
          value={form.pickup_instructions}
          onChange={handleChange}
          rows={2}
          className="w-full p-3 border rounded-lg"
          placeholder="Pickup Instructions"
        />

        <textarea
          name="private_instructions"
          value={form.private_instructions}
          onChange={handleChange}
          rows={2}
          className="w-full p-3 border rounded-lg"
          placeholder="Private Instructions"
        />

        {/* EXISTING IMAGES */}
        <div>
          <label className="font-semibold block mb-2">Existing Images</label>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, i) => (
              <div key={i} className="relative">
                <img
                  src={url}
                  className="w-full h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-2 py-1 text-xs"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* UPLOAD NEW IMAGES */}
        <div>
          <label className="font-semibold block mb-1">Upload New Images</label>
          <input
            type="file"
            multiple
            onChange={handleImageSelect}
            className="w-full p-2 border rounded-lg bg-white"
          />
        </div>

        {/* PREVIEW NEW IMAGES */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {previewUrls.map((src, i) => (
              <img
                key={i}
                src={src}
                className="w-full h-24 object-cover rounded border"
              />
            ))}
          </div>
        )}

        {/* SAVE */}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-600 text-white p-3 rounded-lg font-semibold hover:bg-orange-700 transition"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        <p className="text-sm text-gray-500 text-center">
          You’ll be asked to confirm before saving.
        </p>
      </form>
    </div>
  );
}
