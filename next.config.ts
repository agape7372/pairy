import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/pairy',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,

  // 성능 최적화
  compiler: {
    // React displayName 제거 (프로덕션)
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // 실험적 기능
  experimental: {
    // 패키지 최적화 (lucide-react 트리쉐이킹)
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default withBundleAnalyzer(nextConfig);
