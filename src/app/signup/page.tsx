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

  // If user is already logged in → send to dashboard
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) router.push("/dashboard");
    };
    checkUser();
  }, []);

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
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Account</h1>

      <div className="bg-white shadow-lg border border-gray-200 rounded-xl p-8 w-full max-w-md">

        {signupSuccess && (
          <div className="mb-4 p-3 text-green-800 bg-green-100 border border-green-300 rounded-lg text-center">
            Account created! Check your email to confirm your account.
          </div>
        )}

        {!signupSuccess && (
          <>
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

            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 border rounded-lg mb-4"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading ? "Creating account..." : "Sign Up"}
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
              Sign up with Google
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
