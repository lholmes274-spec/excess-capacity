// @ts-nocheck
"use client";

import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

/* -----------------------------
   Loading Component
------------------------------*/
function Loading({ message }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600 text-center p-6">
      <p className="text-lg font-semibold mb-2">{message}</p>
      <p className="text-sm text-gray-500">
        Please don’t refresh this page.
      </p>
    </div>
  );
}

/* -----------------------------
   Success Content
------------------------------*/
function SuccessPurchaseContent() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-6 text-center">

      {/* Animated Check */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 10 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </motion.div>

      <h1 className="text-3xl font-extrabold text-green-700 mb-4">
        Purchase Successful 🎉
      </h1>

      <p className="text-lg text-green-800 mb-8 max-w-md">
        Your payment was successful. This item is now yours.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Go to Dashboard
        </Link>

        <Link
          href="/"
          className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
        >
          Back to Marketplace
        </Link>
      </div>
    </div>
  );
}

/* -----------------------------
   Wrapper with Suspense
------------------------------*/
export default function SuccessPurchaseWrapper() {
  return (
    <Suspense fallback={<Loading message="Finalizing your purchase…" />}>
      <SuccessPurchaseContent />
    </Suspense>
  );
}
