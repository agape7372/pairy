# F-31 알림(NotificationPanel)   [stub]

**WHAT**: 좋아요/팔로우/시스템 알림 패널. `src/components/notifications/NotificationPanel.tsx`(275줄, 직접 확인 — 감사 원문 "276줄"과 거의 일치).

**현재상태**: stub(FACT, 완전 확인). `mockNotifications`(31-76행대)가 like/use/follow/premium/system 5종의 하드코딩 배열, `useState(mockNotifications)`(109행대)로 **컴포넌트 로컬 state에만 저장**(전역 store 없음). `markAsRead()`·`markAllAsRead()`·`removeNotification()`(113-129행대)도 전부 로컬 상태 조작. 하단(235-240행대) "전체보기" 링크가 `/my/notifications`를 가리키나 **해당 라우트 자체가 존재하지 않음**(src/app/(main)/my/ 하위에 bookmarks/characters/creator/library/purchases/settings/subscription/whispers/works는 있으나 notifications 디렉토리 없음 — 404 확정).

**스펙정합**: 알림 기능 자체는 표준 소셜 플랫폼 기대치나, 스펙 문서에 상세 명세 미확인. 컴포넌트-로컬 state 설계는 "벨 아이콘의 카운트"와 "패널 내 알림 목록"이 서로 다른 컴포넌트라면 구조적으로 desync 발생 가능(별도 확인 필요하나 로컬 state 특성상 유력).

**문제·리스크**: **Medium-High** — 실제 알림 이벤트(좋아요/팔로우/댓글 발생)와 무관하게 항상 동일한 5개 목데이터만 표시 — 사용자에게 실질적 가치 0. `/my/notifications` 404는 UX 단절.

**Fable판정**: **defer/수정** — 전역 store로의 리팩터는 저비용이나, "실 이벤트원"(F-19/F-20/F-21 등에서 발생하는 실제 알림 트리거)이 아직 없으므로 완전 배선은 소셜 기능들이 먼저 활성화된 후가 자연스러움. 급한 것은 `/my/notifications` 404 제거와 벨-패널 카운트 정합화.

**다음작업**:
1. **(즉시, 저비용)** `/my/notifications` 페이지 신설(패널 내용을 전체 페이지로 재사용) — AC: 링크 클릭 시 404 아님. (Sonnet)
2. `NotificationPanel`을 컴포넌트 로컬 state에서 전역 store(Zustand)로 이관 — AC: 벨 아이콘 카운트와 패널 내 unread 카운트가 항상 일치. (Sonnet)
3. **(파운데이션 후)** 실 이벤트원 연결 — F-19(댓글)·F-20(좋아요)·F-21(팔로우) 발생 시 실제 알림 생성 — AC: A가 B의 게시물에 좋아요 시 B에게 실 알림 도착. (Sonnet, 다수 파일 걸친 통합 작업)

**의존·순서**: 1·2번은 독립적으로 즉시 가능. 3번은 소셜 기능들이 안정화된 후("소셜 이벤트 생기면", 감사 원문 문구) — 파운데이션(Tier 0) 완료가 실질적 선행조건.
