// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // If logged-in → redirect to dashboard
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.push("/dashboard");
    };
    checkUser();
  }, []);

  // Redirect after success
  useEffect(() => {
    if (signupSuccess) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [signupSuccess]);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      alert("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      setSignupSuccess(true);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white shadow-2xl border border-gray-200 rounded-2xl p-10 w-full max-w-md">

        {/* HEADER */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Create Your Account
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Join Prosperity Hub and unlock access to listings, bookings, and community.
        </p>

        {/* SUCCESS MESSAGE */}
        {signupSuccess && (
          <div className="mb-5 p-4 text-green-800 bg-green-100 border border-green-300 rounded-lg text-center">
            Account created! Check your email for confirmation.
            <div className="mt-2 text-sm text-gray-700">
              Redirecting to login...
            </div>
          </div>
        )}

        {/* SIGNUP FORM */}
        {!signupSuccess && (
          <>
            <input
              type="email"
              placeholder="Email address"
              className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 border rounded-lg mb-3 focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm password"
              className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {/* Sign Up Button */}
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-blue-300"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t"></div>
              <span className="mx-3 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t"></div>
            </div>

            {/* GOOGLE LOGIN */}
            <button
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 py-3 rounded-lg flex items-center justify-center gap-3 text-gray-700 bg-white hover:bg-gray-100 transition"
            >
              <img src="/google-icon.png" className="w-5 h-5" />
              Continue with Google
            </button>

            <p className="text-center text-gray-600 mt-6">
              Already have an account?
              <Link href="/login" className="text-blue-600 hover:underline">&nbsp;Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
