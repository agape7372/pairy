# DL-0007 · 에디터 문서 무결성과 협업 경계

- 상태: **DECIDED**
- 적용 상태: **LIVE DB 적용 · 프런트엔드 릴리스 후보 검증 완료**
- 날짜: 2026-07-28
- 범위: F-01·F-07·F-09·F-11·F-13 에디터 단독 업그레이드

## 문제

에디터의 화면 편집 기능은 풍부했지만 문서의 수명주기가 하나의 계약으로 묶여 있지
않았다. 같은 템플릿의 로컬 작업은 자동저장 키가 충돌했고, 서버에 저장한 작품은 다시
여는 경로가 없었으며, 저장·복구·템플릿 전환 중 늦은 비동기 응답이 다른 문서를 덮을
수 있었다. blob URL은 새로고침과 다른 기기에서 무효였고, undo/redo에서 폐기된 URL은
해제되지 않았다.

협업은 더 위험했다. 세션 시작이 페이지 재로드를 일으켜 미저장 편집을 잃을 수 있었고,
늦게 참가한 사용자의 초기 상태 요청·응답이 없었다. 공개 Realtime topic과 클라이언트
allowlist만으로는 비참가자의 broadcast/presence 주입을 서버에서 막지 못했다.

## 가정

- MVP의 문서 단위는 템플릿이 아니라 `work`, `draft`, `session` 중 하나다.
- 서버 저장 작품은 `works.editor_data`가 정본이고, 로컬 자동저장은 장애 복구본이다.
- 협업 참가자는 서버가 검증한 active/waiting 세션의 host 또는 participants여야 한다.
- 캔버스와 Yjs에는 기기 수명에 종속된 blob URL을 넣지 않는다.
- 시각적 결과가 같은 asset URL 승격은 사용자 편집 단계가 아니므로 별도 Undo 항목을
  만들지 않되, 기존 모든 history 스냅샷도 함께 치환해야 한다.

## 반박

- **CanvasEditor를 먼저 여러 훅으로 분해하면 해결되는가?** 아니다. 관심사 분리는
  필요하지만 현재 결함은 문서 ID·저장 원자성·비동기 세대·서버 권한 계약의 문제다.
  대규모 구조 변경을 동시에 하면 저장 회귀의 원인을 더 찾기 어려워진다.
- **data URL만 저장하면 충분한가?** 단일 브라우저 복구에는 유효하지만 localStorage와
  Realtime payload를 크게 만들고 협업 문서에 원본 바이트를 반복 전송한다.
- **클라이언트 참가자 allowlist면 충분한가?** 아니다. 공격자가 클라이언트 코드를
  우회할 수 있고 Broadcast payload의 `userId`도 사칭할 수 있다. 구독은
  `realtime.messages` RLS가, 송신은 현재 멤버십과 발신자를 매 호출 검증하는 서버
  RPC가 강제해야 한다.
- **에디터 asset을 완전 비공개 버킷으로 만들면 되는가?** 현재 렌더러·저장 포맷은
  장기 유효 URL을 직접 소비한다. 만료 signed URL만 넣으면 저장 문서가 다시 깨진다.
  이번에는 고엔트로피 경로의 capability URL과 owner-only 쓰기를 선택하되, URL 유출 시
  읽을 수 있다는 한계를 명시한다.

## 결정

1. 모든 새 로컬 편집에 UUID `draft`를 부여하고 자동저장 키를
   `session → work/draft → template` 순서로 스코프한다.
2. UUID 작품 라우트와 `?work=`는 소유자 검증 후 `works.editor_data`와 원본 템플릿을
   함께 로드한다. 첫 서버 저장은 새 work ID를 현재 URL에 기록한다.
3. 저장은 revision·generation·AbortController·단일 in-flight mutex로 보호한다.
   저장 중 새 편집이 생기면 이전 응답은 현재 문서를 clean으로 표시하지 않는다.
4. 자동저장 스키마 v2는 이미지·텍스트/스티커 템플릿 편집을 포함하고 런타임 검증한다.
   서버 장애 시 같은 스냅샷을 로컬 복구본으로 남긴다.
5. blob 수명은 현재 상태와 bounded history 전체를 기준으로 관리한다. history overflow와
   redo 분기 폐기 시 더는 참조되지 않는 URL을 해제한다.
6. 로그인 프로덕션 편집의 업로드·붙여넣기·개인 스티커는 먼저 `editor-assets`에
   업로드하고 HTTP URL만 store/history/Yjs에 기록한다. 과거 blob/data URL은 저장 또는
   협업 시작 전에 승격하며 현재와 모든 Undo 스냅샷을 원자 치환한다.
