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
  const [user, setUser] = useState<any>(null); // ⭐ FIXED TYPE ERROR

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
  }

  return (
    <>
      {/* Header */}
      <header className="bg-[#0f172a] text-white shadow-sm">
        <nav className="container mx-auto flex justify-between items-center px-6 py-4">
          
          {/* BRAND */}
          <h1 className="text-lg font-semibold">
            <Link href="/">Prosperity Hub</Link>
          </h1>

          {/* CLEAN TOP NAVIGATION */}
          <ul className="flex space-x-6 text-sm font-medium items-center">

            <li>
              <Link href="/" className="hover:text-blue-300 transition">
                Home
              </Link>
            </li>

            <li>
              <Link href="/services" className="hover:text-blue-300 transition">
                Services
              </Link>
            </li>

            <li>
              <Link href="/about" className="hover:text-blue-300 transition">
                About
              </Link>
            </li>

            <li>
              <Link href="/contact" className="hover:text-blue-300 transition">
                Contact
              </Link>
            </li>

            {/* DASHBOARD (ONLY WHEN LOGGED IN) */}
            {user && (
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-blue-300 transition font-semibold"
                >
                  Dashboard
                </Link>
              </li>
            )}

            {/* ADMIN */}
            <li>
              <Link href="/admin" className="hover:text-blue-300 transition">
                Admin
              </Link>
            </li>

            <li>
              <Link href="/terms" className="hover:text-blue-300 transition">
                Terms
              </Link>
            </li>

            <li>
              <Link href="/privacy" className="hover:text-blue-300 transition">
                Privacy
              </Link>
            </li>

            {/* AUTH BUTTON */}
            {user ? (
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  Sign Out
                </button>
              </li>
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
        </nav>
      </header>

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
