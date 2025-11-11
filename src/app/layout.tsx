import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import ClientLayout from "./ClientLayout";

const inter = Inter({ subsets: ["latin"] });

// ✅ SEO & Social Metadata (Server-safe)
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
      {/* ✅ Static metadata and social tags */}
      <head>
        <meta property="fb:app_id" content="2963411410513274" />
      </head>

      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* ✅ Wrap all pages in ClientLayout */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
