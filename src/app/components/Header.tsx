"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="w-full bg-gray-900 text-gray-100 shadow-md">
      <div className="container mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo / Brand */}
        <Link href="/" className="text-xl font-semibold tracking-wide hover:text-white">
          Prosperity Hub
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6 text-sm">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/admin" className="hover:text-white">Admin</Link>
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-200 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <nav className="md:hidden bg-gray-800 text-sm">
          <Link href="/" className="block px-6 py-3 border-b border-gray-700 hover:bg-gray-700">Home</Link>
          <Link href="/admin" className="block px-6 py-3 border-b border-gray-700 hover:bg-gray-700">Admin</Link>
          <Link href="/terms" className="block px-6 py-3 border-b border-gray-700 hover:bg-gray-700">Terms</Link>
          <Link href="/privacy" className="block px-6 py-3 hover:bg-gray-700">Privacy</Link>
        </nav>
      )}
    </header>
  );
}
