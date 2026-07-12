# 페어리 기능별 판정 원장 (Feature Groundwork Index)

> 출처: `~/.claude/plans/polymorphic-greeting-gizmo.md` §★ 페어리 기능별 Fable 두뇌 밑작업 (2026-07-05 전수감사)
> 목적: 페어리 탑재 33개 기능(F-01~F-33, F-16은 a/b 분할로 34파일) 각각을 Fable이 판정(존치/수정/축소/컷/defer)해, 하위 모델(Opus/Sonnet/Haiku)이 이어서 실행하도록 인수인계.
> 각 F-##는 아래 표에서 개별 dossier 파일로 링크된다. Dossier 형식은 파일 하단 "Dossier 템플릿" 참고.

## 실행 상태 오버레이 (2026-07-12 갱신)

> 아래 인벤토리 표는 **2026-07-05 감사 시점 판정**(밑작업 정본, 보존). 이후 실행으로 바뀐 것만 여기 오버레이한다. 개별 dossier 하단 "갱신" 섹션이 상세 정본.

| F## | 감사 상태 | → 현재 | 무엇이 바뀌었나 |
|---|---|---|---|
| F-23 공유 | 정적export가 죽임 | **부분 해소** | DL-0001 Vercel 이전으로 share/[shareId] 실서빙 + OG 서버 실데이터. 404·언퍼 해소. share_id/RLS는 works 스키마 정본화(20260712000000) |
| F-15 템플릿·F-22 크리에이터·F-13 협업 라우트 | demo/정적 404 | **서빙 복구** | 동적 라우트 4종 온디맨드 렌더(generateStaticParams 데모고정 제거) — 실 ID 404 소멸 |
| F-26 구독 | demo(C-3) | **서버 진실 이전** | profiles.subscription_tier 2티어(free/premium), 클라 자가승격 42501 차단, syncFromServer (DL-0004). 실 부여=결제 후속 |
| F-28 프리미엄 게이팅 | demo(클라) | **참조점 확보·콘텐츠RLS defer** | is_premium_active() definer 신설. 단 편집데이터가 로컬 JSON 서빙이라 콘텐츠 RLS는 실서빙 배선 선행(정직한 defer) |
| F-30 인증 | 소셜 제거 대상 | (미착수) | DL-0002 매직링크 전환 대기 |
| F-32 테마/다크 | orphan(미호출) | **배선됨** | Providers에 useThemeInitializer 마운트(이전 세션) |
| 보안 C-1·C-2·H-1·H-3·H-5 | 미봉합 | **봉합 완료** | Supabase 클린 재구축+마이그레이션, anon 실검증. `docs/audit-2026-07-05/04-security.md` 대조 |
| TOP50 #13·#15 | 미착수 | **완료** | 가격 정본화·persist migrate |

