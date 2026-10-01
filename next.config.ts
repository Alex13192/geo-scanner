import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // 确保静态路由下的页面跳转正常
  images: {
    unoptimized: true, // 防止静态托管下图片优化报错
  },
};

export default nextConfig;