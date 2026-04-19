import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/db/:path*',
        destination: 'http://localhost:3100/:path*',
      },
    ];
  },
};

export default nextConfig;
