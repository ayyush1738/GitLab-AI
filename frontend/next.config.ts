import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 🚀 GitGuardian AI Enterprise Configuration */
  
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
    // 🛡️ ANTI-GRAVITY FIX: Added fallback URL to prevent Vercel build crash when env is missing
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api-gitguardian.vercel.app';
    
    return [
      {
        source: '/api/proxy/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  reactStrictMode: true,
  
  env: {
    NEXT_PUBLIC_APP_REGION: 'IN-WEST-1',
  }
};

export default nextConfig;