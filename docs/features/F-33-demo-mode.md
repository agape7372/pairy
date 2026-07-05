# F-33 데모모드(IS_DEMO_MODE)   [real]

**WHAT**: Supabase 미설정 시 전체 앱을 localStorage 기반으로 강등하는 폴백 스위치. `src/lib/supabase/client.ts`(45줄).

**현재상태**: 실동작(FACT, H-5). 9행 `export const IS_DEMO_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY` — 환경변수(`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`) 존재 여부만으로 결정되는 단일 부울. 11-13행대 `isSupabaseConfigured()`는 `!IS_DEMO_MODE`. **20행대 `console.warn('[Pairy] 데모 모드로 실행 중입니다. Supabase 기능이 비활성화됩니다.')`가 유일한 신호** — 빌드를 막지 않고, UI에 배너도 없음. 19-22행대 데모모드 시 `createClient()`가 null 반환.

**스펙정합**: 데모모드 자체(GitHub Pages 백엔드 없이 정적 호스팅)는 CLAUDE.md에 명문화된 의도된 설계. 문제는 "실수로 프로덕션 env가 누락됐을 때"의 안전장치 부재.

**문제·리스크**: **H-5(High)** — 빌드 시 env 오설정(오타·누락) 한 번으로 **프로덕션 전체가 조용히 데모모드로 강등** — 좋아요/댓글/구매 등 전 기능이 비영속(새로고침 시 소실)되나 사용자는 console.warn을 볼 수 없으므로 인지 불가. 감사 §5 H-5로 명시된 확정 리스크.

**Fable판정**: **수정 — 빌드 하드실패+배너**. 개발 편의를 위한 데모모드 자체는 유지, 다만 "프로덕션 빌드에서 의도치 않게 데모모드로 떨어지는 것"을 하드 실패로 전환.

**다음작업**:
1. 빌드 스크립트(`npm run build`)에 프로덕션 환경(예: `NODE_ENV=production` 또는 별도 플래그)에서 `IS_DEMO_MODE`가 true면 빌드를 실패시키는 가드 추가 — AC: env 누락 상태로 프로덕션 빌드 시도 시 명시적 에러로 중단(조용한 배포 방지). (Sonnet)
2. 데모모드가 의도된 경우(로컬 개발·GitHub Pages 데모)를 위해 UI 최상단에 "데모 모드로 실행 중 — 데이터가 저장되지 않습니다" 배너 추가 — AC: `IS_DEMO_MODE=true`일 때 모든 페이지에 배너 노출. (Sonnet)

**의존·순서**: 독립적으로 즉시 진행 가능. F-25(정산 대시보드)의 "데모 데이터입니다" 배너와 통합 구현 가능(동일 배너 컴포넌트 재사용).
