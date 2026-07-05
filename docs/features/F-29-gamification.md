# F-29 XP/레벨/뱃지/스트릭(gamificationStore)   [orphan(전종단 미연결 확인)]

**WHAT**: 사용자 활동에 대한 XP/레벨/뱃지/출석 스트릭 보상 시스템. `src/stores/gamificationStore.ts`(456줄, 직접 확인 완료).

**현재상태**: orphan(FACT, 완전 확인). 내부 구성은 완성도 높음 — `LEVEL_CONFIG`(17-52행대, 13개 레벨·임계치 0→100→300→…→10000 XP·색상 그라데이션), `ACTIVITY_XP`(55-78행대, login 10·viewTemplate 2·downloadTemplate 15·createWork 30·completeWork 50·uploadTemplate 100 + 마일스톤 보너스), `BADGES`(81-162행대, 10종 뱃지 — firstSteps/explorer/collector/heartGiver/socialButterfly/risingCreator/beloved/trendsetter/influencer/legend, 희귀도·설명·아이콘 포함), `DAILY_STREAK_REWARDS`(165-173행대, 7일 주기), 액션(`addXP`·`checkIn`·`incrementStat`·`unlockBadge`·`checkBadgeEligibility`, 230-407행대), 편의 훅(`useLevelInfo`·`useBadges`·`useDailyCheckIn`, 412-456행대). **그러나 src/app, src/components 전역에서 이 스토어·훅·액션을 import하는 곳이 정의부 자신 외에는 0건** — 완전한 죽은 코드(직접 grep 재확인, 오탐 없음).

**스펙정합**: 게이미피케이션 자체가 마스터 프롬프트에 별도 스펙 문서 없이 코드로만 존재 — 감사 §3.1의 "스코프 스프롤" 직접 사례(00-overview.md:144 MVP 원칙 위반). 다만 코드 품질 자체는 높아 "잘못 만든 것"이 아니라 "만들고 안 이은 것"(메타 발견).

**문제·리스크**: 낮음(Low, 버그가 아니라 미배선) — 실동작하는 시스템이 없으므로 사용자 영향 자체는 0. 리스크는 유지비(456줄의 완성 코드가 아무 가치도 창출 못함)와, 스코프 스프롤이 파운데이션 미완성을 가리는 신호라는 점.

**Fable판정**: **defer(컷 아님)** — 코드 품질이 양호하므로 삭제는 낭비. 그러나 지금 배선하는 것은 조급 — 실 사용자 활동(F-11 협업 복구, F-19/F-20/F-21 등 소셜 기능)이 먼저 정상 궤도에 올라야 XP/뱃지가 의미를 가짐. 파운데이션(Tier 0) 완료 후 "배선할 가치가 있는지" 재검토.

**다음작업**:
1. **(즉시)** 액션 불필요 — 동결 상태 유지. 삭제하지 말 것(메타 발견 원칙 — 코드 양질이면 동결).
2. **(파운데이션 후 재검토)** 실 사용자 활동 데이터가 쌓인 시점에 배선 여부를 Fable이 재판정 — 배선 시 `addXP` 등 액션을 F-19~21(댓글/좋아요/팔로우) 등 실 이벤트 발생 지점에 훅업. (Fable 재검토 → Sonnet 실행)

**의존·순서**: **선행조건**: 없음(독립적으로 동결 유지 가능). **후행영향**: 배선 결정 시 F-19·F-20·F-21·F-08(export) 등 다수 기능의 이벤트 발생 지점에 훅을 추가해야 하므로 광범위한 통합 작업이 됨 — 소규모 변경이 아님을 인지.
