// @ts-nocheck
"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function SuccessMembershipPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100 text-center p-6">

      {/* Animated Checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 10 }}
        className="mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </motion.div>

      <motion.h1
        className="text-3xl sm:text-4xl font-extrabold text-amber-700 mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        You're Now a PRO Member! 🎉
      </motion.h1>

      <motion.p
        className="text-gray-700 max-w-md mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Thank you for upgrading to ProsperityHub PRO.  
        You now have access to all premium features, enhanced tools, and priority support.
      </motion.p>

      <Link
        href="/"
        className="px-6 py-3 bg-amber-600 text-white rounded-lg shadow hover:bg-amber-700 transition"
      >
        Continue Exploring
      </Link>

      <footer className="mt-10 text-sm text-gray-500">
        © {new Date().getFullYear()} ProsperityHub. All rights reserved.
      </footer>
    </div>
  );
}
