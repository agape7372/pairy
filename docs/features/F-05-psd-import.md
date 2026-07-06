# F-05 PSD 임포트   [real]

**WHAT**: PSD 파일을 업로드해 템플릿으로 변환. 파서 2종 — `src/lib/utils/psdParser.ts`(701줄, 레거시 자체 파서)와 `src/lib/utils/agPsdParser.ts`(456줄, ag-psd 라이브러리 기반, 실사용 중). 업로드 UI는 `src/components/editor/psd/PSDUploader.tsx`(612줄), 캔버스 프리뷰는 `PSDCanvas.tsx`, 타입은 `src/types/psd.ts`.

**현재상태**: 실동작(FACT). `PSDUploader.tsx`:37이 `agPsdParser`의 `parseAgPsd`·`convertToTemplate`을 import — ag-psd 기반 파서가 활성 경로. 레거시 `psdParser.ts`(701줄)는 `__tests__/psdParser.test.ts`가 존재해 완전히 죽은 코드는 아니나, 활성 UI 경로에서 호출되는지는 추가 확인 필요.

**스펙정합**: 05-tech-stack.md에 PSD 임포트가 명시돼 있으나, 00-overview.md:144의 "2인 페어틀 하나에 올인" MVP 원칙과 충돌 — PSD 파서 2종 유지비(701+456+612줄=1769줄)가 MVP 핵심 기능 대비 과도.

**문제·리스크**: 파서 이원화로 인한 유지비(Medium) — 어느 파서가 정본인지 신규 기여자가 혼동 가능. MVP 핵심(2인 협업 페어틀)이 아닌 기능에 상당한 코드 자산이 묶여 있음(스코프 스프롤의 한 사례).

**Fable판정**: **존치·우선순위 하향** — MVP 핵심 아님이나 이미 만들어진 기능을 컷하지는 않음(사용자가 이미 쓰고 있을 수 있는 기능을 제거하는 리스크가 유지비보다 클 수 있음). 신규 개발 자원을 투입하지 말고 회귀만 방지.

**다음작업**:
1. 레거시 `psdParser.ts`(701줄)가 활성 경로에서 호출되는지 확인 — 호출처 0이면 삭제 후보로 플래그, 있으면 유지 — AC: grep으로 import 확인, 결과를 이 dossier에 갱신. (Haiku)
2. 회귀테스트만 추가/유지 — 기존 `psdParser.test.ts` 통과 확인, ag-psd 경로 e2e 테스트 1건 추가 — AC: PSD 업로드→템플릿 변환→저장 플로우 테스트 통과. (Sonnet)

**의존·순서**: 독립적. 리팩터·신기능 우선순위에서 후순위 배치(TOP50 리스트에도 미포함 — 즉 Tier 0/1 작업 완료 후 검토).
