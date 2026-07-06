# F-16a 틀 빌더(templates/new PSD)   [stub(비데모 save=console.log+가짜 성공 토스트)]

**WHAT**: 크리에이터가 PSD 등을 업로드해 신규 틀(템플릿)을 만드는 페이지. `src/app/(main)/templates/new/page.tsx`(707줄).

**현재상태**: stub(FACT). 249-271행은 `IS_DEMO_MODE` 분기에서만 `saveCustomTemplate()`로 localStorage에 실제 저장. **비데모(실 Supabase 설정) 분기는 273행 TODO 주석만 있고 실제 저장 로직이 없음** — 282행 `console.log('Template data:', templateData)`, 283행 `toast.success('템플릿이 저장되었습니다!')`로 **저장 없이 성공했다고 사용자에게 거짓 표시**.

**스펙정합**: 06-database-schema.md의 templates 테이블 insert 경로가 스펙이나 미구현 — "저장됨" UI 피드백과 실제 데이터 영속 사이 괴리가 스펙 이탈이자 사용자 기만.

**문제·리스크**: **High** — 실 Supabase 환경에서 크리에이터가 신규 틀을 업로드해도 조용히 소실되고 성공 토스트만 뜸(감사 §M-2와 동일 계열, "완성됐지만 미배선"의 가장 나쁜 변종 — 미배선을 넘어 **거짓 피드백**). 신뢰 손상 리스크 크다.

**Fable판정**: **수정** — 실 insert 배선이 이상적이나, 최소한 지금 당장은 "정직한 토스트"(예: "이 기능은 준비 중입니다" 또는 데모 저장 안내)로 바꿔 거짓 성공을 제거하는 것이 최우선(신뢰 문제는 기능 부재보다 나쁨).

**다음작업**:
1. **(즉시, 저비용)** page.tsx:271-284의 비데모 분기에서 `console.log`+가짜 성공 토스트를 제거하고 실패 또는 "준비 중" 안내로 교체 — AC: 실 Supabase 환경에서 저장 시도 시 사용자가 "저장 안 됨"을 명확히 인지. (Sonnet)
2. **(본작업)** Supabase `templates` 테이블에 실제 insert 로직 구현(이미지 업로드 포함) — AC: 신규 틀 생성→목록(F-15)에 노출 확인. (Sonnet)

**의존·순서**: 1번은 즉시 독립 실행 가능(하위 모델이 가장 먼저 처리할 저비용 고가치 항목). 2번은 F-15(useTemplates 연결)와 짝 — 업로드된 틀이 실제로 목록에 뜨는지까지 확인해야 완결.
