# F-03 텍스트편집(스타일/효과/폰트)   [real]

**WHAT**: 텍스트 슬롯 스타일링(폰트/크기/색/효과) 편집. 폰트 선택 UI는 `src/components/editor/text/FontSelector.tsx`(586줄), 렌더링은 `TextFieldRenderer`(F-01 소속), 폰트 타입 정의는 `src/types/font.ts`.

**현재상태**: 실동작(FACT, 감사의 "폰트 자산 0" 주장은 과장으로 정정됨). `src/app/(main)/layout.tsx`:77-82가 Google Fonts CDN에서 4종(나눔고딕·나눔명조·Jua·Gaegu) `<link>` 로드. FontSelector.tsx는 `FontService`(38행)와 `types/font.ts`의 `ALL_FONTS` 배열 사용, 최근 사용 폰트를 localStorage(`pairy_recent_fonts_v1`, 75행)에 저장.

**스펙정합**: 05-tech-stack.md 텍스트 편집 요구사항과 일치. 단, 폰트 소싱 방식(Google Fonts 런타임 CDN)은 미문서화 — self-host 여부 결정 없음.

**문제·리스크**: (1) Google Fonts 런타임 의존 — 오프라인/CSP 엄격화/개인정보(사용자 IP가 구글로 전송) 이슈(Medium). (2) 폰트 팩 4종은 상용 디자인툴 대비 협소(Low-Medium, 경쟁력 이슈이지 버그 아님). (3) UI 크롬 폰트(`--font-sans` 시스템 스택)와 에디터 폰트(Google Fonts 4종)가 이원화 — 아키텍처 정합성 이슈.

**Fable판정**: **존치** — 기능 정상. self-host 전환은 TOP50 Tier 1 항목(14번)으로 이미 우선순위화됨.

**다음작업**:
1. Google Fonts 4종을 self-host(woff2 번들+`next/font/local` or 로컬 `@font-face`)로 전환 — AC: 빌드 후 네트워크 탭에 fonts.googleapis.com 요청 0건, CSP `unsafe-eval` 완화와 별개로 진행 가능. (Sonnet)
2. 폰트 팩 확대(카테고리별 최소 2-3종 추가) — AC: FontSelector 카테고리 필터에 신규 폰트 노출·선택·렌더링 확인. (Sonnet)

**의존·순서**: 독립적으로 진행 가능. CSP `script-src unsafe-eval` 제거(TOP50 #19)와 함께 처리하면 CSP `connect-src`에서 fonts.googleapis.com 제거도 동시 정리 가능.
