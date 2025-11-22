// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If logged in → redirect to dashboard immediately
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.push("/dashboard");
    };
    checkUser();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please fill out all fields.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Login</h1>

      <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-8 w-full max-w-md">

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-lg mb-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-lg mb-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t"></div>
          <span className="mx-4 text-gray-500">OR</span>
          <div className="flex-grow border-t"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-100"
        >
          <img src="/google-icon.png" className="w-5 h-5" />
          Sign in with Google
        </button>

        <p className="text-center text-gray-600 mt-6">
          Don’t have an account?
          <Link href="/signup" className="text-blue-600 hover:underline">
            &nbsp;Create an account
          </Link>
        </p>
      </div>

    </div>
  );
}
