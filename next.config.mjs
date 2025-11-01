/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Enable strict mode for React
  reactStrictMode: true,

  // ✅ Image optimization domains
  images: {
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'cdn.pixabay.com',
    ],
  },

  // ✅ Experimental optimizations for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // ✅ Environment variables for runtime
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://prosperityhub.app',
    NEXT_PUBLIC_PRODUCTION_URL: 'https://prosperityhub.app',
    NEXT_PUBLIC_SITE_NAME: 'Prosperity Hub',
  },

  // ✅ Output settings (optional, improves Vercel deployment)
  output: 'standalone',
};

export default nextConfig;
