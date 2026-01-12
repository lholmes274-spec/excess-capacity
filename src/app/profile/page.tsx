// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // 🔑 Display name used everywhere in UI
  const [displayName, setDisplayName] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function getUserAndProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);

      // Load existing profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, city, state")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setCity(profile.city || "");
        setState(profile.state || "");
      }
    }

    getUserAndProfile();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: displayName.trim() || null,
        city,
        state,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage(`❌ ${error.message}`);
      return;
    }

    // Optional: sync to auth metadata (admin / emails)
    if (displayName.trim()) {
      await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
    }

    setMessage("✅ Profile updated successfully!");

    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-3xl font-bold mb-4">Profile</h1>
      <p className="text-gray-600 max-w-md mb-8">
        This name is shown to other users in conversations and bookings.
      </p>

      <form
        onSubmit={handleSave}
        className="bg-white shadow-md rounded-xl p-6 w-full max-w-sm"
      >
        <input
          type="text"
          placeholder="Display name (e.g. Lamar, Lester)"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="text"
          placeholder="State"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Save Profile
        </button>
      </form>

      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </main>
  );
}
