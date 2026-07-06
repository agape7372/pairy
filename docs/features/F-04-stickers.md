# F-04 스티커(UserSticker)   [real]

**WHAT**: 사용자 업로드/보유 스티커를 캔버스에 배치. 패널은 `src/components/editor/canvas/stickers/UserStickerPanel.tsx`, 렌더링은 `TemplateRenderer.tsx`의 스티커 map 및 F-01의 `StickerRenderer`.

**현재상태**: 실동작(FACT). 직접 확인 결과 스티커 관련 리스트 렌더는 이미 안전한 key를 사용 중 — `UserStickerPanel.tsx`(528-535행)와 `TemplateRenderer.tsx`(203-208행) 모두 `key={sticker.id}`(배열 index 아님). **감사 원문의 "배열 index를 key로(13파일)" 경고는 스티커 자체가 아니라 다른 리스트(템플릿 그리드·폰트 목록 등)를 가리킴 — 이 기능 범위에선 해당 결함 미확인.**

**스펙정합**: 스펙 문서상 스티커 기능 요구사항과 일치. 별도 이탈 없음.

**문제·리스크**: 이 기능 자체에서 직접 확인된 신규 리스크 없음. (Tier 2 "index-key 교체" 작업은 다른 파일들을 대상으로 별도 진행 필요 — F-04 dossier에 배정된 건 오분류 가능성 있음, 아래 "다음작업" 참고.)

**Fable판정**: **존치** — 수정 불필요. 감사 인벤토리의 "index-key 교체(Haiku)" 태스크는 스티커 파일이 아닌 다른 위치(템플릿 그리드 등)일 가능성이 높으므로, 하위 모델은 실행 전 grep으로 실제 대상 파일을 먼저 특정할 것.

**다음작업**:
1. 배열 index-key 문제의 실제 소재 파악 — `grep -rn "key={.*index" src/` 등으로 전체 재검색해 어떤 파일이 문제인지 특정 후 개별 dossier 필요 시 신설 — AC: 문제 파일 목록 확정. (Haiku)
2. (스티커 자체는 액션 불필요 — 위 1번 완료 시 F-04는 종결)

**의존·순서**: 독립적. F-01의 렌더러 memo화 작업 시 StickerRenderer도 함께 처리.