**남은 파운데이션**: 결제 백엔드(Tier 0 #6) → C-4 수익검증·F-24·F-27·F-28 실배선. 성능 #10·#11.


## 판정 원장 — 클러스터별 인벤토리 (33종)

> 모델태그 원칙: 판단·아키텍처·보안설계·적대검증=**Fable** · 기능구현/리팩터/테스트=**Sonnet** · 대량 기계수정/탐색=**Haiku** · 난제=**Opus**.
> 상태태그: `real`(실동작) · `demo`(localStorage/샘플만) · `stub`(UI만/no-op) · `partial` · `orphan`(미연결) · `planned`.

### 클러스터 A — 에디터(핵심 자산: 대부분 존치)

| F## | 기능 | 상태 | Fable 판정 | 다음작업(모델) | 링크 |
|---|---|---|---|---|---|
| F-01 | Canvas 에디터(Konva, CanvasEditor 1530줄) | real | 존치·성능수정 — 최고 자산 | 통구독→셀렉터, god분해, 렌더러 memo (Sonnet/Opus) | [F-01-canvas-editor.md](./F-01-canvas-editor.md) |
| F-02 | 이미지편집(마스킹/필터/투명도/플립) | real | 존치 | 슬라이더 디바운스 (Sonnet) | [F-02-image-editing.md](./F-02-image-editing.md) |
| F-03 | 텍스트편집(스타일/효과/폰트) | real | 존치 | 폰트 self-host (Sonnet) | [F-03-text-editing.md](./F-03-text-editing.md) |
| F-04 | 스티커(UserSticker) | real | 존치 | index-key 교체 (Haiku) | [F-04-stickers.md](./F-04-stickers.md) |
| F-05 | PSD 임포트(psdParser 701+ag 456줄) | real | 존치·우선순위 하향 — MVP 핵심 아님, 유지비 인지 | 회귀테스트만 (Sonnet) | [F-05-psd-import.md](./F-05-psd-import.md) |
| F-06 | 레이어 패널 | real | 존치 | layerStates/config 이중소스 통합 (Sonnet) | [F-06-layer-panel.md](./F-06-layer-panel.md) |
| F-07 | Undo/Redo(history middleware) | real | 수정 — 키입력마다 push=잭 | 디바운스+ring buffer (Sonnet) | [F-07-undo-redo.md](./F-07-undo-redo.md) |
| F-08 | Export(PNG/JPG/WebP+워터마크) | real | 존치 | 워터마크→도난방지 승격 (Sonnet) | [F-08-export.md](./F-08-export.md) |
| F-09 | 자동저장(localStorage) | real | 존치 | 런타임결별 후 클라우드 동기화 (Sonnet) | [F-09-autosave.md](./F-09-autosave.md) |
| F-10 | 온보딩/단축키 | real | 존치 | — | [F-10-onboarding-shortcuts.md](./F-10-onboarding-shortcuts.md) |

### 클러스터 B — 협업(차별점: 재건)

| F## | 기능 | 상태 | Fable 판정 | 다음작업(모델) | 링크 |
|---|---|---|---|---|---|
| F-11 | 실시간협업(Yjs+BroadcastChannel) | partial(실기기X) | 수정 최우선 — 차별점 복구 | Supabase Realtime 배선 (Opus) | [F-11-realtime-collab.md](./F-11-realtime-collab.md) |
| F-12 | Presence(커서/참가자) | partial | 수정 | F-11과 함께 (Sonnet) | [F-12-presence.md](./F-12-presence.md) |
| F-13 | 초대/세션(useCollabSession) | stub(로컬 C-5) | 수정 — Supabase 배선 | collab_sessions 연결+H-1 봉합 (Opus) | [F-13-invite-session.md](./F-13-invite-session.md) |
| F-14 | 협업 채팅 | partial | F-11 후 존치 | 검토 (Sonnet) | [F-14-collab-chat.md](./F-14-collab-chat.md) |

### 클러스터 C — 콘텐츠·소셜

| F## | 기능 | 상태 | Fable 판정 | 다음작업(모델) | 링크 |
|---|---|---|---|---|---|
| F-15 | 템플릿 아카이브(목록/검색/상세) | demo(정적/샘플) | 수정 — 실 DB+동적라우트 | useTemplates 연결, generateStaticParams 결별 (Sonnet) | [F-15-template-archive.md](./F-15-template-archive.md) |
| F-16a | 틀 빌더(templates/new PSD) | stub(비데모 save=console.log+가짜 성공 토스트) | 수정 — 실 insert or 정직한 토스트 | page.tsx:271-284 (Sonnet) | [F-16a-template-builder.md](./F-16a-template-builder.md) |
| F-16b | 자료 업로드(resources/new, 현 브랜치) | stub(쓰기 전용) — demo/supabase 분기 0, 항상 localStorage, getResourcePosts 호출 0 → 영원히 안 보임 | 수정 최우선 — 읽기 경로(자료 목록/상세) 먼저, 그다음 백엔드 | /resources 리스트 + 스키마 신설 (Sonnet) | [F-16b-resource-upload.md](./F-16b-resource-upload.md) |
| F-17 | 캐릭터(자캐) 에디터(896줄+useCharacters 789) | demo(테이블 부재→항상 localStorage) | 존치·수정(핵심 도메인 — "자캐"가 정체성) | characters 테이블+RLS 신설, **canCreateMore 버그 수정(함수를 truthy로 오용→10개 제한 무력)**, 프리미엄 티어 로직 (Sonnet) | [F-17-character-editor.md](./F-17-character-editor.md) |
| F-18 | Whisper(창작자→구독자 선물/메시지, 786+723+413줄+마이그레이션) | stub(전송 no-op) — 훅 2중(useWhisper 실코드 죽음/useWhispers 데모 배선), 작성 메시지 소실·가짜 성공 | defer/축소 — 고유 아이디어나 과설계·MVP 밖. 훅 1개로 통합 후 파운데이션 뒤 재개 | 훅 택1 정리 (Fable→Sonnet) | [F-18-whisper.md](./F-18-whisper.md) |
| F-19 | 댓글 | real | 존치 | M-3 상태전이 트리거 (Sonnet) | [F-19-comments.md](./F-19-comments.md) |
| F-20 | 좋아요/북마크 | real | 존치 | — | [F-20-likes-bookmarks.md](./F-20-likes-bookmarks.md) |
| F-21 | 팔로우/팔로워 | real | 존치 | — | [F-21-follow.md](./F-21-follow.md) |
| F-22 | 크리에이터 프로필 | demo | 수정 — 동적라우트 | (Sonnet) | [F-22-creator-profile.md](./F-22-creator-profile.md) |
| F-23 | 작업물 공유(share, useShareWork 567줄) | hook은 real·최고품질이나 정적export가 죽임 — share_id 'demo'만, OG 언퍼 항상 일반 | 수정 — 런타임 결별에 종속(Tier 0) | 라우트/rewrite 결정 후 (Opus) | [F-23-share-work.md](./F-23-share-work.md) |

### 클러스터 D — 수익화(결제 선행)

| F## | 기능 | 상태 | Fable 판정 | 다음작업(모델) | 링크 |
|---|---|---|---|---|---|
| F-24 | 마켓플레이스(marketplaceStore) | demo(C-4) | 수정 — 서버검증 | 결제 후 실배선 (Opus) | [F-24-marketplace.md](./F-24-marketplace.md) |
| F-25 | 수익/정산 대시보드 | demo(C-4 위조) | defer — 결제 성립 후 | 서버 원장 (Opus) | [F-25-earnings-dashboard.md](./F-25-earnings-dashboard.md) |
| F-26 | 구독(free/premium/duo/creator) | demo(C-3) | 축소 — 4→2티어 + 서버검증 | 티어 정리+서버 게이팅 (Fable판정→Sonnet) | [F-26-subscription.md](./F-26-subscription.md) |
| F-27 | 구매 플로우(usePurchase) | stub(no pay) | 결제백엔드 의존 | Toss 웹훅 (Opus) | [F-27-purchase-flow.md](./F-27-purchase-flow.md) |
| F-28 | 프리미엄 게이팅 | demo(클라) | 수정 — 서버 검증 | RLS/entitlement (Opus) | [F-28-premium-gating.md](./F-28-premium-gating.md) |

### 클러스터 E — 게이미피케이션

| F## | 기능 | 상태 | Fable 판정 | 다음작업(모델) | 링크 |
|---|---|---|---|---|---|
| F-29 | XP/레벨/뱃지/스트릭(gamificationStore 456줄) | orphan(전종단 미연결 확인) — 데이터·write/read API·표시컴포넌트 다 완성인데 호출부 0 | defer(컷 아님) — 코드 양질, 지금 배선은 조급(실 활동 생긴 후 가치) | 파운데이션 후 재검토 (Fable) | [F-29-gamification.md](./F-29-gamification.md) |

### 클러스터 F — 플랫폼

| F## | 기능 | 상태 | Fable 판정 | 다음작업(모델) | 링크 |
|---|---|---|---|---|---|
| F-30 | 인증/로그인(이메일+비번+OAuth) | real | 수정 — 소셜 제거·매직링크(DL-0002) | signInWithOtp+소셜 제거 (Sonnet) | [F-30-auth.md](./F-30-auth.md) |
| F-31 | 알림(NotificationPanel 276줄) | stub — 목데이터·컴포넌트로컬 state·벨/패널 카운트 desync·/my/notifications 404·백엔드 무 | defer/수정 — 전역 store+실 이벤트원 필요 | 소셜 이벤트 생기면 (Sonnet) | [F-31-notifications.md](./F-31-notifications.md) |
| F-32 | 테마(라이트/다크)+애니모드(doodle/premium) | orphan(정정!) — useThemeInitializer 미호출→**다크모드 실작동 안 함**, 토글 UI 없음, 애니 시스템 2중(themeStore vs AnimationContext) | 수정(저비용 고가치) — Providers에 초기화 mount+토글+애니 통합 | 리스너 leak 수정 후 배선 (Sonnet) | [F-32-theme-darkmode.md](./F-32-theme-darkmode.md) |
| F-33 | 데모모드(IS_DEMO_MODE) | real | 수정 — H-5 하드실패+배너 | 빌드가드+UI배너 (Sonnet) | [F-33-demo-mode.md](./F-33-demo-mode.md) |

---

## 메타 발견 — "완성됐지만 미배선"이 스코프 스프롤의 서명 (FACT)

AI 대량구축의 부작용으로 **양질의 코드가 배선만 안 된 채 죽어있는** 사례가 반복 확인됨:
- 게이미피케이션(전종단 orphan)
- 테마/다크모드(초기화 미호출)
- 애니 이펙트(Provider 미마운트)
- Whisper 실훅(`useWhisper` 죽고 데모훅 `useWhispers` 배선)
- 알림(목데이터 고정)
- 자료 업로드(읽기 경로 0)
- 마켓 `recordSale`(죽은코드)

**문제는 "덜 만듦"이 아니라 "만들고 안 이음"이다.** 이는 §13 "틀린 곳에 만듦"과 짝을 이루는 실행 층위의 병 — 하위 모델은 **새로 만들기 전에 "이미 있는데 안 이어진 것"부터 이으라**(대부분 저비용 고가치: 테마 배선, canCreateMore 버그, whisper 훅 통합).

## Fable 밑작업 요지 (하위 모델이 계승할 판단 원칙)

1. **에디터·소셜은 자산 = 성능·정합만 수정, 재설계 금지.**
2. **자캐(캐릭터)는 제품 정체성의 핵심 = 존치·완성**(테이블 신설+버그 수정) — 컷 대상 아님.
3. **협업은 차별점이나 미작동 = 재건 최우선.**
4. **수익화 전체는 결제 백엔드가 선행**, 그 전엔 서버검증 없는 것 defer(가짜 정산 금지).
5. **스프롤 정리**: 게이미피케이션·Whisper·Duo·4티어·알림은 과설계/미배선 = defer or 축소(코드 양질이면 삭제 말고 동결).
6. **"완성-미배선" 우선 연결**: 테마·다크모드 배선은 즉시 저비용.
7. 인증은 최소 PII(DL-0002).

각 판정의 "왜"가 `docs/features/`·`docs/ai-org/decisions/`에 남아 후계 모델이 동일 규율 계승.

---

## Dossier 템플릿 (각 기능 파일 형식)

```
# F-## <기능명>   [상태태그]
WHAT      : 목적 1줄 + 핵심 파일(줄수)
현재상태   : 무엇이 어떻게 동작 (FACT, 파일:라인)
스펙정합   : 원래 스펙 대비 (일치/이탈/문서부재)
문제·리스크: 구체 결함 (적대적, 파일:라인, 심각도)
Fable판정  : 존치/수정/축소/컷/defer + 이유(핵심 — 하위모델이 못 내리는 판단)
다음작업   : 실행 단계 + 수용기준(AC) + 모델태그[Haiku/Sonnet/Opus/Fable]
의존·순서  : 선행조건 / 후행영향
```

상태태그: `real`(실동작) · `demo`(localStorage/샘플만) · `stub`(UI만/no-op) · `partial` · `orphan`(미연결) · `planned`.

## 관련 문서

- 전체 감사 원본: `~/.claude/plans/polymorphic-greeting-gizmo.md` (§★ 페어리 기능별 Fable 두뇌 밑작업)
- 감사 정본 분할(예정): `docs/audit-2026-07-05/`
- AI 조직 설계(예정): `docs/ai-org/`
- 테스트 체크리스트(예정): `docs/testing/E2E-CHECKLIST.md`
