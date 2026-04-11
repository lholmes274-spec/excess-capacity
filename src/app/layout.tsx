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
      <head>
        {/* Facebook App ID */}
        <meta property="fb:app_id" content="2963411410513274" />

        {/* 🔥 Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-P7HCLHN5');
            `,
          }}
        />
        {/* End Google Tag Manager */}

        {/* ✅ Google Tag (Ads + GA4 shared loader) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17728116849"
        ></script>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              // Google Analytics 4
              gtag('config', 'G-9BJEGLTDSK', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>

      <body className={`${inter.className} bg-gray-50 text-gray-900 overflow-x-hidden`}>
        
        {/* 🔥 Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P7HCLHN5"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}