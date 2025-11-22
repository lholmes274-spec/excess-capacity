// @ts-nocheck
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      alert("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Account created! Check your email to verify.");
    }
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Account</h1>

      <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-8 w-full max-w-md">

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Confirm Password */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 border rounded-lg mb-3"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* Sign Up Button */}
        <button
          onClick={handleSignUp}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        {/* OR Divider */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t"></div>
          <span className="mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t"></div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100"
        >
          <img src="/google-icon.png" className="w-5 h-5" />
          Sign up with Google
        </button>

        {/* (Optional) Apple Login */}
        {/* <button
          onClick={() => supabase.auth.signInWithOAuth({ provider: "apple" })}
          className="mt-3 w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100"
        >
          <img src="/apple-icon.png" className="w-5 h-5" />
          Sign up with Apple
        </button> */}

        {/* Already have an account? */}
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>

      {/* DARK FOOTER */}
      <footer className="w-full text-center bg-[#0B132B] text-white py-6 mt-10">
        © {new Date().getFullYear()} ProsperityHub.app. All rights reserved.
      </footer>
    </div>
  );
}
