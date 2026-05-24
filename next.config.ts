import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/covers/**",
      },
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/data/**",
      },
      {
        protocol: "https",
        hostname: "uploads.mangadex.org",
        pathname: "/data-saver/**",
      },
      {
        protocol: "https",
        hostname: "**.mangadex.network",
      },
    ],
  },
}

export default nextConfig
