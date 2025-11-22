// @ts-nocheck
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Invalid email or password.");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* TOP BANNER */}
      <img
        src="/prosperity-banner.png"
        alt="Prosperity Hub Banner"
        className="w-full h-[85px] object-cover"
      />

      {/* LOGIN CARD */}
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
            Log in to Prosperity Hub™
          </h2>

          {error && (
            <div className="mb-4 text-red-600 text-center text-sm">{error}</div>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 mb-4 border rounded-lg bg-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 mb-6 border rounded-lg bg-white"
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full transition-all"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-sm mt-4">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>

          <p className="text-center text-sm mt-2">
            <Link href="/forgot-password" className="text-blue-600 hover:underline">
              Forgot your password?
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
