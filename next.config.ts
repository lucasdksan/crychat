import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.vteximg.com.br" },
      { protocol: "https", hostname: "**.vtexassets.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
