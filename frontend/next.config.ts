import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 🚀 SafeConfig AI Enterprise Configuration */
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'gitlab.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },

  reactStrictMode: true,
  // 🗑️ swcMinify: true, // REMOVED: This is now the default behavior!
  
  env: {
    NEXT_PUBLIC_APP_REGION: 'IN-WEST-1',
  }
};

export default nextConfig;