import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// H-5 · 프로덕션 빌드 env 가드 (docs/audit-2026-07-05/04-security.md)
// Supabase env 누락 시 조용히 데모 모드로 빌드되는 것을 차단한다.
// 데모 빌드가 필요하면 NEXT_PUBLIC_ALLOW_DEMO_BUILD=1 로 명시적으로 허용.
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_ALLOW_DEMO_BUILD !== '1' &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
) {
  throw new Error(
    '[Pairy] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없어 프로덕션 빌드를 중단합니다. ' +
    '데모 빌드가 의도라면 NEXT_PUBLIC_ALLOW_DEMO_BUILD=1 을 설정하세요.'
  );
}

const nextConfig: NextConfig = {
  // Turbopack 비활성화 (한글 경로 버그 우회)
  bundlePagesRouterDependencies: true,
  // 2026-07-12 DL-0001: output:'export'·basePath:'/pairy'·trailingSlash 제거 — Vercel 서버 런타임 이전.
  // UGC 동적 라우트(share/collab/creator/templates)는 요청 시 렌더링된다.
  images: {
    // 이미지 최적화는 별도 결정으로 보류 — UGC 임의 도메인(remotePatterns 미확정) 리스크.
    unoptimized: true,
  },

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
