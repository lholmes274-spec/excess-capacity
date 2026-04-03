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

// 🚫 PROHIBITED KEYWORDS (Basic Protection Layer)
  const BANNED_KEYWORDS = [
    "escort",
    "hookup",
    "sex",
    "sexual", 
    "nude",
    "nudity",
    "onlyfans",
    "adult service",
    "massage with extra",
    "cashapp",
    "whatsapp only",
    "snapchat only",
 ];

  const US_STATES = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

export default function AddListingPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    baseprice: "",
    currency: "USD",
    pricing_type: "",
    type: "",
    country: "United States",
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
  const [policyConfirmed, setPolicyConfirmed] = useState(false);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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

    if (name === "country") {
      setForm({ ...form, country: value, state: "" });
      return;
    }

    setForm({ ...form, [name]: value });

    if (name === "contact_email") {
      if (value.trim() === "") {
        setIsEmailValid(null);
      } else {
        setIsEmailValid(validateEmail(value));
      }
    }
  };

  const handleImageSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    // 🔒 HARD LIMIT: 10 images max
    if (files.length > 10) {
      alert("You can upload a maximum of 10 images per listing.");
      return;
    }

    setUploading(true);
  
    const approvedUrls: string[] = [];
    const previews: string[] = [];

     for (const file of files) {
       const reader = new FileReader();

       const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
         };
         reader.onerror = reject;
         reader.readAsDataURL(file);
     });

     const res = await fetch("/api/moderate-image", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
       },
       body: JSON.stringify({ image: base64 }),
     });

     let data: any = null;

     try {
       data = await res.json();
     } catch (e) {
       data = null;
     }

     // ✅ If the API failed (500, 403, etc.) or returned no safe flag, show a DIFFERENT message
     if (!res.ok || !data || typeof data.safe !== "boolean") {
      alert(
        "Image moderation service could not analyze this image right now. Please try again."
      );
      return;
    }

    if (data.safe === false) {
      alert(
        "One of your images appears to contain prohibited content and cannot be uploaded."
      );
      return;
    }

     approvedFiles.push(file);
     approvedPreviews.push(URL.createObjectURL(file));
   }

    setImages(approvedFiles);
    setPreviewUrls(approvedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // 🔒 HARD STOP
    setLoading(true);

    // 🔒 REQUIRE VALID PRICE
    const priceNumber = Number(form.baseprice);

    if (!form.baseprice || isNaN(priceNumber) || priceNumber <= 0) {
      alert("Please enter a valid price greater than 0.");
      setLoading(false);
      return;
    }

    // 🔒 REQUIRE POLICY CONFIRMATION
    if (!policyConfirmed) {
      alert(
        "You must confirm that your listing does not include prohibited content before submitting."
      );
      setLoading(false);
      return;
    }

    // 🔒 REQUIRE AT LEAST ONE IMAGE
    if (uploadedImageUrls.length === 0) {
      alert("Please upload at least one image before submitting your listing.");
      setLoading(false);
      return;
    }

    // 🚫 BLOCK EXTERNAL LINKS IN DESCRIPTION
    const containsExternalLink =
      form.description.includes("http") ||
      form.description.includes("https") ||
      form.description.includes("www.");
    if (containsExternalLink) {
      alert(
         "External links are not allowed in listing descriptions.\n\nPlease remove any website URLs before submitting."
      );
      setLoading(false);
      return;
    }

    // 🚫 BLOCK PROHIBITED KEYWORDS
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^a-z]/g, ""); // remove spaces, punctuation, numbers
    }
    const containsBannedWord = (text: string): boolean => {
      const normalizedText = normalizeText(text);

      return BANNED_KEYWORDS.some((word) =>
        normalizedText.includes(normalizeText(word))
      );
    }

    if (
      containsBannedWord(form.title || "") ||
      containsBannedWord(form.description || "") ||
      containsBannedWord(form.private_instructions || "") ||
      containsBannedWord(form.pickup_instructions || "")
    ) {
      alert(
        "Your listing contains prohibited content and cannot be submitted."
      );
      setLoading(false);
      return;
    }  

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      alert("Please sign in first.");
      router.push("/login");
      return;
    }

    // Images already uploaded during selection
    const uploadedUrls = uploadedImageUrls;

    const primaryImage = uploadedUrls[0] || null;

    const transactionType =
      form.pricing_type === "for_sale" ? "sale" : "booking";

    const { data: insertedListing, error } = await supabase
      .from("listings")
      .insert([
       {
        owner_id: userId,
        title: form.title,
        description: form.description,
        baseprice: Number(form.baseprice),
        currency: form.currency, 
        pricing_type: form.pricing_type,
        transaction_type: transactionType,
        type: form.type.toLowerCase(),
        country: form.country,
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
        image_url: uploadedImageUrls[0] || null,
        image_urls: uploadedImageUrls,
       },
    ])
    .select()
    .single();

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

        {/* Base Price + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            step="0.01"
            min="0.01"
            name="baseprice"
            value={form.baseprice}
            onChange={handleChange}
            placeholder="Base Price"
            className="w-full p-3 border rounded-lg"
            required
          />

          <select
            name="currency"
            value={form.currency}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-white"
          >
            <option value="USD">USD – US Dollar</option>
            <option value="DOP">DOP – Dominican Peso</option>
            <option value="NGN">NGN – Nigerian Naira</option>
            <option value="INR">INR – Indian Rupee</option>
            <option value="CAD">CAD – Canadian Dollar</option>
            <option value="MXN">MXN – Mexican Peso</option>
            <option value="EUR">EUR – Euro</option>
          </select>
        </div>

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

          <select
            name="country"
            value={form.country}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-white"
          >
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="Other">Other Country</option>
          </select>

          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
            className="w-full p-3 border rounded-lg"
          />

          {form.country === "United States" ? (
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg bg-white"
          >
              <option value="">Select State</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
           ))}
          </select>
          ) : (
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              placeholder="Province / Region"
              className="w-full p-3 border rounded-lg"
              required
            />
          )}

        <div>
          <label className="block font-semibold mb-1">
            {form.country === "United States" ? "ZIP Code" : "Postal Code"}
          </label>
          <input
            name="zip"
            value={form.zip}
            onChange={handleChange}
            placeholder={
              form.country === "United States"
                ? "Enter ZIP Code"
                : "Enter Postal Code"
            }
            className="w-full p-3 border rounded-lg"
          />
        </div>
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

          {uploading && (
            <p className="text-sm text-gray-500 mt-2">Uploading image...</p>
         )}
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

        {/* Policy Confirmation */}
        <div className="flex items-start space-x-2 bg-gray-50 p-3 rounded-lg border">
          <input
            type="checkbox"
            checked={policyConfirmed}
            onChange={(e) => setPolicyConfirmed(e.target.checked)}
            className="mt-1"
          />
          <p className="text-sm text-gray-700">
            I confirm this listing does not include nudity, sexual services, or
            prohibited content and complies with Prosperity Hub policies.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-lg font-semibold transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Add Listing"}
        </button>
      </form>
    </div>
  );
}
