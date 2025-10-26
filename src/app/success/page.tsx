"use client";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-green-50 text-center p-6">
      <h1 className="text-3xl font-bold text-green-700 mb-4">
        🎉 Payment Successful!
      </h1>
      <p className="text-gray-600 mb-6">
        Thank you for your purchase. Your booking has been confirmed.
      </p>
      <Link
        href="/"
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md"
      >
        Back to Marketplace
      </Link>
    </main>
  );
}
