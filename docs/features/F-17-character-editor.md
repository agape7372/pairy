# F-17 캐릭터(자캐) 에디터   [demo(테이블 부재→항상 localStorage)]

**WHAT**: 자캐(오리지널 캐릭터) 생성·관리 — 페어리 제품 정체성의 핵심 도메인. `src/components/characters/CharacterEditForm.tsx`(895줄), `src/hooks/useCharacters.ts`(788줄), 관리 UI `src/components/characters/CharacterManager.tsx`, 생성 페이지 `src/app/(main)/my/characters/new/page.tsx`.

**현재상태**: demo(FACT, `characters` 테이블이 Supabase 스키마에 없어 항상 localStorage 폴백). **확정 버그(감사 명시 사항, 직접 코드 확인 완료)**: `useCharacters.ts`:93(타입 시그니처 `canCreateMore: () => boolean`), :269-273(정의 — `const canCreateMore = useCallback((): boolean => { const maxCount = MAX_CHARACTERS_FREE; return characters.length < maxCount }, [characters.length])`)에서 **함수**로 올바르게 정의됐고 내부적으로도 :403(`if (!canCreateMore()) {`)에서 올바르게 호출됨. 그러나 **소비처 2곳이 함수 참조 자체를 진리값으로 오용**: `my/characters/new/page.tsx`:34(`if (!canCreateMore) {`) — 함수 참조는 항상 truthy이므로 `!canCreateMore`는 항상 `false`, 즉 이 게이트가 **절대 작동 안 함**. `CharacterManager.tsx`:108(`if (!canCreateMore) return`), :110(의존성 배열), :184·:188(표시용, 동일하게 무효화)도 동일 버그.

**스펙정합**: "자캐(OC)"가 00-overview.md의 제품 정체성 그 자체 — 이 기능은 컷/축소 논의 대상이 될 수 없는 핵심 도메인. `MAX_CHARACTERS_FREE`(무료 티어 캐릭터 수 제한) 자체는 구독 모델(F-26)과 연동된 스펙이나, 버그로 인해 사실상 무제한 생성 가능한 상태 — 수익화 설계와 충돌.

**문제·리스크**: **High(정확도 확인된 실버그)** — 무료 사용자가 무제한으로 캐릭터를 생성 가능, 프리미엄 업그레이드 유인 하나가 코드 한 줄 버그로 무력화. `characters` 테이블 부재로 인해 모든 캐릭터 데이터가 localStorage 한정(기기 이동 시 소실, C-3/C-4 계열과 유사한 "로컬만 존재" 리스크).

**Fable판정**: **존치·수정(핵심 도메인)** — 컷 대상 절대 아님. (1) `canCreateMore` 버그는 1-2줄 수정으로 즉시 고칠 수 있는 저비용 고가치 항목(메타 발견의 "완성-미배선" 원칙과 유사하게, 여긴 "만들었는데 잘못 이음"). (2) `characters` 테이블 신설은 본작업.

**다음작업**:
1. **(즉시, 최우선)** `my/characters/new/page.tsx`:34와 `CharacterManager.tsx`:108을 `if (!canCreateMore())`(함수 호출)로 수정, :110 의존성 배열과 :184·188 표시부도 `canCreateMore()` 호출 결과 사용하도록 정합화 — AC: 무료 티어에서 `MAX_CHARACTERS_FREE`개 초과 생성 시도 시 실제로 차단 UI 노출(수동 테스트로 확인 가능한 가장 명확한 회귀). (Sonnet — 코드 3-4줄 수준이나 회귀테스트 필요해 Haiku보다 Sonnet 권장)
2. Supabase `characters` 테이블+RLS 신설(소유자만 CRUD) — AC: 로그인 사용자의 캐릭터가 Supabase에 영속, 기기 변경 후에도 유지. (Sonnet)
3. 프리미엄 티어별 캐릭터 수 제한 로직을 F-26(구독 축소 작업)과 연동 — AC: premium/creator 티어는 무제한 또는 상향된 제한 적용. (Sonnet)

**의존·순서**: 1번은 완전 독립, 즉시 가능(다른 무엇에도 종속 안 함 — 최우선 착수 권장). 2번은 F-16b의 테이블 신설 작업과 스키마 설계 패턴 공유 가능. 3번은 F-26(구독 4→2티어 축소) 결정 이후 진행이 자연스러움.
