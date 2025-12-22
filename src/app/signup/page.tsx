// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  // If logged-in → redirect properly
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.push(redirectTo);
    };
    checkUser();
  }, [redirectTo, router]);

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error("Please enter a valid email address.");
    }

    const blockedDomains = [
      "yaoo.com",
      "yaoo.co",
      "yhoo.com",
      "yaho.com",
      "gmal.com",
      "gmial.com",
      "hotmial.com",
      "outlok.com",
    ];

    const domain = email.split("@")[1]?.toLowerCase();
    if (blockedDomains.includes(domain)) {
      throw new Error(
        "It looks like there may be a typo in your email address. Please double-check it."
      );
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      alert("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      validateEmail(email);
    } catch (err: any) {
      alert(err.message);
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
      setSignupSuccess(true);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${redirectTo}` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white shadow-2xl border border-gray-200 rounded-2xl p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Create Your Account
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Join Prosperity Hub and unlock access to listings, bookings, and community.
        </p>

        {signupSuccess && (
          <div className="mb-6 p-5 bg-green-100 border border-green-300 rounded-lg text-center">
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              ✅ Account created successfully
            </h2>

            <p className="text-green-800">
              Please check your email and confirm your account.
            </p>

            <p className="mt-4 text-sm text-gray-700">
              After confirming, you’ll be redirected automatically.
            </p>
          </div>
        )}

        {!signupSuccess && (
          <>
            <input
              type="email"
              placeholder="Email address"
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

            <input
              type="password"
              placeholder="Confirm password"
              className="w-full p-3 border rounded-lg mb-4"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold disabled:bg-blue-300"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>

            <div className="flex items-center my-6">
              <div className="flex-grow border-t"></div>
              <span className="mx-3 text-gray-500 text-sm">OR</span>
              <div className="flex-grow border-t"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full border py-3 rounded-lg flex items-center justify-center gap-3"
            >
              <img src="/google-icon.png" className="w-5 h-5" />
              Continue with Google
            </button>

            <p className="text-center text-gray-600 mt-6">
              Already have an account?
              <Link href="/login" className="text-blue-600 hover:underline">
                &nbsp;Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
