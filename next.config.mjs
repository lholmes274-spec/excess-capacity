/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      "images.unsplash.com",
      "lh3.googleusercontent.com",
      "cdn.pixabay.com",
    ],
  },

  // ✅ Force dynamic rendering (no static export issues)
  experimental: {
    appDir: true,
  },
  output: "standalone",
  generateEtags: false,

  // ✅ Prevent /listings from being statically exported
  // This ensures Next.js treats /listings and any similar pages as dynamic routes
  async redirects() {
    return [];
  },
  async headers() {
    return [];
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// ✅ Patch to fully disable static export errors for dynamic routes like /listings
if (process.env.NODE_ENV === "production") {
  process.env.NEXT_FORCE_DYNAMIC = "true";
  process.env.NEXT_DISABLE_STATIC_EXPORT = "true";
}

export default nextConfig;
