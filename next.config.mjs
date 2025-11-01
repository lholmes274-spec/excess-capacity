/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Redirect all .vercel.app URLs and www. to prosperityhub.app
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(.*)vercel\\.app',
          },
        ],
        destination: 'https://prosperityhub.app/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www\\.prosperityhub\\.app',
          },
        ],
        destination: 'https://prosperityhub.app/:path*',
        permanent: true,
      },
    ];
  },

  // ✅ Image domains for your listings and assets
  images: {
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'cdn.pixabay.com',
    ],
  },

  // ✅ Experimental Next.js optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // ✅ Optional environment variable (for canonical URLs)
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://prosperityhub.app',
  },
};

export default nextConfig;
