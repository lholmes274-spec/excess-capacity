// @ts-nocheck
"use client";

import { useSearchParams } from "next/navigation";

export default function SignupThankYouPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white shadow-2xl border border-gray-200 rounded-2xl p-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Create Your Account
        </h1>

        <div className="p-5 bg-green-100 border border-green-300 rounded-lg">
          <h2 className="text-lg font-semibold text-green-900 mb-2">
            ✅ Account created successfully
          </h2>

          <p className="text-green-800">
            We’ve sent a confirmation email to{" "}
            <strong>{email}</strong>.
            <br />
            Please check your inbox and click the link to confirm your email address.
          </p>

          <p className="mt-4 text-sm text-green-800">
            After confirming your email, return to Prosperity Hub and sign in to your account.
          </p>

          <p className="mt-2 text-sm text-green-800">
            You may safely close this tab.
          </p>
        </div>
      </div>
    </div>
  );
}
