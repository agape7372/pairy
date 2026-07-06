# F-16b 자료 업로드(resources/new)   [stub(쓰기 전용)] — 현재 브랜치 feat/resource-upload

**WHAT**: 크리에이터가 브러시/폰트 등 "자료"를 게시하는 신규 기능(이 브랜치의 주 작업물). 페이지 `src/app/(main)/resources/new/page.tsx`, 저장 유틸 `src/lib/utils/resourceStorage.ts`(155줄).

**현재상태**: stub(FACT, 쓰기 전용). page.tsx:158에서 `handleSubmit()`이 `saveResourcePost({...})`를 호출 — **데모/실 Supabase 분기가 아예 없음, 항상 localStorage에만 저장**(`IS_DEMO_MODE` 체크 자체가 없다는 점이 F-16a와의 차이 — F-16a는 최소한 분기라도 있음). `resourceStorage.ts`:101에 정의된 `getResourcePosts()`(저장된 자료를 읽어오는 함수)는 **저장소 전체에서 호출처가 0건**(grep 확인) — 즉 자료를 저장하는 쓰기 경로는 있으나 읽어서 보여주는 화면이 어디에도 없음. `src/app/(main)/resources/page.tsx`나 `resources/[id]/page.tsx` 같은 목록/상세 페이지 자체가 **존재하지 않음**(파일 없음, `.next`/`out` 빌드 산출물에도 `new/` 경로만 존재).

**스펙정합**: 이 기능은 신규(문서화된 스펙 없음, 이번 브랜치의 신규 카테고리 확장 작업). 최소 기대치("업로드하면 어딘가에 보여야 함")조차 미충족.

**문제·리스크**: **Critical(구조적)** — 사용자가 자료를 업로드해도 성공 토스트는 뜨지만 **그 자료를 확인할 방법이 세상에 존재하지 않음**(목록 페이지 자체가 없음). F-16a(가짜 성공 토스트)보다 한 단계 더 근본적 결함 — 여긴 "거짓 성공"이 아니라 "성공은 진짜(localStorage 저장은 됨)이나 결과물을 볼 UI가 없음". 이 브랜치(`feat/resource-upload`)가 미완성 상태로 남아있다는 강한 신호.

**Fable판정**: **수정 최우선** — 이 기능 클러스터 C 중 가장 심각. 읽기 경로(자료 목록/상세)를 먼저 만드는 게 순서상 맞다(쓰기는 이미 있으니). 백엔드(Supabase 테이블) 연결은 그 다음.

**다음작업**:
1. **(최우선)** `/resources` 목록 페이지 신설 — `getResourcePosts()`를 호출해 localStorage에 저장된 자료를 렌더 — AC: `/resources/new`에서 업로드한 자료가 `/resources`에서 즉시 보임(로컬 확인 수준). (Sonnet)
2. `/resources/[id]` 상세 페이지 신설(정적 export 하에서는 데모 ID만 우선, 동적 라우트는 Tier 0 종속). (Sonnet)
3. Supabase `resource_posts`(가칭) 테이블·RLS 스키마 신설 — F-17 characters 테이블 신설과 유사 작업, 함께 진행 시 효율적. localStorage 쓰기를 실 Supabase insert로 교체(demo/real 분기 추가). (Sonnet)

**의존·순서**: 1번(목록 페이지)은 백엔드 없이 localStorage 그대로 읽어도 즉시 가능 — **가장 먼저, 독립적으로 착수**. 2·3번은 F-15/F-16a와 유사 패턴(Supabase insert+RLS)이므로 그쪽 작업과 함께 스키마 설계 공유 검토.
