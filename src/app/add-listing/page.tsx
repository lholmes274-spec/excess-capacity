// @ts-nocheck
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
  });

  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    if (name === "contact_email") {
      if (value.trim() === "") {
        setIsEmailValid(null);
      } else {
        setIsEmailValid(validateEmail(value));
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    setImages(files);
    setPreviewUrls(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      alert("Please sign in first.");
      router.push("/login");
      return;
    }

    let uploadedUrls: string[] = [];

    for (const image of images) {
      const ext = image.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const filePath = `listing-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, image);

      if (uploadError) {
        alert("Image upload failed.");
        console.error(uploadError);
        setLoading(false);
        return;
      }

      const { data } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
    }

    const primaryImage = uploadedUrls[0] || null;

    const { error } = await supabase.from("listings").insert([
      {
        owner_id: userId,
        title: form.title,
        description: form.description,
        baseprice: Number(form.baseprice),
        pricing_type: form.pricing_type,
        type: form.type.toLowerCase(),
        location: form.location,
        state: form.state,
        city: form.city,
        zip: form.zip,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        contact_name: form.contact_name,
        contact_phone: form.contact_phone,
        contact_email: form.contact_email,
        pickup_instructions: form.pickup_instructions,
        private_instructions: form.private_instructions,
        demo_mode: form.demo_mode,
        image_url: primaryImage,
        image_urls: uploadedUrls,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error("Error adding listing:", error);
      alert("Error adding listing. Check console for details.");
      return;
    }

    alert("Listing added successfully!");
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-orange-800">
        Add a New Listing
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Listing Type */}
        <div>
          <label className="block font-semibold mb-1">Listing Type</label>
          <select
            name="type"
            required
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

              {/* ⭐ NEW FURNITURE CATEGORY */}
              <option value="furniture">Furniture</option>

              {/* Electronics */}
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

        {/* Title */}
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Listing Title"
          className="w-full p-3 border rounded-lg"
          required
        />

        {/* Description */}
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-3 border rounded-lg"
          rows={3}
        />

        {/* Base Price */}
        <input
          name="baseprice"
          value={form.baseprice}   // ⭐ FIXED BUG
          onChange={handleChange}
          placeholder="Base Price"
          className="w-full p-3 border rounded-lg"
          required
        />

        {/* Pricing Type */}
        <div>
          <label className="block font-semibold mb-1">Pricing Type</label>
          <select
            name="pricing_type"
            required
            value={form.pricing_type}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-white"
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

        {/* Location */}
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location (City, State)"
          className="w-full p-3 border rounded-lg"
        />

        {/* Address */}
        <div className="space-y-3">
          <input
            name="address_line1"
            value={form.address_line1}
            onChange={handleChange}
            placeholder="Address Line 1"
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="address_line2"
            value={form.address_line2}
            onChange={handleChange}
            placeholder="Address Line 2 (optional)"
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="state"
            value={form.state}
            onChange={handleChange}
            placeholder="State"
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="zip"
            value={form.zip}
            onChange={handleChange}
            placeholder="Zip Code"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <input
            name="contact_name"
            value={form.contact_name}
            onChange={handleChange}
            placeholder="Contact Name"
            className="w-full p-3 border rounded-lg"
          />

          <input
            name="contact_phone"
            value={form.contact_phone}
            onChange={handleChange}
            placeholder="Contact Phone"
            className="w-full p-3 border rounded-lg"
          />

          <div className="relative">
            <input
              name="contact_email"
              value={form.contact_email}
              onChange={handleChange}
              placeholder="Contact Email"
              className={`w-full p-3 border rounded-lg pr-10 ${
                isEmailValid === false ? "border-gray-300" : ""
              }`}
            />

            {isEmailValid && (
              <span className="absolute right-3 top-3 text-green-600 text-xl font-bold">
                ✔
              </span>
            )}
          </div>

          <textarea
            name="pickup_instructions"
            value={form.pickup_instructions}
            onChange={handleChange}
            placeholder="Pickup Instructions"
            className="w-full p-3 border rounded-lg"
            rows={2}
          />
        </div>

        {/* Private Instructions */}
        <div>
          <label className="block font-semibold mb-1">
            Private Instructions (shown only after booking)
          </label>
          <textarea
            name="private_instructions"
            value={form.private_instructions}
            onChange={handleChange}
            placeholder="Gate code, access instructions, lockbox location, etc."
            className="w-full p-3 border rounded-lg"
            rows={3}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-semibold mb-1">Upload Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="w-full p-2 border rounded-lg bg-white"
          />
        </div>

        {/* Preview */}
        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((src, i) => (
              <img
                key={i}
                src={src}
                className="w-full h-24 object-cover rounded border"
              />
            ))}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg font-semibold transition"
        >
          {loading ? "Submitting..." : "Add Listing"}
        </button>
      </form>
    </div>
  );
}
