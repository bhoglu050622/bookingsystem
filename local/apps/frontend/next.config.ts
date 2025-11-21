import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "www.expertisoracademy.in",
      },
      {
        protocol: "https",
        hostname: "cdn.booking-platform.example.com",
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  reactCompiler: false,
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
