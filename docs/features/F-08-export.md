# F-08 Export(PNG/JPG/WebP+워터마크)   [real]

**WHAT**: 완성 작업물을 이미지로 내보내기. `src/lib/utils/export.ts`(213줄)의 `exportCanvasToImage()`(32-79행), CanvasEditor에서는 TemplateRenderer의 `exportToBlob()`(TemplateRenderer.tsx:114-131행)을 경유.

**현재상태**: 실동작(FACT). PNG/JPG/WebP 포맷, 품질·스케일 조정, 워터마크(텍스트+위치 5종: top-left/top-right/bottom-left/bottom-right/center + 투명도/폰트크기/색상) 지원.

**스펙정합**: 07-api-design.md·05-tech-stack.md의 export 요구사항과 일치. 워터마크는 "도난 방지" 목적으로 문서화됐으나(00-overview.md의 "도난 걱정 해결" 약속) 현재는 단순 텍스트 오버레이 수준 — 우클릭 방지·AI 노이즈 삽입 등 강화된 도난방지는 미구현.

**문제·리스크**: 감사 §3.5 파워유저 관점 — "틀 도난 방지(워터마크·우클릭·AI노이즈) 미구현"이 페어리의 핵심 약속("도난 걱정 해결")과 갭. 현재 워터마크는 텍스트 오버레이일 뿐 실질적 도난 억제력 낮음(Medium, 신뢰 리스크이지 기능 버그 아님).

**Fable판정**: **존치** — export 기능 자체는 정상 동작. 워터마크는 더 강한 도난방지 기능으로 승격 검토 대상(신규 개발이지 버그 수정 아님).

**다음작업**:
1. 현재 워터마크 강도 평가(제거 난이도) 및 강화 옵션 설계(반투명 패턴 반복, 메타데이터 삽입 등) — AC: 설계 문서 1페이지, Fable/CTO 승인 후 구현 착수. (Sonnet, 설계는 Fable)
2. TOP50 Tier 2 "워터마크/도난방지 실구현" 항목과 연계해 실행. (Sonnet)

**의존·순서**: 독립적으로 진행 가능. 우선순위는 Tier 0(보안·결제) 완료 후 — 크리에이터 신뢰 기능이지 파운데이션 이슈는 아님.
