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
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    baseprice: "",
    pricing_type: "",
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
    image_urls_before: [],
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Load listing from Supabase
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
        pricing_type: data.pricing_type || "",
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
        image_urls_before: data.image_urls || [],
      });

      setExistingImages(data.image_urls || []);
      setLoading(false);
    }

    loadListing();
  }, [id]);

  // Input change handler
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle new image selection
  const handleImageSelect = (e) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setNewImages(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  // Remove an existing image
  const handleRemoveImage = (url) => {
    setExistingImages(existingImages.filter((img) => img !== url));
  };

  // Save listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Upload NEW images
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

      const { data } = await supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      if (data?.publicUrl) newUploadedUrls.push(data.publicUrl);
    }

    // Remove deleted images from storage
    const removedImages = form.image_urls_before.filter(
      (old) => !existingImages.includes(old)
    );

    if (removedImages.length > 0) {
      for (const url of removedImages) {
        const path = url.split("listing-images/")[1];
        if (path) {
          await supabase.storage
            .from("listing-images")
            .remove([`listing-images/${path}`]);
        }
      }
    }

    const finalImages = [...existingImages, ...newUploadedUrls];
    const primaryImage = finalImages[0] || null;

    // Save updated listing
    const { error } = await supabase
      .from("listings")
      .update({
        ...form,
        baseprice: Number(form.baseprice),
        pricing_type: form.pricing_type,
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

    alert("Listing updated successfully!");
    router.push("/my-listings");
  };

  if (loading) return <p className="text-center mt-10">Loading…</p>;

  // --------------------------
  // Luxury Section Header Component
  // --------------------------
  const SectionHeader = ({ title }) => (
    <div className="rounded-t-xl shadow-sm">
      <div
        className="w-full py-3 px-4 rounded-t-xl text-white font-semibold"
        style={{
          background: "linear-gradient(to right, #0b1c35, #112a4e)",
          borderBottom: "2px solid #d4a72c",
        }}
      >
        {title}
      </div>
    </div>
  );

  // --------------------------
  // Main UI
  // --------------------------
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">

      {/* Page Title */}
      <h1 className="text-4xl font-extrabold text-center text-[#0b1c35] mb-4">
        Edit Listing
      </h1>

      {/* LISTING DETAILS */}
      <div className="rounded-xl shadow-md bg-white overflow-hidden">
        <SectionHeader title="Listing Details" />

        <div className="p-6 space-y-4">
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Listing Title"
            className="w-full p-3 border rounded-lg"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="Description"
            className="w-full p-3 border rounded-lg"
          />

          <div>
            <label className="block font-semibold mb-1">Listing Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg bg-white"
            >
              <option value="service">Service</option>
              <option value="tool">Tool</option>
              <option value="vehicle">Vehicle</option>
              <option value="recreation">Recreation</option>
              <option value="home">Home</option>
              <option value="space">Space</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRICING */}
      <div className="rounded-xl shadow-md bg-white overflow-hidden">
        <SectionHeader title="Pricing" />

        <div className="p-6 space-y-4">
          <div className="flex gap-4">
            <input
              name="baseprice"
              value={form.baseprice}
              onChange={handleChange}
              placeholder="Base Price"
              className="w-1/2 p-3 border rounded-lg"
            />

            <select
              name="pricing_type"
              value={form.pricing_type}
              onChange={handleChange}
              className="w-1/2 p-3 border rounded-lg bg-white"
            >
              <option value="">Select Pricing Type</option>

              <optgroup label="Time Based">
                <option value="per_hour">Per Hour</option>
                <option value="per_day">Per Day</option>
                <option value="per_night">Per Night</option>
                <option value="per_week">Per Week</option>
                <option value="per_month">Per Month</option>
              </optgroup>

              <optgroup label="Usage Based">
                <option value="per_use">Per Use</option>
                <option value="per_item">Per Item</option>
                <option value="per_service">Per Service</option>
                <option value="per_trip">Per Trip</option>
              </optgroup>

              <optgroup label="Sales">
                <option value="for_sale">For Sale</option>
              </optgroup>

              <optgroup label="Flat Fee">
                <option value="flat_rate">Flat Rate</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* LOCATION & ADDRESS */}
      <div className="rounded-xl shadow-md bg-white overflow-hidden">
        <SectionHeader title="Location & Address" />

        <div className="p-6 space-y-4">
          <input name="address_line1" value={form.address_line1} onChange={handleChange} placeholder="Address Line 1" className="w-full p-3 border rounded-lg" />
          <input name="address_line2" value={form.address_line2} onChange={handleChange} placeholder="Address Line 2 (optional)" className="w-full p-3 border rounded-lg" />
          <div className="flex gap-4">
            <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="w-1/3 p-3 border rounded-lg" />
            <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="w-1/3 p-3 border rounded-lg" />
            <input name="zip" value={form.zip} onChange={handleChange} placeholder="Zip" className="w-1/3 p-3 border rounded-lg" />
          </div>
        </div>
      </div>

      {/* CONTACT INFORMATION */}
      <div className="rounded-xl shadow-md bg-white overflow-hidden">
        <SectionHeader title="Contact Information" />

        <div className="p-6 space-y-4">
          <input name="contact_name" value={form.contact_name} onChange={handleChange} placeholder="Contact Name" className="w-full p-3 border rounded-lg" />
          <input name="contact_phone" value={form.contact_phone} onChange={handleChange} placeholder="Contact Phone" className="w-full p-3 border rounded-lg" />
          <input name="contact_email" value={form.contact_email} onChange={handleChange} placeholder="Contact Email" className="w-full p-3 border rounded-lg" />
        </div>
      </div>

      {/* INSTRUCTIONS */}
      <div className="rounded-xl shadow-md bg-white overflow-hidden">
        <SectionHeader title="Instructions" />

        <div className="p-6 space-y-4">
          <textarea name="pickup_instructions" value={form.pickup_instructions} onChange={handleChange} placeholder="Pickup Instructions" rows={2} className="w-full p-3 border rounded-lg" />
          <textarea name="private_instructions" value={form.private_instructions} onChange={handleChange} placeholder="Private Instructions" rows={2} className="w-full p-3 border rounded-lg" />
        </div>
      </div>

      {/* IMAGE MANAGER */}
      <div className="rounded-xl shadow-md bg-white overflow-hidden">
        <SectionHeader title="Images" />

        <div className="p-6 space-y-4">

          {/* Existing Images */}
          <div className="grid grid-cols-3 gap-3">
            {existingImages.map((url, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden shadow border">
                <img src={url} className="w-full h-28 object-cover" />

                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-[#d4a72c] text-xs text-black font-bold px-2 py-1 rounded">
                    Primary
                  </span>
                )}

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

          {/* Upload New Images */}
          <div>
            <label className="font-semibold block mb-1">Upload New Images</label>
            <input
              type="file"
              multiple
              onChange={handleImageSelect}
              className="w-full p-2 border rounded-lg bg-white"
            />
          </div>

          {/* Preview New Images */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {previewUrls.map((src, i) => (
                <img key={i} src={src} className="w-full h-28 object-cover rounded-lg border shadow-sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-[#0b1c35] hover:bg-[#112a4e] text-white py-3 rounded-xl font-semibold shadow-md transition"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
