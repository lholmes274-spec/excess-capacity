"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

// --------------------------------------------------
// ✅ BASIC EMAIL VALIDATION (Prevents common mistakes)
// --------------------------------------------------
function isValidEmail(email: string) {
  const basicCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!basicCheck) return false;

  const blockedDomains = [
    "gmaill.com",
    "yahho.com",
    "yaho.com",
    "hotmial.com",
    "gmail.con",
    "gmial.com",
    "outlok.com",
  ];

  const domain = email.split("@")[1]?.toLowerCase();
  if (blockedDomains.includes(domain)) return false;

  return true;
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) router.push("/subscribe");
    };
    checkUser();
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("Creating your account...");

    // --------------------------------------------------
    // STEP 1 — BASIC EMAIL VALIDATION
    // --------------------------------------------------
    if (!isValidEmail(email)) {
      setMessage(
        "❌ Invalid email address. Please double-check the spelling before continuing."
      );
      return;
    }

    // --------------------------------------------------
    // STEP 2 — PASSWORD MATCH VALIDATION
    // --------------------------------------------------
    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match. Please try again.");
      return;
    }

    // --------------------------------------------------
    // STEP 3 — SUPABASE SIGNUP
    // --------------------------------------------------
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "https://prosperityhub.app/confirm",
      },
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Confirmation email sent! You can close this window now.");

      // --------------------------------------------------
      // SAFE AUTO-CLOSE (Only works if opened via window.open)
      // --------------------------------------------------
      setTimeout(() => {
        if (window.opener) {
          window.close();
        }
      }, 3000);
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

        {/* NEW Confirm Password Field */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full border p-3 rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          Sign Up
        </button>
      </form>

      <div className="mt-6">
        <Link href="/subscribe" className="text-blue-600 hover:underline">
          Subscribe
        </Link>
      </div>

      {message && (
        <p className="mt-4 text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
}
