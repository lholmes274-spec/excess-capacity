// @ts-nocheck
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg(null);

    if (form.password !== form.confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // After sign-up → send user to dashboard
    router.push("/dashboard");
  }

  async function handleGoogle() {
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[#0c0f16]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#111827] border border-gray-700 rounded-2xl shadow-2xl p-8 text-white"
      >
        {/* Header */}
        <h1 className="text-3xl font-extrabold text-center mb-6 text-amber-400 drop-shadow-lg">
          Create Your Account
        </h1>

        <p className="text-gray-300 text-center mb-8 text-sm">
          Unlock full access to Prosperity Hub.  
          <br />
          <span className="text-amber-300">Start listing, renting & earning.</span>
        </p>

        {/* Error */}
        {errorMsg && (
          <p className="text-red-500 text-center mb-4 text-sm">{errorMsg}</p>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full bg-[#1f2937] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full bg-[#1f2937] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirm"
              required
              value={form.confirm}
              onChange={handleChange}
              className="w-full bg-[#1f2937] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-amber-400 outline-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 transition text-black font-semibold py-3 rounded-lg shadow-lg"
          >
            {loading ? "Creating Account…" : "Sign Up"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-700"></div>
          <span className="px-3 text-gray-400 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-700"></div>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-3 rounded-lg shadow hover:bg-gray-100 transition"
        >
          Continue with Google
        </button>

        {/* Login link */}
        <p className="text-gray-400 text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-400 hover:underline">
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
