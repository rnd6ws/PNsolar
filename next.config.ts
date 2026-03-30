import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  headers: async () => [
    {
      source: '/sw.js',
      headers: [
        { key: 'Content-Type', value: 'application/javascript' },
        { key: 'Service-Worker-Allowed', value: '/' },
        { key: 'Cache-Control', value: 'no-cache' },
      ],
    },
  ],
};

export default nextConfig;
