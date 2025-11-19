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

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        setUser(null);
      } else {
        setUser(data.session.user);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ⭐ GOOGLE ADS CONVERSION EVENT ⭐
  const trackPostListingClick = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "post_listing_click", {
        send_to: "AW-17728116849",
      });
    }
  };

  const goToAddListing = () => {
    trackPostListingClick();
    router.push("/add-listing");
  };

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
              <a href="/terms" className="hover:text-blue-300 transition">
                Terms
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:text-blue-300 transition">
                Privacy
              </a>
            </li>

            {/* ⭐ NEW: Post a Listing Button ⭐ */}
            <li>
              <button
                onClick={goToAddListing}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Post a Listing
              </button>
            </li>

            {/* Auth Buttons */}
            {user ? (
              <>
                <li>
                  <a
                    href="/subscribe"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Subscribe
                  </a>
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
              <>
                <li>
                  <a
                    href="/login"
                    className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Login
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
