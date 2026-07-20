# DL-0006 — 2차 독립 감사(.gpt5.6sol.md) 검증·반영

- 상태: DECIDED · 실행(Tier A부터 순차)
- 일자: 2026-07-20
- 판단 주체: Opus(검증·로드맵) + 사용자(기록방식·결제시점·범위 승인)
- 관련: `.gpt5.6sol.md`(2차 감사 원본), 1차 감사 `docs/audit-2026-07-05/`, [[DL-0004]]·[[DL-0005]], strategy-genome §5·§8, F-09·F-11·F-13·F-15·F-16·F-18·F-24~28

## 맥락 / 문제

`.gpt5.6sol.md`(2026-07-20)는 **다른 모델(GPT 5.6)이 작성한 2차 전수 감사**다. 저장소엔 이미 1차 감사(2026-07-05)와 파생 거버넌스(TOP50·F-## dossier·DL-0001~0005)가 있다. 30개 발견을 백지 착수하면 스코프 스프롤·중복 백로그가 된다. 따라서 반영 절차 = **① 현재 M6 코드 대비 검증(빠른 개발로 이미 고쳐졌을 수 있음) ② 기존 거버넌스 대조(신규 vs 이미 결정됨) ③ 로드맵 정리·기록**.

15개 Critical/High를 읽기전용 에이전트 팬아웃 + 직접 코드 검증으로 대조했다.

## 검증 결과 (FACT)

- **전량 CONFIRMED** — 현재 M6 코드에서 stale/이미수정 0건. 부정확 하위주장 1건뿐: H-06의 "buyer_id NOT NULL" → 실제 `ON DELETE SET NULL` nullable(`schema.sql:171`).
- 2차 감사의 가치 = **기존 백로그가 놓친 신규/미착지 항목**:
  - **H-01** browser localStorage 세션 vs server cookie 세션 불일치 → 로그인 사용자의 결제 confirm 등 인증 서버라우트가 401. (`client.ts:18-45` supabase-js persistSession=localStorage, `server.ts` cookie, `proxy.ts`/`middleware.ts` 부재)
  - **H-06** 계정 탈퇴가 `auth.users` 잔존·자식행 부분삭제·거짓 성공 표시. (`profile.ts:280-311` 오류무시, profiles DELETE 정책 부재, `my/settings/page.tsx:202-206` signOut만)
  - **H-13** 한글 조합 중 Enter가 제출/저장 실행(7곳). src 내 `isComposing` 가드 0건.
  - **H-04** public profiles SELECT `using(true)`가 `total_earnings`·`pending_payout`·`subscription_*`·`settings`·`role`을 anon에 노출(RLS는 row만 제한, column 미차단). TOP50 #1은 UPDATE 자가승격만 다룸.
  - **H-05** `is_creator`·`follower_count`·`following_count` UPDATE grant 미회수 — TOP50 #1·`20260706000000`·`20260712000001` 주석이 약속했으나 **마이그레이션에 착지 안 됨**(`20260712000002:27-30` grant 목록에 3컬럼 잔존). 자가 creator 승격 → Whisper insert 권한 획득.
  - **H-02** 결제 confirm이 `.eq('status','pending')` 후 row-count 미확인 → 동시 confirm 시 구독 이중부여. DL-0005 "멱등" 주장과 코드 갭. 단건구매는 unique index로 보호되나 구독은 무방비.
  - **C-01a** `works`/`templates` 스토리지 오브젝트에 소유권 검증 부재 → 임의 로그인 사용자가 타인 작업 이미지 덮어쓰기(`20260712000004:52-67` 소유권 defer 주석).
- 나머지는 **이미 결정된 것 재확인**: H-07→F-11/F-13(재건 최우선), H-09→[[DL-0003]](defer), H-10→[[DL-0005]](실키 go-live 게이트), H-11→[[DL-0004]](익스플로잇 봉인·UI 정직화만 잔여), H-03→F-25(defer), H-08→F-15/F-16, H-12→TOP50 Tier2 a11y.

## 결정 (사용자 승인)

1. **기록 = DL(이 문서) + 기존 문서 갱신.** 별도 통합 리뷰 문서 안 만듦. `.gpt5.6sol.md` 원본은 감사 스냅샷으로 보존.
2. **결제 = 당분간 Toss 테스트모드 유지.** 결제 결함군(H-01·H-02·H-10·H-03) 중 저비용 정정(H-02 row-count 게이트)은 지금, 나머지(웹훅 서명·정산 원장·콘텐츠 RLS)는 **실키 go-live 게이트로 defer**. 파운데이션(보안 봉합·저장·협업) 우선.
3. **범위 = 전량 리메디에이션 로드맵**(Tier A~F). 실행 순서는 §Tier.

## Tier 순서 (실행)

- **A 즉시 서버 봉합**(저비용·제품결정 불필요): H-05·H-04·C-01a·H-09(전부 additive 마이그레이션) + H-01(세션 통일, 파운데이션 선행조건).
- **B 신뢰·데이터 보존**: C-02(동기 저장·정직 토스트)·H-13(IME 가드)·거짓성공 정직화(H-03 정산 비활성·H-11 creator/duo 숨김·F-16a 토스트)·C-01b(유료 file_url 공개 제외)·H-06(서버 삭제 라우트, H-01 의존).
- **C 결제 정합(저비용분)**: H-02. 나머지 결제군 defer.
- **F 품질게이트**(병렬): H-12 a11y·M-02 CI(build+신규 lint)·M-10 타입.
- **D 협업 재건**: H-07(기존 테이블+RPC 배선, 2인 강제). moat.
- **E 정보구조 정본**: H-08(entity DL 선행 후 slice).

## 하위 결정 (해당 Tier 실행 전 확인/별도 DL)

1. **C-01b 유료 판매 출시 여부** — 현재 테스트모드 = "미출시" 전제로 유료 파일 public 차단(서명URL infra는 defer). 실판매 시 서버 게이트 다운로드로 승격. 통신판매중개자 고지(strategy-genome §7) 동반.
2. **H-06 구매기록 보존** — `ON DELETE SET NULL`(구매행 유지·buyer null) 기본 수용 여부(세무/회계). 별도 결정 없으면 기본 유지.
3. **H-08 entity 모델** — resource/template 통합 vs 별도 연결. slice 착수 전 별도 DL.

## 실행 현황 (2026-07-20)

- **완료·검증(tsc·jest 367·build·proxy 인식 통과)**:
  - Tier A 전체: `20260720000001`(H-05)·`20260720000002`(H-09)·`20260720000003`(C-01a)·`20260720000004`(H-04, `get_my_profile` RPC) 마이그레이션 + storage.ts `{uid}` 키잉 + H-01(client.ts `createBrowserClient` 쿠키세션 + `src/proxy.ts` 세션리프레시).
  - Tier B: H-13(IME 가드 7곳 + `isImeComposing`), C-02(에디터 동기 저장), H-06(`POST /api/account/delete` + admin.deleteUser, cascade 전수확인), C-01b(앱 유료 다운로드 차단 확인+정직 카피), H-03(프로덕션 정산 신청 gate+정직 문구).
  - Tier C: H-02(confirm `.select()` row-count 게이트).
  - Tier F: M-02(CI build 스텝), H-12 안전부분(aria-label·aria-expanded·skip link·단일 main).
- **미착지(후속 세션)**: H-12 CTA 대비 토큰(디자인 민감)·공용 Dialog(focus trap/Escape)·M-10(client nullable 타입); **Tier D**(H-07 협업 재건 — 게스트정책 결정 선행)·**Tier E**(H-08 entity 정본 — entity모델 DL 선행); C-01b DB-level file_url 은닉(F-28 사설전달과 함께).
- **배포 전 필수**: 4개 신규 마이그레이션의 라이브 DB negative-test(각 파일 하단 검증 쿼리) + H-01/H-06 은 로그인·OAuth·삭제 실E2E. H-06 은 `SUPABASE_SERVICE_ROLE_KEY` env 필요.

## 되돌림 / 후속

- 각 Tier 마이그레이션은 additive·reversible(적용본 수정 금지, timestamp 증가 신규만). 되돌림 = 정책 원복 + 뷰/트리거 drop.
- 결제 실활성화 결정 시 Tier C defer분·H-10 재개(이 문서 갱신 + 신규 DL).
- 검증: 마이그레이션은 negative test matrix(anon/authed/A/B/service-role) 선작성 후 local/isolated Supabase 실행. 공통 게이트 `tsc`→`test`→`build`.
