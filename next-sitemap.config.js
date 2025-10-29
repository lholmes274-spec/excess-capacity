/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // Your live site URL (no trailing slash)
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://prosperityhub.app',

  // Create robots.txt too
  generateRobotsTxt: true,

  // (Optional) exclude private routes
  exclude: ['/admin', '/api/*'],

  // (Optional) tweak priorities & changefreq
  transform: async (config, path) => {
    // Default values
    const base = {
      loc: path,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    };

    // Make your homepage a bit higher priority
    if (path === '/') return { ...base, priority: 1.0, changefreq: 'daily' };

    return base;
  },
};
