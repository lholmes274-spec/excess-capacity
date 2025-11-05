// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Prosperity Hub",
  description:
    "Discover and rent workspaces, parking, storage, and more across the U.S.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* ——— Header ——— */}
        <header className="bg-[#0f172a] text-white shadow-sm">
          <nav className="container mx-auto flex justify-between items-center px-6 py-4">
            <h1 className="text-lg font-semibold">Prosperity Hub</h1>
            <ul className="flex space-x-6 text-sm font-medium">
              <li>
                <a href="/" className="hover:text-blue-300 transition">
                  Home
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
            </ul>
          </nav>
        </header>

        {/* ——— Page Content ——— */}
        <main className="container mx-auto px-6 py-8">{children}</main>

        {/* ——— Global Footer (Same on all pages) ——— */}
        <footer className="bg-[#0f172a] text-gray-300 text-center py-6 mt-10">
          <p className="text-sm">
            © {new Date().getFullYear()} ProsperityHub.app. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
