// @ts-nocheck
"use client";

import Link from "next/link";

export default function YouAreProPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(to bottom, #FFFFFF, #F4D273)",
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          You’re a Prosperity Hub Pro Member!
        </h1>

        <p className="text-gray-600 mb-8">
          Your account already includes premium features and full access.
        </p>

        <Link
          href="/dashboard"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
