# 웹사이트 구조 적대적 검증 감사 (2026-07-18)

- **범위**: 사이트 구조 전체 · 모든 버튼/인터랙션 · 라이브 편집(캔버스 에디터) · 협업/공유
- **방법**: 멀티에이전트 라이브 감사 — 정적 탐색 3에이전트 → Playwright 실구동 5영역 병렬 → 발견별 적대적 반박 검증(refute) → 완결성 비평. 총 40에이전트, 발견 40건 중 **CONFIRMED 37 · REFUTED 2 · PLAUSIBLE 1**, 정상 확인 76건.
- **수정**: 확정 결함 중 11건 수정 + 수정본에 대한 2차 적대 리뷰(3렌즈)가 찾은 7건 추가 수정. 수정 후 라이브 재검증 **16/16 PASS** (픽셀 단위 증거).
- **한계**: Supabase env 없는 **데모 모드** 라이브 구동 — 실 백엔드 경로(RLS·결제)는 코드 정적 분석으로만 판정. 관련 커밋: `56bb395`…`566ece0` (PR #105).

---

## 1. 구조 총평

**아키텍처 골격은 건강하다.** Vercel SSR 전환(DL-0001)과 API 라우트(payments 3종)는 정합적이고, 결제 백엔드는 서버 강제 금액·멱등·CAS 가드·다운그레이드 전용 웹훅으로 클라이언트를 정확히 불신한다(감사 중 최고 품질 코드). 구독 C-3 가드(프로덕션 tier 자가승격 차단, `syncFromServer` 단일 진실)도 견고했다. 버튼 배선율도 이례적으로 높다 — 전 코드베이스에서 빈 핸들러/`href="#"`/`alert()`는 **0건**, 76개 인터랙션이 라이브 클릭으로 정상 확인됐다.

**그러나 세 개의 단층선이 있었다:**

1. **"게이팅 코드는 있는데 배선이 안 됨"** — 완비된 `ExportDialog`(워터마크·한도·잠금)는 렌더되지 않는 죽은 코드였고, 실제 내보내기는 게이팅 제로(C1). `incrementExports`의 한도 검사도 호출처가 없는 죽은 코드(C6). `LayerPanel`·`CollabPanel`·`PresenceBar`·`InviteModal`·`useShareWork.generateShareLink`도 동일 패턴의 미배선 부품. **패턴 진단: 부품을 만들고 배선을 확인하지 않는 개발 흐름이 반복되고 있다** — thinking-protocol의 "미배선부터 잇기"가 정확히 필요한 지점.
2. **에디터 상태 수명 관리의 구멍** — 히스토리 스냅샷이 상태의 부분집합만 보존(C2), blob URL 수명이 히스토리와 무관하게 관리(C3), persist 키가 템플릿 무스코핑(C8). 세 결함 모두 "스토어를 쪼개며(미들웨어 분리) 스냅샷 계약을 갱신하지 않은" 동일 뿌리.
3. **Static export 시대의 유령** — `/editor/[id]`의 하드코딩 매핑+폴백(A1), 불필요한 `generateStaticParams`, `?id=` 쿼리 우회. Vercel 전환은 됐지만 우회로가 청산되지 않아 실제 버그(작업물 ID 붕괴, 쿼리 유실)로 살아 있었다.

---

## 2. 발견 전체 목록

표기: ✅수정됨(이 PR) · 🔒보류(근거 있음) · 📋백로그(다음 사이클)

### Critical

| ID | 발견 | 판정 | 상태 |
|---|---|---|---|
| C1 | **내보내기 게이팅 전면 부재** — 무료 티어가 3x(2400×3000)를 워터마크 없이 무제한 내보내기, 사용량 미기록. 게이팅 완비된 `ExportDialog`는 미렌더 죽은 코드 | CONFIRMED (라이브: 3x 파일 실다운로드, usage 불변) | ✅ `exportPolicy.ts` 순수 함수로 이식: 무료 워터마크 강제·2x/3x Lock·월 5회 한도·`incrementExports()`. ExportDialog 삭제. 재검증: 워터마크 픽셀 확인·usage 0→1·한도 소진 시 차단·premium 전환 시 해제 모두 PASS |
| C3 | **이미지 undo 시 슬롯 파괴** — 교체 시 즉시 revoke된 blob URL을 히스토리가 복원 → `naturalWidth:0` 깨진 이미지 | CONFIRMED (red→blue→undo 픽셀 검증) | ✅ 즉시 revoke 제거(스토어+사이드바), 스냅샷 탈락/템플릿 전환 시 지연 revoke. 재검증: red 136,493픽셀 완전 복원 PASS |
| C5 | **협업 초대 루프 전면 붕괴** — '협업' 버튼이 세션을 어디에도 등록 안 함(`createSession` 미호출) → 발급된 초대 코드로 같은 브라우저에서도 참가 불가. 데모에선 Yjs 동기화도 미연결(C5-2), 상시 '연결 끊김' 배너(NEW-COLLAB-2) | CONFIRMED (2-브라우저/2-탭 실검증) | 🔒 서버 세션 레지스트리(`collab_sessions`+Realtime) 설계가 필요한 피처 — 별도 트랙. 단 참가 후 `/editor/undefined` 착지·쿼리 유실(NEW-COLLAB-1)은 리졸버 수정으로 부분 해소 ✅ |

### High

| ID | 발견 | 판정 | 상태 |
|---|---|---|---|
| C2 | **undo/redo 불완전** — 스냅샷이 formData/images/colors/slotTransforms만 보존. 텍스트 스타일·스티커 변경은 undo가 무관한 이전 변경을 되돌리는 collateral undo | CONFIRMED (스타일/스티커 각각 재현) | ✅ 스냅샷에 texts/stickers(참조 공유)·layerStates·캐릭터 상태 포함. 재검증: 스티커 추가→undo 소멸→redo 복원, 폰트 48→96→undo 원복(픽셀 3,016 정확 일치) PASS |
| C6 | **사용량 한도 미집행** — `exportsThisMonth=999` 조작해도 통과 (한도 검사 자체가 미호출) | CONFIRMED | ✅ C1 수정에 포함. 재검증: 5/5 소진 시 차단 PASS. 서버 강제는 F-28 이후(클라 게이팅임을 명시) |
| A1 | **`/editor/[id]` ID 붕괴** — 매핑 외 모든 id → couple-magazine 조용한 폴백, `?session=` 쿼리 유실. `/my/works`·`/my/purchases`·협업 참가 링크가 전부 오동작 | CONFIRMED (4개 URL 재현) | ✅ 3분류 리졸버(레거시/work UUID/템플릿)+쿼리 보존+`?work=` 서버 하이드레이션. 재검증: /editor/999→정직한 에러, 쿼리 보존 PASS |
| A3 | **홈 데드링크 8건** — 최근 업로드 카드 4개(`/templates/10~13`)·크리에이터 카드 4개가 목데이터 불일치로 전부 not-found | CONFIRMED (템플릿 절반은 프로덕션에서도 재현되는 구조) | 📋 데이터 시딩/콘텐츠 사안 — 홈 목데이터와 상세 목데이터 정합 또는 실데이터 배선 필요 |
| NEW-SHARE-1 | **공유 페이지 무한 404 루프** — `/og-default.png` 부재 + onError가 같은 src 재설정 → 초당 ~15회 무한 재요청, networkidle 영구 미도달 | CONFIRMED (60초에 720회) | ✅ og-default.png 실추가 + onError 재귀 가드. 재검증: 3초간 재요청 0건 PASS |
| NEW-detail-1 | **데모 북마크 완전 무동작** — `useBookmarks`에 데모 분기가 없어 null 클라이언트 `TypeError` | CONFIRMED | 📋 `useBookmarks`에 IS_DEMO_MODE 분기(demoStorage 패턴) 필요 — 같은 클래스의 훅 전수 점검 권장 |
| NEW-THEME-1 | **다크모드 반쪽 구현** — OS 다크면 `data-theme=dark` 자동 적용되는데 헤더·카드가 `bg-white` 하드코딩이라 깨진 혼합 UI + 라이트로 돌아갈 토글 UI 부재 | CONFIRMED | 📋 스킨 완성 전까지 system 자동 감지를 끄는 것이 안전(1줄) — 또는 토글 UI+스킨 일괄 작업 |
| NEW-WHISPER-1 | **위스퍼 무음 데이터 유실** — 보내기 모달이 성공처럼 닫히지만 페이지의 `onSend`가 입력을 버림(어디에도 저장 안 됨) | CONFIRMED | 📋 데모 localStorage 배선 또는 정직한 '준비 중' 안내 필요 |
| NEW-COLLAB-1 | 참가 성공해도 `/editor/undefined` 리다이렉트+쿼리 유실로 솔로 에디터 착지 | CONFIRMED | ✅ 리졸버가 쿼리 보존+`undefined` 방어. 세션 연결 자체는 C5에 종속 🔒 |

### Medium

| ID | 발견 | 판정 | 상태 |
|---|---|---|---|
| A2 | `/my/purchases` 고아 페이지 (어디서도 링크 안 됨) | CONFIRMED | ✅ my 탭+결제 성공 화면 배선. 단 데이터 소스가 데모 스토어(C-4 미완)임은 잔존 한계 |
| C8 | persist 전역 키 — 템플릿 간 formData 누출 창구이자 소비처 없는 죽은 무게 | CONFIRMED | ✅ v2 templateId 스코핑+일치 시 병합 |
| C2-레이어 | 레이어 패널 자체가 미마운트(죽은 코드) + 가시성 토글 히스토리 미기록 | CONFIRMED (재현은 불가 — UI 부재) | ✅ 히스토리 배선 완료. 패널 마운트 여부는 제품 판단 📋 |
| NEW-NAV-1 | 존재하지 않는 템플릿 진입 시 원시 JSON 파싱 에러 노출 | CONFIRMED | ✅ content-type 검사로 정직한 에러 |
| NEW-SHARE-2 | 공유 링크 '생산' 측 미배선 — `generateShareLink` 호출 UI 전무 | CONFIRMED | 📋 에디터/내 작업에서 공유 발급 UI 배선 |
| NEW-NOTIF-1 | 알림 도달 불가 — 데모 헤더는 로그아웃 취급(벨 미렌더), `/my/notifications` 404 링크 | CONFIRMED | 📋 헤더/my 인증 표현 불일치 해소 + 링크 대상 정리 |
| NEW-COLLAB-2 | 데모 협업 상시 '연결 끊김' 적색 배너 + 성공 불가능한 재연결 버튼 | CONFIRMED | 🔒 C5 트랙에서 데모 협업 UX 정직화와 함께 |
| NEW-사이드바-1 | 스티커 추가 시 사이드바가 스티커 탭에서 강제 이탈 | CONFIRMED | 📋 EditorSidebar 탭 effect의 deps 정리 |
| NEW-CRITIQUE-COVERAGE | 미검증 잔여 영역: 캐릭터 편집/삭제·/my/works·library·/resources 업로드·payments 콜백 직방문·소셜 컴포넌트·접근성 전수 | PLAUSIBLE | 📋 다음 감사 사이클 목록으로 |

### Low

| ID | 발견 | 판정 | 상태 |
|---|---|---|---|
| B1 | 데모에서 duo/creator 클릭 시 '준비 중' 안내가 아니라 즉시 티어 부여 (게놈상 동결 상품) | CONFIRMED | 📋 데모 체험 의도인지 제품 판단 필요 — 프로덕션 경로는 정상 동결 |
| B2 | 카카오 공유 클립보드 폴백은 정상 동작, 단 일부 경로 무피드백. `InviteModal`은 죽은 코드 | 부분 REFUTED (폴백 자체는 정직) | 📋 폴백 시 토스트 1줄 + 죽은 코드 정리 |
| B3 | 스티커 `isPremium={false}` 하드코딩 | CONFIRMED | ✅ `useIsPremium()` 배선. 재검증: premium 전환 시 50→500 슬롯 PASS |
| B4 | `isCurrentUser` 하드코딩 — 단 해당 컴포넌트 자체가 미마운트 죽은 코드 | CONFIRMED | 📋 삭제 대상 (실사용 ParticipantAvatars는 정상) |
| C7 | `nanoid` 팬텀 의존성 (package.json 부재, 호이스팅 의존) | CONFIRMED | ✅ 로컬 `randomId` 대체 |
| A5 | `/creators` coming-soon이 푸터 상시 노출. `/editor/new`는 스텁 아님(실 플로우) — 가설 절반 반박 | CONFIRMED/REFUTED | 📋 푸터 노출 여부 판단 |
| NEW-NAV-2·editor-entry-1 | framer-motion spring+3키프레임 uncaught error (에디터 진입마다) | CONFIRMED | ✅ tween 전환 |
| NEW-NAV-3 | CSP `frame-ancestors`를 meta로 전달 — 전 페이지에서 무시(클릭재킹 보호 무효)+콘솔 에러 | CONFIRMED | 📋 next.config `headers()`로 이동 (Vercel이므로 가능) |
| NEW-NAV-4 | Google Fonts 외부 CSS 의존 — 차단 환경에서 전 페이지 네트워크 에러 | CONFIRMED (환경성) | 📋 `next/font` 셀프호스팅 전환 |
| NEW-NAV-5 | `<title>` 'Pairy' 접미사 중복 + 다수 페이지 title 부재 | CONFIRMED | 📋 metadata 템플릿 정리 |
| NEW-editor-1 | `/canvas-editor/custom` ?id= 없이 진입 시 원시 에러 | CONFIRMED | ✅ NEW-NAV-1 수정으로 함께 해소 |
| NEW-BACK-1 | /templates 필터 상태 URL 미반영 — 뒤로가기 시 소실 | CONFIRMED | 📋 searchParams 동기화 |
| NEW-MODAL-1 | 위스퍼 컴포저 ESC 미지원 (타 모달과 불일치) | CONFIRMED | 📋 1줄 핸들러 |
| NEW-스타일패널-1 | `input[type=color]`에 rgba 주입 — 콘솔 경고+피커 미반영 | CONFIRMED | 📋 hex 변환 유틸 |
| NEW-COLLAB-3 | /collab 코드 형식 미검증+percent-encoding 원문 노출 (XSS는 안전 확인) | CONFIRMED | 📋 검증+decode |
| 부수 | UserStickerService가 blob fetch를 CSP에 막혀 스티커 보관함 영속화 실패 (재검증 중 발견, 이 PR과 무관한 기존 결함) | 관찰 | 📋 connect-src 또는 저장 방식 재검토 |

### 검증 스크립트가 낸 오탐 (기각된 것)
- **NEW-templates-1** (정렬 버튼 가로채임): JS 클릭으로는 정상 — 자동화 좌표 클릭 아티팩트로 판정, REFUTED.
- premium 2x 내보내기의 'Made with Pairy' 텍스트: 게이팅 워터마크 오탐 — 템플릿 디자인에 박힌 텍스트임을 소스 대조로 기각.

---

## 3. 수정에 대한 2차 적대 검증 (수정이 만든 버그)

수정 diff에 3렌즈(정합성/회귀/보안) 적대 리뷰를 돌려 **7건의 신규 결함을 수정 자체에서 발견·즉시 수정**했다 (`566ece0`):

1. **[high] 하이드레이션 경합**: 전역 스토어의 stale `templateConfig` 때문에 work 하이드레이션이 조기 발화 → `loadTemplate`이 서버 데이터를 덮어쓰고 이후 저장이 빈 데이터를 서버에 반영할 수 있는 데이터 유실 경로 → 마운트 로컬 `isTemplateLoaded` 신호로 순서 보장.
2. **[high] 거짓 저장**: 미검증 `?work=` UUID를 `savedWorkIdRef`에 선바인딩 → RLS가 0행을 거른 UPDATE를 성공 처리 → 거짓 '저장되었습니다'+autosave 삭제 → 하이드레이션 성공 시에만 바인딩 + `.select()` 행 수 검증.
3. **[medium] autosave 교차 오염**: 같은 템플릿의 '새 작업' autosave가 저장된 work 위에 복구 제안됨 → work 세션 복구 금지 + autosave 키 work 스코핑.
4. **[medium] 월 전환 영구 잠금**: `getRemainingExports`가 지난달 사용량으로 계산 → 사전 체크가 8월에도 차단 → 월 인지 계산으로 수정.
5. **[medium] '전체 초기화' 무력화**: persist 병합이 초기화 직후 편집값을 되살림 → `reset()` 선행.
6. **[low] 하이드레이션 blob 누수** → 버려지는 히스토리 revoke.
7. Gemini 봇 리뷰 4건도 반영(세그먼트 인코딩 — 단 'legacy 폴백' 제안은 A1 재발이라 기각·사유 회신, hydrate 기본값, 배열 비교 최적화, 셀렉터 정리).

**교훈**: 1차 수정의 통과 게이트(빌드·테스트·타입)는 이 7건을 하나도 잡지 못했다. 적대적 리뷰와 라이브 재구동이 실제로 값을 냈다.

---

## 4. 잘 만들어진 부분 (적대 검증을 통과한 것)

- **결제 백엔드** (`api/payments/*`): 서버 강제 금액·소유 검증·멱등키·`pending→paid` CAS·다운그레이드 전용 웹훅. 클라이언트 불신 원칙이 정확히 구현됨.
- **구독 C-3 가드**: 프로덕션에서 tier 변경 액션 전부 no-op, persist에서 subscription 제외, `syncFromServer` 단일 진실.
- **버튼 배선**: 빈 핸들러 0건. 헤더/푸터 15링크, 홈 캐러셀·좋아요, 템플릿 검색/필터/정렬, 상세 다운로드(XSS 스킴 가드 포함)/공유/북마크(프로덕션), 로그인 폼 데모 안내, 에디터 저장/자동저장/복구/줌/단축키/온보딩 — 76건 라이브 정상.
- **에러 UI**: 커스텀 404, 존재하지 않는 템플릿/작품/크리에이터의 우아한 not-found, /collab XSS 안전(React 이스케이프 실검증).
- **접근성 기초**: 내보내기 모달 포커스 트랩, 스크린리더 announce, reduced-motion 훅.

---

## 5. 다음 사이클 권고 (우선순위)

1. **미배선 부품 일괄 배선 또는 삭제** — LayerPanel·CollabPanel·PresenceBar·InviteModal·generateShareLink·(구)JoinModal. "만들었는데 안 이어진 것"이 이 코드베이스의 반복 결함 클래스다.
2. **데모 훅 정합**: useBookmarks 널 클라이언트 크래시(NEW-detail-1) 포함, IS_DEMO_MODE 분기 없는 훅 전수 스캔.
3. **다크모드**: 스킨 완성 전 system 자동 감지 오프(즉효 1줄) → 토글 UI+스킨은 별도 트랙.
4. **협업 서버화(C5)**: `collab_sessions` 테이블+Realtime 레지스트리 — F-28과 함께 에디터 서버화 트랙으로.
5. **F-28**: works.editor_data의 blob URL 직렬화(이번엔 하이드레이션 필터로 완화만) — 스토리지 업로드 배선.
6. CSP 헤더 이동·next/font 셀프호스팅·metadata 정리 — 저비용 위생 묶음.
7. 미검증 잔여 영역 감사(NEW-CRITIQUE-COVERAGE 목록).

## 증거 저장소

라이브 증거(스크린샷·상태 덤프·콘솔 로그)는 세션 스크래치패드 `scratchpad/audit/`·`scratchpad/reverify/`에 수집됨(세션 종료 시 소멸 — 본 문서의 증거 서술이 정본). 재검증 16항목 판정 근거는 각 표의 '상태' 열에 인라인 기록.
