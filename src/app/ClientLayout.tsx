"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // ✅ Watch for Supabase auth state changes
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✅ Handle logout
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Header */}
      <header className="bg-[#0f172a] text-white shadow-sm">
        <nav className="container mx-auto flex justify-between items-center px-6 py-4">
          <h1 className="text-lg font-semibold">
            <a href="/">Prosperity Hub</a>
          </h1>
          <ul className="flex space-x-6 text-sm font-medium items-center">
            <li>
              <a href="/" className="hover:text-blue-300 transition">
                Home
              </a>
            </li>
            <li>
              <a href="/services" className="hover:text-blue-300 transition">
                Services
              </a>
            </li>
            <li>
              <a href="/about" className="hover:text-blue-300 transition">
                About
              </a>
            </li>
            <li>
              <a href="/contact" className="hover:text-blue-300 transition">
                Contact
              </a>
            </li>
            <li>
              <a href="/admin" className="hover:text-blue-300 transition">
                Admin
              </a>
            </li>
            <li>
              <a href="/terms" className="hover:text-blue-300 transition">
                Terms
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-blue-300 transition">
                Privacy
              </a>
            </li>

            {/* ✅ Auth Buttons */}
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
              <>
                <li>
                  <a
                    href="/login"
                    className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Login
                  </a>
                </li>
                <li>
                  <a
                    href="/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Join Free
                  </a>
                </li>
              </>
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
