# 3. 페어리 전체 감사(Audit)

> 출처: `polymorphic-greeting-gizmo.md` §3

## 3.1 Product — 정체성·차별성·시장성

- **정체성(FACT, 00-overview.md:9)**: 자캐러용 틀 아카이브 + 페어틀 에디터 + 실시간 협업. 타깃 매우 협소·명확: 트위터 자캐 커뮤러, 10대후반~30대초, ~80% 여성, 포토샵 접근성 낮음, 모바일 우선.
- **차별성(INFERENCE, 취약)**: (a) 경쟁 리서치 부실 — competitor-analysis.md는 경쟁사 1곳(CREPE, URL도 "추정")만 분석, "직접 경쟁자 없음" 주장 미검증. (b) 최대 차별점(실시간 협업)이 프로덕션서 미작동(§1). (c) 나머지 차별점은 색/톤 = 복제 쉬움, 해자 아님.
- **스코프 스프롤(FACT)**: 명시적 MVP 원칙 위반. 게이미피케이션·Duo 구독은 스펙 문서 부재 상태로 코드만 존재.

## 3.2 Frontend — 구조·상태·반응형·성능

(에이전트 검증, 파일:라인 근거 보유)

- **god-component 2개**: `CanvasEditor.tsx`(1530줄, 8~10개 관심사 혼재), `EditorSidebar.tsx`(1451줄). 700줄+ 파일 14개. 이미 `TemplateRenderer`(1187→259줄)·스토어 슬라이스 분해 선례가 있는데 이 둘엔 미적용.
- **성능 3대 결함**:
  1. **키입력·슬라이더 틱마다 `pushHistory()`** 무조건 호출(canvasEditorStore.ts 다수) + 디바운스 전무(EditorSidebar.tsx:737,786,802). 밝기 -100→100 드래그 시 ~100회 store set + JSON-diff 스냅샷 + 오프스크린 canvas 재도색. → 실사용 잭.
  2. **전역 스토어 통구독**(CanvasEditor.tsx:202-233, 셀렉터 미사용) + **6개 Konva 렌더러 전부 memo 없음** + 부모에서 인라인 클로저 prop 전달(TemplateRenderer.tsx:181-197). 무관 필드 변경에도 캔버스 전체 리렌더. (최적화 셀렉터가 정의돼 있으나 정작 미사용)
  3. **가상화 전무** — 템플릿 그리드/스티커팩/폰트 목록 전량 `.map()`.
- 기타: 배열 index를 key로(13파일, 가변 리스트 포함), render 중 `Math.random()`(useParticle/sparkles, `react-hooks/purity` 비활성), reduced-motion 구현 3종 불일치(2종 비반응, CanvasEditor.tsx:239는 결과 폐기), `console.log`로 **유저 이메일 프로덕션 출력**(useUser.ts), 죽은 데이터 경로(templates 페이지는 하드코딩 sampleResources 렌더, 완성된 `useTemplates()`는 미사용).
- **반응형**: `sm:` 310 / `md:` 67 / `lg:` 56 / `xl:` 7 / `2xl:` 0 — 모바일 편중, 대화면 미대응. 공용 `useMediaQuery` 훅 부재(window.innerWidth<768 인라인 반복).

## 3.3 Design·Animation

- 토큰: 딸기크림 핑크(#FFD9D9)·민트(#D7FAFA)·웜그레이 + 완전한 다크모드 반전. 커스텀 이징 6종·듀레이션 6종.
- **애니메이션 과잉(FACT)**: globals.css 2506줄, **43개 @keyframes**, doodle/premium **이중 애니메이션 문법**. reduced-motion·high-contrast는 CSS서 잘 처리(2414/2443행). 그러나 **border-radius를 무한 애니메이트하는 keyframe 4개**(blobMorph/liquidWave/borderWave/handDrawnWobble) = compositor 밖 속성 → 매 프레임 layout+paint. 섀도/라운드가 토큰 vs 하드코딩 이중 체계로 드리프트(Button.tsx는 rgba 하드코딩).
- **폰트(정정 — 앞선 "자산 0"은 과장)**: UI 크롬은 시스템 스택(`--font-sans`)이나, **에디터는 폰트 시스템 보유** — `types/font.ts`(FontSource `google`/`local`/`custom`), `layout.tsx:76-80`가 Google Fonts 4종(나눔고딕·나눔명조·Jua·Gaegu) 로드, `FontSelector.tsx`(586줄). 실약점은 "0"이 아니라 (a) **Google Fonts 런타임 의존**(오프라인·CSP·개인정보 우려 시 self-host 필요), (b) 폰트 팩 규모가 상용 디자인툴 대비 협소, (c) UI/에디터 폰트 이원화. → TOP50은 "도입"이 아니라 "**self-host 전환 + 팩 확대**".

## 3.4 Backend·Data

- **실 백엔드 존재(FACT)**: `supabase/schema.sql` + `supabase/migrations/`(RLS 정책·트리거 포함), 라이브 프로젝트 `cqmukwbwuzqgkpgogmby`, `database.types.ts`(819줄) 생성형 타입. `.env.local`의 URL+anon key 실존이나 git 미추적(안전). → "백엔드 없음"은 틀림. **문제는 부재가 아니라 (a) RLS 구멍, (b) 스키마 드리프트, (c) 백엔드 로직을 가장한 클라이언트 localStorage.**
- **스키마 드리프트(Critical, C-2)**: 앱 코드가 쓰는 `profiles.role` 컬럼이 커밋 스키마엔 부재 → 소스로 프로덕션 재현·감사 불가.
- anon key는 `NEXT_PUBLIC_`(설계상 공개). **유일 방어선 RLS가 C-1(WITH CHECK 없음)·H-1(SELECT USING true)로 뚫림**(§5).
- 정적 export의 진짜 한계: 서버 런타임 0 → 결제 웹훅·서버 이미지처리(Sharp)·요청시 접근제어 불가. Supabase 클라이언트 인증 자체는 정적 SPA서 동작하므로 "인증 불가"는 과장. 핵심은 **서버 신뢰경계 부재 → 결제·수익·권한이 전부 클라이언트 = 변조 가능**.

## 3.5 Ops·Tech Debt

- **CI 품질 게이트 없음(FACT)**: `.github/workflows/deploy.yml`은 build만 — 테스트·lint 미실행. main push 시 무검증 배포.
- 테스트 얇음: 유닛 ~13 + e2e 1(canvas-editor.spec.ts), 70k LOC 대비 낮음. jest-axe 등 a11y 테스트 없음.
- 5개 persist 스토어에 version/migrate 전무 → 스키마 변경 시 기존 유저 상태 침묵 파손.
- 버스팩터: 실질 1인(agape) + AI. 문서-코드 동기화 체계 2025-12-30 이후 중단.
