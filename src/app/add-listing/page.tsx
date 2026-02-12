// @ts-nocheck
"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/* 🔒 PRICING INTENT RULES (LOCKED)
   Time-based → duration
   Usage-based → quantity
*/
const PRICING_INTENT: Record<
  string,
  { model: "duration" | "quantity"; label: string }
> = {
  per_hour: { model: "duration", label: "Billed by number of hours" },
  per_day: { model: "duration", label: "Billed by number of days" },
  per_night: { model: "duration", label: "Billed by number of nights" },
  per_week: { model: "duration", label: "Billed by number of weeks" },
  per_month: { model: "duration", label: "Billed by number of months" },

  per_use: { model: "quantity", label: "Billed per use" },
  per_item: { model: "quantity", label: "Billed per item" },
  per_service: { model: "quantity", label: "Billed per service" },
  per_trip: { model: "quantity", label: "Billed per trip" },

  for_sale: { model: "quantity", label: "Sold per item" },
  flat_rate: { model: "duration", label: "One-time flat rate" },
};

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

  // 🔒 Stripe payout protection
  const [stripeReady, setStripeReady] = useState(false);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);

  useEffect(() => {
    const checkStripeStatus = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;

      if (!userId) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          `
          stripe_account_id,
          stripe_charges_enabled,
          stripe_payouts_enabled
        `
        )
        .eq("id", userId)
        .single();

      const ready =
        !!profile?.stripe_account_id &&
        profile?.stripe_charges_enabled === true;

      setStripeReady(!!ready);
      setCheckingStripe(false);
    };

    checkStripeStatus();
  }, [router]);

  const handleConnectStripe = async () => {
    try {
      setConnectingStripe(true);

      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });

      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
      } else {
        alert("Unable to start Stripe onboarding.");
      }
    } catch (err) {
      alert("Stripe connection failed.");
    } finally {
      setConnectingStripe(false);
    }
  };

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
    if (loading) return; // 🔒 HARD STOP

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
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, image, { upsert: true });

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
      
      // RLS violation = free listing limit reached
      if (error.code === "42501") {
        alert(
          "You’ve reached the maximum of 3 listings for a free account.\n\nUpgrade to Pro for unlimited listings."
        );
        } else {  
          alert("Something went wrong while creating your listing. Please try again.");
          }
      return;
    }

    // ✅ GA4 — Listing Created (fires ONLY on success)
    if (typeof window !== "undefined" && typeof gtag === "function") {
      gtag("event", "listing_created");
    }

    alert("Listing added successfully!");
    router.push("/");
  };

  if (checkingStripe) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking payout setup...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {!stripeReady && (
        <div className="mb-6 p-5 bg-white border-2 border-red-400 rounded-xl shadow">
          <h3 className="font-semibold text-red-700">
            ⚠️ Stripe not connected
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            You can create and publish listings.
            To receive payouts, please connect Stripe.
          </p>
          <button
            onClick={handleConnectStripe}
            disabled={connectingStripe}
            className="mt-3 px-4 py-2 bg-black text-white rounded hover:opacity-90 disabled:opacity-50"
          >
            {connectingStripe ? "Connecting..." : "Connect Stripe"}
          </button>
        </div>
      )}

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
          value={form.baseprice}
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
          {form.pricing_type && PRICING_INTENT[form.pricing_type] && (
            <p className="text-sm text-gray-500 mt-1">
              {PRICING_INTENT[form.pricing_type].label}
            </p>
          )}
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
          className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Add Listing"}
        </button>
      </form>
    </div>
  );
}
