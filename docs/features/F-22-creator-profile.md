# F-22 크리에이터 프로필   [demo]

**WHAT**: 크리에이터 개인 채널 페이지. `src/app/(main)/creator/[username]/page.tsx`(24줄).

**현재상태**: demo(FACT). `generateStaticParams()`(3-14행)가 정확히 8개 데모 유저네임만 하드코딩 반환: `strawberry123, fairy_art, moonlight, mintchoco, roseberry, skyblue, cherryblossom, coconut`. 정적 export이므로 이 8개 외 실 유저의 프로필 URL은 전부 GitHub Pages에서 404.

**스펙정합**: 04-page-layouts.md의 크리에이터 채널 스펙과 페이지 자체 레이아웃은 일치. 동적 라우팅 불가는 정적 export 아키텍처의 구조적 제약(F-15/F-23과 동일 근본 원인).

**문제·리스크**: **High(공유 리스크)** — 실 크리에이터가 자기 프로필 링크를 트위터 등에 공유해도 열리지 않음(감사 §1 UGC 라우트 붕괴의 한 사례, 바이럴·유입 구조적 차단).

**Fable판정**: **수정 — 동적라우트**. 재설계 아닌 라우팅 방식 전환 문제.

**다음작업**:
1. 정적 export 결별(Tier 0 #4) 결정 이후, `generateStaticParams`를 실 유저 목록 기반 동적 생성 또는 클라이언트 사이드 라우팅(SPA catch-all)으로 전환 — AC: 임의 실 유저네임으로 프로필 접근 시 404 아님. (Sonnet)

**의존·순서**: **선행조건**: 정적 export 결별 결정(TOP50 #4) — 그 전엔 8개 데모 계정 외 접근 불가 상태 유지가 불가피. F-15(templates/[id])·F-23(share/[shareId])과 동일 카테고리 작업이므로 한 번에 일괄 처리 권장.
