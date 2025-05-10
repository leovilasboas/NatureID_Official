/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    domains: ['pixabay.com'],
  },
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
    INATURALIST_API_TOKEN: process.env.INATURALIST_API_TOKEN || '',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // PWA settings would go here with next-pwa in a real implementation
};

module.exports = nextConfig;
