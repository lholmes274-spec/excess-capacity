"use client";
import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-gray-900 text-gray-300 py-6 mt-10 text-center text-sm border-t border-gray-700">
      <div className="container mx-auto px-4">
        <p>
          © {year} <span className="font-semibold text-white">Prosperity Hub</span>. 
          All rights reserved.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          Operated by Prosperity Voyage Living Trust.
        </p>
        <p className="mt-2 text-gray-400 hover:text-white transition">
          <a href="/terms">Terms of Service</a> • <a href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </footer>
  );
}

