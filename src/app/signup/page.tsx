// @ts-nocheck
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* TOP BRAND BANNER */}
      <img
        src="/prosperity-banner.png"
        alt="Prosperity Hub Banner"
        className="w-full h-[85px] object-cover"
      />

      {/* SIGNUP CARD */}
      <div className="flex justify-center px-4 mt-10">
        <div className="bg-white w-full max-w-md shadow-xl rounded-2xl p-8 border border-gray-200">

          {/* Small icon */}
          <div className="flex justify-center mb-4">
            <img
              src="/prosperity-icon.png"
              alt="Prosperity Hub Icon"
              className="w-14 h-14 object-contain"
            />
          </div>

          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
            Join Prosperity Hub™
          </h2>

          {error && (
            <div className="mb-4 text-red-600 text-center text-sm">{error}</div>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 border rounded-lg bg-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 border rounded-lg bg-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 mb-6 border rounded-lg bg-white"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-full text-lg font-semibold transition-all"
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Creating your account..." : "Sign Up"}
          </button>

          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto py-10 text-center text-gray-600 text-sm border-t bg-white">
        <div className="flex justify-center space-x-6 mb-3">
          <Link href="/about" className="hover:text-black">About</Link>
          <Link href="/services" className="hover:text-black">Services</Link>
          <Link href="/contact" className="hover:text-black">Contact</Link>
          <Link href="/terms" className="hover:text-black">Terms</Link>
          <Link href="/privacy" className="hover:text-black">Privacy</Link>
        </div>

        <div>© {new Date().getFullYear()} Prosperity Voyage LLC</div>
      </footer>
    </div>
  );
}
