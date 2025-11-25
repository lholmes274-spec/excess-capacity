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
  const [authLoading, setAuthLoading] = useState(true); // ✅ Prevent flicker on navigation
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
      setAuthLoading(false); // ⭐ Only render layout AFTER auth loads
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    setMenuOpen(false);
  }

  // 🚫 Prevent layout from flashing on page transitions
  if (authLoading) return null;

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#0f172a] text-white shadow-sm">
        <nav className="container mx-auto flex justify-between items-center px-6 py-4">

          {/* BRAND LOGO */}
          <Link href="/" className="flex items-center">
            <img
              src="/prosperity-logo.png"
              alt="Prosperity Hub Logo"
              className="w-10 h-10 rounded-lg object-cover"
            />
          </Link>

          {/* DESKTOP NAV */}
          <ul className="hidden md:flex space-x-6 text-sm font-medium items-center">
            <li><Link href="/" className="hover:text-blue-300">Home</Link></li>
            <li><Link href="/services" className="hover:text-blue-300">Services</Link></li>
            <li><Link href="/about" className="hover:text-blue-300">About</Link></li>
            <li><Link href="/contact" className="hover:text-blue-300">Contact</Link></li>

            {user && (
              <li>
                <Link href="/dashboard" className="hover:text-blue-300 font-semibold">
                  Dashboard
                </Link>
              </li>
            )}

            <li><Link href="/terms" className="hover:text-blue-300">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-blue-300">Privacy</Link></li>

            {user ? (
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Sign Out
                </button>
              </li>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Login
                </Link>
              </li>
            )}
          </ul>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden text-3xl"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
        </nav>
      </header>

      {/* FULL-SCREEN MOBILE MENU */}
      {menuOpen && (
        <div className="fixed inset-0 bg-[#0f172a] bg-opacity-95 z-50 flex flex-col p-8 text-white animate-[fadeDown_0.3s]">

          {/* CLOSE BUTTON */}
          <button
            className="text-4xl self-end mb-10"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>

          {/* MENU LINKS */}
          <nav className="flex flex-col space-y-6 text-2xl font-medium">

            <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/services" onClick={() => setMenuOpen(false)}>Services</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>

            {user && (
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="font-semibold"
              >
                Dashboard
              </Link>
            )}

            <Link href="/terms" onClick={() => setMenuOpen(false)}>Terms</Link>
            <Link href="/privacy" onClick={() => setMenuOpen(false)}>Privacy</Link>

            {user ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 px-4 py-2 rounded-lg mt-4 text-left w-fit"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg mt-4 w-fit"
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* MAIN */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0f172a] text-gray-300 text-center py-6 mt-10">
        <p className="text-sm">
          © {new Date().getFullYear()} ProsperityHub.app. All rights reserved.
        </p>
      </footer>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
