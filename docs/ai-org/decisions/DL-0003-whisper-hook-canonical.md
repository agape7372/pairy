# DL-0003 — Whisper 훅 정본화 및 중복 정리 방향

- 상태: DECIDED (실행 일부 defer)
- 일자: 2026-07-06
- 판단 주체: Fable
- 관련: F-18(docs/features/F-18-whisper.md), 감사 TOP50, 메타 발견 "훅 2중 구현"

## 맥락 / 문제

Whisper(창작자→구독자 선물/메시지) 기능에 데이터 훅이 2종 존재한다.

- `src/hooks/useWhisper.ts` (722줄) — 실 Supabase 구현. realtime 구독·낙관적 업데이트·데모 폴백까지 갖춘 "제대로 만든" 훅. **소비처 0 (완전한 死코드).**
- `src/hooks/useWhispers.ts` (412줄) — 데모 목업. 모든 Supabase 경로가 `// TODO` 스텁. **UI(`my/whispers/page.tsx`)가 실제로 배선한 유일한 훅.**

즉 UI는 목업(가짜 성공 전송)에 물려 있고, 실 구현은 고아. 다음 개발자가 "어느 쪽이 정본인지" 판단 불가한 것이 핵심 유지비/함정. (F-18 dossier가 이 결정을 Fable에 위임함.)

## 결정

1. **정본 = `useWhisper.ts`** (실 구현). `useWhispers.ts`는 **DEPRECATED 데모 목업**으로 명시 표기.
2. **위험한 페이지 마이그레이션은 defer.** `my/whispers/page.tsx`(666줄)를 정본 훅으로 이관 + 목업 삭제하는 작업은 이번에 하지 않는다.
3. 두 훅 파일 상단에 역할/상태를 못박는 주석을 추가해 "정본 혼란" 엔트로피를 **지금 즉시** 해소.

## 왜 이렇게 (그리고 왜 지금 다 안 했나)

- **왜 useWhisper가 정본**: 목업은 Supabase가 전부 TODO라 절대 실동작 불가. 실 구현이 미래 가치 보유(whispers 테이블·마이그레이션 `20250107_create_whispers.sql` 이미 존재).
- **왜 마이그레이션 defer**: F-18 자체가 **defer/축소** 판정("MVP=2인 페어틀 협업 범위 밖 과설계, 지금 새 개발 자원 투입 금지"). 666줄 페이지를 shape가 다른 정본 훅(단일 received 리스트 + 별도 `useWhisperCreator`, 페이지네이션 없음)으로 재작성하는 것은 위험한 신규 투자 → defer 판단과 정면 충돌. 감사 원칙 "파운데이션(Tier 0) 먼저"에도 어긋남.
- **왜 死코드(useWhisper)를 삭제하지 않았나**: 삭제하면 미래 실배선의 출발점을 버리는 것. 목업보다 실 구현이 미래 가치가 크므로 보존. (반대로 목업을 지금 삭제하면 페이지가 깨짐.)

## 실행

- (완료) `useWhispers.ts`·`useWhisper.ts` 상단 주석으로 정본/deprecated 명시 + 이 문서 링크.
- (defer) 페이지를 `useWhisper`+`useWhisperCreator`로 이관, `useWhispers.ts` 삭제, 전송 플로우 실배선. **선행: Tier 0 파운데이션. 트리거: Whisper 기능 defer 해제 시.**
- (defer) 전송이 현재 가짜 성공인 점(WhisperComposer)은 F-18 축소 상태의 일부 — 실배선 시 함께 정직화.

## 되돌림 기준

Whisper 기능을 조기에 정식 출시하기로 뒤집으면, 이 결정의 "defer" 부분을 재개하고 페이지 이관을 우선순위화한다. 정본 선택(useWhisper) 자체는 유지.
