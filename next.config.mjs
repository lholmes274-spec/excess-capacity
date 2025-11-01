/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'cdn.pixabay.com',
    ],
  },

  // Keep default (no experimental block)
  eslint: {
    ignoreDuringBuilds: true, // ensures lint errors don’t stop builds
  },

  typescript: {
    ignoreBuildErrors: true, // ensures TS issues don’t stop builds
  },
};

export default nextConfig;
