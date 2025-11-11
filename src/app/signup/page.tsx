"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link"; // 👈 added import for Link

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Creating your account...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // ✅ redirect after confirming email
        emailRedirectTo: "https://prosperityhub.app/confirm",
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Please check your email and click the confirmation link to finish signing up."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-semibold mb-6">Join Prosperity Hub</h1>
      <form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border p-3 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          Sign Up
        </button>
      </form>

      {/* 👇 Added visible Subscribe link below form */}
      <div className="mt-6">
        <Link href="/subscribe" className="text-blue-600 hover:underline">
          Subscribe
        </Link>
      </div>

      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
