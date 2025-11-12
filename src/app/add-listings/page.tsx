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
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
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

    const { error } = await supabase.from("listings").insert([
      {
        user_id: userId,
        title: form.title,
        description: form.description,
        baseprice: form.baseprice,
        location: form.location,
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
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="Listing Title"
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full border p-2 rounded"
          rows={3}
        />
        <input
          type="text"
          name="baseprice"
          value={form.baseprice}
          onChange={handleChange}
          placeholder="Base Price"
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded transition"
        >
          {loading ? "Submitting..." : "Add Listing"}
        </button>
      </form>
    </div>
  );
}