7. 협업 시작은 페이지를 재로드하지 않고 실제 서버 세션 ID를 현재 Provider 트리에
   연결한다. 초대 참가자의 저장은 호스트 작품 UPDATE가 아니라 자신의 사본 생성이다.
8. Yjs transport는 초기 `request-state/state-response`, remote-origin 무에코,
   awareness 병합, 실제 연결 상태, 텍스트 스타일·효과 동기화를 포함한다.
9. 프로덕션 Realtime은 `private: true`와 현재 JWT를 사용한다. 구독 topic에는
   서버가 관리하는 `realtime_key`를 포함하고 participants/status 변경 때 키를
   회전해 캐시된 과거 연결을 빈 topic으로 폐기한다.
10. `realtime.messages`는 active/waiting·미만료 세션의 host/participant에게
    Broadcast SELECT만 허용한다. 모든 송신은 `broadcast_collab_message` RPC가 매
    호출 현재 key·멤버십·event·크기를 검증하고 payload `userId`를 `auth.uid()`로
    덮어쓴 뒤 private database Broadcast로 보낸다. 클라이언트 직접 INSERT와
    Presence 쓰기는 열지 않는다.
11. `editor-assets`의 public bucket은 렌더링 URL만 공개한다. 객체 metadata SELECT와
    DELETE는 `owner_id`와 첫 경로가 모두 `auth.uid()`인 인증 사용자에게만 허용한다.

구현 정본:

- `supabase/migrations/20260728000001_collab_realtime_authorization.sql`
- `supabase/migrations/20260728000002_editor_assets_storage.sql`

## 이번에 하지 않은 것

- `CanvasEditor.tsx`의 god-component 분해는 하지 않았다. 문서 무결성 회귀가 안정된 뒤
  로드·저장·협업 훅을 별도 변경으로 추출한다.
- 에디터 asset의 private proxy/path 정본화와 문서 삭제 시 원격 asset GC는 포함하지
  않았다. 현재 공개 읽기 URL은 추측이 어려워도 URL 자체가 유출되면 읽을 수 있다.
- 750ms 초기 응답 창을 영속 Yjs 서버로 바꾸지 않았다. 현재는 기존 참가자의
  state-response와 CRDT 병합을 사용한다.

## 배포 게이트

클라이언트만 먼저 배포하면 private channel 구독과 asset 업로드가 실패한다.

1. DB 백업·복구 위치를 확인한다.
2. `20260728000001`과 `20260728000002`를 먼저 적용한다.
3. 실제 JWT로 host/participant 구독·RPC 성공, 비참가자·과거 key·만료 세션 실패와
   서버 발신자 UID 강제를 검증한다.
4. kick/end 뒤 `realtime_key` 회전, 기존 key RPC 42501, 정상 클라이언트 transport
   disconnect/reconnect를 두 브라우저에서 검증한다.
5. asset은 공개 URL GET 성공, anon listing 실패, owner metadata/INSERT/DELETE 성공,
   타 사용자 경로 쓰기·삭제 실패, MIME·10MB 제한을 검증한다.
6. 늦은 참가자 hydration, 이미지·텍스트 스타일 동기화, 새로고침 후 작품 재개를
   확인한 뒤 프런트엔드를 배포한다.

### 2026-07-28 운영 검증 기록

- `20260718000000`, `20260728000001`, `20260728000002`,
  `20260728000003`을 운영 DB에 적용했다.
- 실제 auto-confirm JWT 3개로 host·participant·outsider를 구성하고 private
  Broadcast 구독, 서버 발신자 UID 강제, kick/end key 회전, 이전 key RPC 거부와
  이전 topic 격리를 확인했다.
- `editor-assets`에서 anonymous metadata 조회, 타 사용자 경로 업로드·삭제를
  거부하면서 owner 업로드·공개 URL GET·metadata 조회·삭제가 동작함을 확인했다.
- 임시 사용자·세션·객체는 probe 종료 후 정확한 ID와 접두사 조건으로 삭제했다.
- private Realtime cold authorization 지연을 고려해 SDK join timeout을 30초로
  맞추고, topic을 UUID 두 개로 안전하게 파싱해 PK 조회하는 정책 helper를 별도
  forward migration으로 적용했다. 최종 운영 probe에서 host 1.11초, participant
  1.03초, key 회전 뒤 host 재접속 0.76초를 확인했다.

## 되돌림 조건

- private Realtime 정책이 정상 참가자를 막으면 공개 채널로 되돌리지 않고 배포를
  중지한 뒤 participants JSON 형식과 topic을 수정한다.
- capability URL의 공개 읽기가 제품의 비공개 초안 약속과 맞지 않게 되면 private
  bucket + 인증 media proxy + 저장 포맷의 storage path 정본화로 교체한다.
- 원격 asset 비용이 지속 증가하면 문서별 manifest와 history-aware GC를 도입한다.
