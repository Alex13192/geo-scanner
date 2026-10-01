import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 必须移除 output: 'export'，否则动态 API 无法在 Cloudflare 上编译
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;