'use client'

import { IS_DEMO_MODE } from '@/lib/supabase/client'

/**
 * H-5 · 데모 모드 안내 배너 (docs/audit-2026-07-05/04-security.md)
 * Supabase env 없이 구동 중일 때 화면 상단에 상시 표시 —
 * "백엔드 없는 빌드가 조용히 프로덕션인 척"하는 것을 막는 두 번째 방어선.
 * (첫 번째 방어선은 next.config.ts 의 프로덕션 빌드 하드실패 가드)
 */
export function DemoModeBanner() {
  if (!IS_DEMO_MODE) return null

  return (
    <div
      role="status"
      className="sticky top-0 z-[100] w-full bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900"
    >
      데모 모드로 실행 중이에요 — 로그인·저장·공유가 이 브라우저 안에서만 동작해요.
    </div>
  )
}
