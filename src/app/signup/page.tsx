// @ts-nocheck
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle signup
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
    <div className="min-h-screen flex flex-col">

      {/* ------------------------ BANNER SECTION ------------------------ */}
      <div className="w-full h-[360px] bg-gradient-to-br from-blue-900 to-blue-700 flex flex-col items-center justify-center text-white text-center px-4">
        <h1 className="text-4xl font-bold mb-3">Unlock Your Prosperity Journey</h1>
        <p className="text-lg max-w-2xl opacity-90">
          Join Prosperity Hub and start discovering, sharing, and unlocking hidden opportunities within your community.
        </p>
      </div>

      {/* ------------------------ SIGNUP CARD ------------------------ */}
      <div className="flex justify-center -mt-24 px-4">
        <div className="bg-white w-full max-w-md shadow-2xl rounded-2xl p-10 border border-gray-200">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
            Join Prosperity Hub
          </h2>

          {error && (
            <div className="mb-4 text-red-600 text-center text-sm">{error}</div>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 border rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 mb-6 border rounded-lg"
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
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </p>
        </div>
      </div>

      {/* ------------------------ FOOTER ------------------------ */}
      <footer className="mt-auto py-10 text-center text-gray-600 text-sm border-t bg-gray-50">
        <div className="flex justify-center space-x-6 mb-3">
          <a href="/about" className="hover:text-blue-600">About</a>
          <a href="/contact" className="hover:text-blue-600">Contact</a>
          <a href="/terms" className="hover:text-blue-600">Terms</a>
          <a href="/privacy" className="hover:text-blue-600">Privacy</a>
        </div>

        <div>© {new Date().getFullYear()} Prosperity Hub LLC</div>
        <div className="mt-1">support@prosperityhub.app</div>
      </footer>

    </div>
  );
}
