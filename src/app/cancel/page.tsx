"use client";
import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-center p-6">
      <h1 className="text-3xl font-bold text-red-700 mb-4">
        ❌ Payment Cancelled
      </h1>
      <p className="text-gray-600 mb-6">
        Your payment was cancelled. You can try again anytime.
      </p>
      <Link
        href="/"
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md"
      >
        Back to Marketplace
      </Link>
    </main>
  );
}
