import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // MangaDex
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
      // MangaFire (posters + páginas)
      {
        protocol: "https",
        hostname: "mangafire.to",
      },
      {
        protocol: "https",
        hostname: "**.mangafire.to",
      },
      // MangaStop (covers + origin CDN)
      {
        protocol: "https",
        hostname: "mangastop.net",
      },
      {
        protocol: "https",
        hostname: "**.mangastop.net",
      },
      {
        protocol: "https",
        hostname: "comick.jeffersondev.xyz",
      },
      // LeituraManga
      {
        protocol: "https",
        hostname: "leituramanga.net",
      },
      {
        protocol: "https",
        hostname: "**.leituramanga.net",
      },
      // QueroLer
      {
        protocol: "https",
        hostname: "queroler.com",
      },
      // NexusToons
      {
        protocol: "https",
        hostname: "img.nx-toons.xyz",
      },
      {
        protocol: "https",
        hostname: "cdn.nexustoons.com",
      },
    ],
  },
}

export default nextConfig
