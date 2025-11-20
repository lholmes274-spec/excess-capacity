"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AddListingPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    baseprice: "",
    location: "",
    type: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ⭐ MULTIPLE IMAGE SELECTION + PREVIEW
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    setImages(selectedFiles);

    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 🔒 Ensure user is logged in
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      alert("Please sign in first.");
      router.push("/login");
      return;
    }

    // ⭐ UPLOAD MULTIPLE IMAGES
    let uploadedUrls: string[] = [];

    for (const image of images) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `listing-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, image);

      if (uploadError) {
        console.error(uploadError);
        alert("Image upload failed.");
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
    }

    const primaryImage = uploadedUrls.length > 0 ? uploadedUrls[0] : null;

    // ⭐ INSERT LISTING
    const { error } = await supabase.from("listings").insert([
      {
        user_id: userId,
        title: form.title,
        description: form.description,
        baseprice: form.baseprice,
        location: form.location,

        // 🔥 MATCHED EXACTLY TO YOUR CATEGORY CARDS
        type: form.type.toLowerCase().trim(),

        image_url: primaryImage,
        image_urls: uploadedUrls,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Error adding listing.");
    } else {
      alert("Listing added successfully!");
      router.push("/");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Add a New Listing
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ⭐ UPDATED TYPE DROPDOWN MATCHING YOUR CATEGORY CARDS */}
        <label className="block font-medium">Listing Type</label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          required
          className="w-full border p-3 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-- Select Listing Type --</option>

          <optgroup label="Services">
            <option value="service">Service</option>
            <option value="consultant">Consultant</option>
          </optgroup>

          <optgroup label="Rentals & Items">
            <option value="tool">Tool</option>
            <option value="vehicle">Vehicle</option>
            <option value="recreation">Recreation</option>
            <option value="home">Home</option>
          </optgroup>

          <optgroup label="Spaces">
            <option value="space">Space</option>
          </optgroup>

          <optgroup label="Misc">
            <option value="other">Other</option>
          </optgroup>
        </select>

        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Listing Title"
          className="w-full border p-3 rounded-lg shadow-sm"
          required
        />

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border p-3 rounded-lg shadow-sm"
          rows={3}
        />

        <input
          type="text"
          name="baseprice"
          value={form.baseprice}
          onChange={handleChange}
          placeholder="Base Price"
          className="w-full border p-3 rounded-lg shadow-sm"
          required
        />

        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location (City, State)"
          className="w-full border p-3 rounded-lg shadow-sm"
        />

        {/* ⭐ MULTIPLE IMAGE UPLOAD FIELD */}
        <div>
          <label className="block font-medium mb-1">Upload Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="w-full border p-2 rounded bg-white"
          />
        </div>

        {/* ⭐ IMAGE PREVIEW GRID */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {previewUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                className="w-full h-24 object-cover rounded border"
              />
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
        >
          {loading ? "Submitting..." : "Add Listing"}
        </button>
      </form>
    </div>
  );
}
