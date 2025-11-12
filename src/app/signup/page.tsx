"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link"; // 👈 already imported

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false); // ✅ Added state
  const router = useRouter();

  // ✅ Detect when user clicks Supabase email confirmation link
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=signup") || hash.includes("access_token")) {
      setShowConfirm(true);
      // Optional: redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    }
  }, [router]);

  // ✅ Redirect user if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        router.push("/subscribe"); // 👈 redirect confirmed/logged-in users
      }
    };
    checkUser();
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("Creating your account...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // ✅ redirect after confirming email
        emailRedirectTo: "https://prosperityhub.app/confirm?fromSignup=true",
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

      {/* 👇 Subscribe link (still visible if not logged in) */}
      <div className="mt-6">
        <Link href="/subscribe" className="text-blue-600 hover:underline">
          Subscribe
        </Link>
      </div>

      {/* ✅ Confirmation message */}
      {showConfirm && (
        <p className="mt-4 text-green-600 text-sm font-medium text-center">
          ✅ Email confirmed — please log in.
        </p>
      )}

      {/* ✅ Regular signup status message */}
      {message && !showConfirm && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}
