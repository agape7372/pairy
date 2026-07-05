# F-15 템플릿 아카이브(목록/검색/상세)   [demo(정적/샘플)]

**WHAT**: 페어틀(템플릿) 목록·검색·상세 조회. 실동작 훅 `src/hooks/useTemplates.ts`(171줄, 이미 완성돼 있으나 미사용)와 실제 렌더링 페이지 `src/app/(main)/templates/page.tsx`(827줄).

**현재상태**: demo(FACT). templates/page.tsx:52에서 하드코딩된 `sampleResources` 배열을 정의하고, :344의 `filteredResources`가 이 샘플 배열만 필터링 — `useTemplates()` 훅은 단 한 번도 호출되지 않음(죽은 데이터 경로). useTemplates.ts:37에 정상 export, :52에 `useCallback` 안정화까지 돼 있는 "완성됐지만 미배선" 사례.

**스펙정합**: 06-database-schema.md의 templates 테이블 및 07-api-design.md 조회 API와 useTemplates 훅 자체는 정합. 이탈은 "훅이 있는데 페이지가 안 씀"이라는 배선 문제.

**문제·리스크**: 감사 §M-2와 동일 계열 결함 — 실 업로드 템플릿이 목록에 절대 나타나지 않음(사용자가 만든 콘텐츠가 보이지 않는 신뢰 문제, High). 정적 export의 `generateStaticParams`가 데모 템플릿(1~8)만 사전생성 — 동적 라우트 결별 전까지는 useTemplates 연결해도 상세 페이지(`templates/[id]`)는 여전히 실 ID로 404.

**Fable판정**: **수정** — 최소한 목록 페이지의 데이터 소스를 sampleResources→useTemplates()로 교체(런타임 결별과 독립적으로 가능한 부분). 동적 상세 라우트는 Tier 0 종속.

**다음작업**:
1. templates/page.tsx:52의 `sampleResources` 사용을 제거하고 `useTemplates()` 훅으로 교체 — AC: Supabase에 신규 템플릿 insert 시 목록에 즉시 반영(수동 새로고침 후). (Sonnet)
2. `templates/[id]/page.tsx`의 `generateStaticParams` 동적 전환 — **Tier 0 런타임 결별 결정 후** 착수. (Opus, 종속)

**의존·순서**: 1번은 독립적으로 즉시 가능(저비용 고가치, 메타 발견의 "완성-미배선" 우선순위 원칙 적용 대상). 2번은 정적 export 결별(TOP50 #4) 선행 필요.
