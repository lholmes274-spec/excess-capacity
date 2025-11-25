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

      setExistingImages(data.image_urls || []);

      setLoading(false);
    }

    loadListing();
  }, [id]);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle new image upload selection
  const handleImageSelect = (e) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setNewImages(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  // Delete existing image visually (we remove it in database later)
  const handleRemoveImage = (url) => {
    setExistingImages(existingImages.filter((img) => img !== url));
  };

  // Save listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    let newUploadedUrls = [];

    // Upload NEW images
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

    // FINAL image array (existing - deleted + new)
    const finalImages = [...existingImages, ...newUploadedUrls];

    // Primary image = first image
    const primaryImage = finalImages[0] || null;

    // Update listing
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

    alert("Listing updated successfully!");
    router.push("/my-listings");
  };

  if (loading) return <p className="text-center mt-10">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-800">
        Edit Listing
      </h1>

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
            <option value="service">Service</option>
            <option value="tool">Tool</option>
            <option value="vehicle">Vehicle</option>
            <option value="recreation">Recreation</option>
            <option value="home">Home</option>
            <option value="space">Space</option>
            <option value="other">Other</option>
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

        {/* CONTACT + ADDRESS */}
        <input name="contact_name" value={form.contact_name} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Contact Name" />
        <input name="contact_phone" value={form.contact_phone} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Contact Phone" />
        <input name="contact_email" value={form.contact_email} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Contact Email" />
        <input name="address_line1" value={form.address_line1} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Address Line 1" />
        <input name="address_line2" value={form.address_line2} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Address Line 2" />
        <input name="city" value={form.city} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="City" />
        <input name="state" value={form.state} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="State" />
        <input name="zip" value={form.zip} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Zip Code" />

        {/* INSTRUCTIONS */}
        <textarea name="pickup_instructions" value={form.pickup_instructions} onChange={handleChange} rows={2} className="w-full p-3 border rounded-lg" placeholder="Pickup Instructions" />
        <textarea name="private_instructions" value={form.private_instructions} onChange={handleChange} rows={2} className="w-full p-3 border rounded-lg" placeholder="Private Instructions" />

        {/* EXISTING IMAGES */}
        <div>
          <label className="font-semibold block mb-2">Existing Images</label>
          <div className="grid grid-cols-3 gap-2">
            {existingImages.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} className="w-full h-24 object-cover rounded border" />
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
          <input type="file" multiple onChange={handleImageSelect} className="w-full p-2 border rounded-lg bg-white" />
        </div>

        {/* PREVIEW NEW IMAGES */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {previewUrls.map((src, i) => (
              <img key={i} src={src} className="w-full h-24 object-cover rounded border" />
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-600 text-white p-3 rounded-lg font-semibold hover:bg-orange-700 transition"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
