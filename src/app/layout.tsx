import "./globals.css";
import { Inter } from "next/font/google";
import { Metadata } from "next";
import Head from "next/head"; // ✅ Import Head for manual meta injection

const inter = Inter({ subsets: ["latin"] });

// ✅ SEO & Social Metadata
export const metadata: Metadata = {
  title: "Prosperity Hub",
  description:
    "Discover and rent workspaces, parking, storage, and more across the U.S.",
  openGraph: {
    title: "Prosperity Hub | Dynamic Excess Capacity Sharing Platform",
    description:
      "Manage and explore listings that unlock hidden potential — from storage and parking to tools and workspace sharing.",
    url: "https://prosperityhub.app",
    siteName: "ProsperityHub.app",
    images: [
      {
        url: "https://prosperityhub.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Prosperity Hub platform preview",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prosperity Hub",
    description:
      "Discover and rent workspaces, parking, storage, and more across the U.S.",
    images: ["https://prosperityhub.app/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* ✅ This guarantees the tag renders for crawlers */}
      <Head>
        <meta property="fb:app_id" content="2963411410513274" />
      </Head>

      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* Header */}
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

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">{children}</main>

        {/* Footer */}
        <footer className="bg-[#0f172a] text-gray-300 text-center py-6 mt-10">
          <p className="text-sm">
            © {new Date().getFullYear()} ProsperityHub.app. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
