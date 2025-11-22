"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    setMobileMenuOpen(false);
  }

  return (
    <>
      {/* Header */}
      <header className="bg-[#0f172a] text-white shadow-sm">
        <nav className="container mx-auto flex justify-between items-center px-6 py-4">
          {/* Logo */}
          <h1 className="text-lg font-semibold">
            <Link href="/">Prosperity Hub</Link>
          </h1>

          {/* Desktop Menu */}
          <ul className="hidden md:flex space-x-6 text-sm font-medium items-center">
            <li>
              <Link className="hover:text-blue-300 transition" href="/">
                Home
              </Link>
            </li>

            <li>
              <Link className="hover:text-blue-300 transition" href="/services">
                Services
              </Link>
            </li>

            <li>
              <Link className="hover:text-blue-300 transition" href="/about">
                About
              </Link>
            </li>

            <li>
              <Link className="hover:text-blue-300 transition" href="/contact">
                Contact
              </Link>
            </li>

            {user && (
              <>
                <li>
                  <Link
                    className="hover:text-blue-300 transition font-semibold"
                    href="/add-listing"
                  >
                    Add Listing
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-blue-300 transition"
                    href="/my-bookings"
                  >
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link
                    className="hover:text-blue-300 transition"
                    href="/my-listings"
                  >
                    My Listings
                  </Link>
                </li>
              </>
            )}

            <li>
              <Link className="hover:text-blue-300 transition" href="/admin">
                Admin
              </Link>
            </li>

            <li>
              <Link className="hover:text-blue-300 transition" href="/terms">
                Terms
              </Link>
            </li>

            <li>
              <Link className="hover:text-blue-300 transition" href="/privacy">
                Privacy
              </Link>
            </li>

            {user ? (
              <>
                <li>
                  <Link
                    href="/subscribe"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Subscribe
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>

          {/* MOBILE HAMBURGER */}
          <button
            className="md:hidden focus:outline-none"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </nav>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50">
          {/* Background dim */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          ></div>

          {/* Slide-in panel */}
          <div className="absolute right-0 top-0 w-64 h-full bg-[#0f172a] text-white p-6 shadow-lg">
            {/* Close button */}
            <button
              className="mb-6"
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Mobile Menu Links */}
            <ul className="flex flex-col space-y-5 text-lg">
              <li>
                <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
              </li>

              <li>
                <Link href="/services" onClick={() => setMobileMenuOpen(false)}>
                  Services
                </Link>
              </li>

              <li>
                <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                  About
                </Link>
              </li>

              <li>
                <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                  Contact
                </Link>
              </li>

              {user && (
                <>
                  <li>
                    <Link
                      href="/add-listing"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Add Listing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/my-bookings"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/my-listings"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Listings
                    </Link>
                  </li>
                </>
              )}

              <li>
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
              </li>

              <li>
                <Link href="/terms" onClick={() => setMobileMenuOpen(false)}>
                  Terms
                </Link>
              </li>

              <li>
                <Link href="/privacy" onClick={() => setMobileMenuOpen(false)}>
                  Privacy
                </Link>
              </li>

              {user ? (
                <>
                  <li>
                    <Link
                      href="/subscribe"
                      onClick={() => setMobileMenuOpen(false)}
                      className="bg-blue-600 px-4 py-2 rounded-lg inline-block text-center"
                    >
                      Subscribe
                    </Link>
                  </li>

                  <li>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 px-4 py-2 rounded-lg w-full"
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg inline-block text-center"
                  >
                    Login
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="container mx-auto px-6 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-[#0f172a] text-gray-300 text-center py-6 mt-10">
        <p className="text-sm">
          © {new Date().getFullYear()} ProsperityHub.app. All rights reserved.
        </p>
      </footer>
    </>
  );
}
