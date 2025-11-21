// @ts-nocheck
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red-50 to-red-100 text-center p-6">
      {/* Animated X Icon */}
      <motion.div
        initial={{ scale: 0, rotate: 45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 10 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="text-3xl sm:text-4xl font-extrabold text-red-700 mb-2"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        Payment Canceled ❌
      </motion.h1>

      {/* Subtext */}
      <motion.p
        className="text-gray-700 mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        Your transaction was canceled or not completed.  
        Don’t worry — no charges were made to your account.  
        You can return to <span className="font-semibold text-red-700">ProsperityHub</span> anytime to try again.
      </motion.p>

      {/* Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <Link
          href="/"
          className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors"
        >
          Back to Marketplace
        </Link>
      </motion.div>

      {/* Footer */}
      <footer className="mt-10 text-sm text-gray-500">
        © {new Date().getFullYear()} ProsperityHub. All rights reserved.
      </footer>
    </div>
  );
}
