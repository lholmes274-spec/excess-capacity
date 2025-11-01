/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async redirects() {
    return [
      // ✅ Redirect all .vercel.app requests to prosperityhub.app
      {
        source: '/:path*',
        destination: 'https://prosperityhub.app/:path*',
        has: [
          {
            type: 'host',
            value: 'excess-capacity-git-main-lholmes274-specs-projects.vercel.app',
          },
        ],
        permanent: true,
      },
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.prosperityhub.app',
          },
        ],
        destination: 'https://prosperityhub.app/:path*',
        permanent: true,
      },
    ];
  },

  images: {
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'cdn.pixabay.com',
    ],
  },

  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  env: {
    NEXT_PUBLIC_SITE_URL: 'https://prosperityhub.app',
  },
};

export default nextConfig;
