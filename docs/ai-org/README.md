# 페어리 AI 조직 (Fable 중심 · 계승 구조)

> 페어리는 AI(Claude)로 대량 구축됐다(298커밋 중 168 Claude). 속도를 얻었으나 "아무도 안 함을 결정 안 하는" 스코프 스프롤이 부산물이었다. 이 폴더는 그 해독제 — **Fable을 두뇌로 하위 모델을 실행 에이전트로 쓰되, Fable의 사고와 결정을 명문화해 후계 모델이 계승**하게 한다.

## 문서
| 문서 | 역할 |
|---|---|
| [thinking-protocol.md](./thinking-protocol.md) | Fable 사고 절차(어떻게 판단하는가) — 계승의 핵심 |
| [constitution.md](./constitution.md) | AI 헌법(안전·품질·라우팅·커밋·승계·증류) — 온보딩 1문서 |
| [strategy-genome.md](./strategy-genome.md) | 전략 DNA(타깃·MVP 경계·**안 할 것**·해자) — 스프롤 앵커 |
| [routing.md](./routing.md) | 모델 분배(Fable/Opus/Sonnet/Haiku) |
| [decisions/](./decisions/) | 의사결정 원장(1결정=1파일, "왜 안 했나"까지) |

## 8계층 조직 (사용자 요청 §4)
1. 의사결정(Fable만) → [decisions/](./decisions/) · 2. 기억(3원장) → constitution §6 · 3. 작업분배 → routing.md · 4. 검수(독립 적대 검증) · 5. 자기교정(systematic-debugging) · 6. 통신(구조화 출력) · 7. 컨텍스트(1차 근거 전달) · 8. 장애대응(재시도·명시 로그).

## 계승 구조 (사용자 요청 §5 · Fable 이후 시대)
- **Fable Thinking Protocol** → thinking-protocol.md
- **Decision Memory Layer** → decisions/DL-####
- **Reasoning Archive** → 위키 불변 리포트 + `docs/audit-2026-07-05/`
- **Strategy Genome** → strategy-genome.md
- **Agent Constitution** → constitution.md
- **Replacement Brain Protocol** → constitution §7(재현 테스트 통과 후 승계)
- **Knowledge Distillation** → constitution §8(CLAUDE.md·스킬로 증류)

## 지금 열려있는 결정
- [DL-0001](./decisions/DL-0001-runtime-direction.md) — 런타임 결별 방향 (OPEN, 스파이크)
- [DL-0002](./decisions/DL-0002-auth-minimal-pii.md) — 인증 최소 PII (DECIDED)

## 관련
- 감사 정본: [../audit-2026-07-05/](../audit-2026-07-05/)
- 기능별 밑작업: [../features/](../features/)
- 테스트: [../testing/](../testing/)
