# Pairy - 디자인 모션 페이즈 (Design Motion Phase)

## 개요

이 문서는 **마법적 UI 모션**을 Pairy에 적용하기 위한 별도의 디자인 페이즈입니다.
기존 Phase 1-3의 기능 개발과 **병렬로 진행**되며, 각 기능 스프린트에 맞춰 점진적으로 적용합니다.

### 디자인 모션 철학

| 항목 | 내용 |
|------|------|
| **핵심 스타일** | CSS 중심 (88%+), 레이어드 애니메이션, 커스텀 이징 |
| **디자인 철학** | "마법 세계", "감정 표현", "부드러운 인터랙션" |
| **참고 프로젝트** | Cowardly Witch, DropOut (CSS 애니메이션 아트) |

---

## 디자인 모션 레벨

### Level 0: 기본 (현재 상태)
```css
/* 03-design-system.md에 정의된 기본 애니메이션 */
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
--ease-out: cubic-bezier(0, 0, 0.2, 1);
```

### Level 1: 향상된 기본 모션
- 스크롤 기반 reveal 애니메이션
- 부드러운 호버 효과
- 기본 stagger 애니메이션

### Level 2: 마법적 스타일 도입
- 커스텀 이징 함수
- 다층 레이어 애니메이션
- 마우스 따라가기 효과

### Level 3: 마법적 경험
- 파티클 시스템 (CSS 기반)
- 스토리텔링 트랜지션
- 감정적 피드백 애니메이션

---

## 스프린트별 디자인 작업

### Phase 1 (MVP)과 병렬

| 스프린트 | 기능 개발 | 디자인 모션 작업 |
|----------|----------|-----------------|
| Sprint 1 | 프로젝트 셋업 | Level 1 기반 구축, 커스텀 이징 정의 |
| Sprint 2 | 틀 아카이브 | 카드 호버 효과, 스크롤 reveal |
| Sprint 3-4 | 캔버스 에디터 | 에디터 UI 트랜지션, 도구 전환 효과 |
| Sprint 5 | 내보내기 | 완료 애니메이션, 성공 피드백 |

### Phase 2 (Growth)와 병렬

| 스프린트 | 기능 개발 | 디자인 모션 작업 |
|----------|----------|-----------------|
| Sprint 6-7 | 결제 시스템 | 구독 카드 효과, 결제 플로우 애니메이션 |
| Sprint 8-9 | 협업 강화 | 커서 공유 효과, 실시간 하이라이트 |
| Sprint 10-11 | 모바일 최적화 | 터치 피드백, 제스처 애니메이션 |

### Phase 3 (Expansion)와 병렬

| 스프린트 | 기능 개발 | 디자인 모션 작업 |
|----------|----------|-----------------|
| Sprint 12-14 | 마켓플레이스 | 상품 카드 애니메이션, 갤러리 효과 |
| Sprint 15-16 | 고급 에디터 | Level 3 마법 효과, 파티클 |
| Sprint 17-18 | 커뮤니티 | 소셜 피드백, 이벤트 애니메이션 |

---

## 기술 구현 사항

### 1. 커스텀 이징 라이브러리

```css
/* 마법적 스타일 이징 함수 */
:root {
  /* 부드러운 시작 */
  --ease-soft-out: cubic-bezier(0.23, 1, 0.32, 1);

  /* 바운스 느낌 */
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* 마법적 출현 */
  --ease-magic: cubic-bezier(0.165, 0.84, 0.44, 1);

  /* 우아한 퇴장 */
  --ease-elegant-out: cubic-bezier(0.19, 1, 0.22, 1);
}
```

### 2. 스크롤 Reveal 훅

```typescript
// src/hooks/useScrollReveal.ts (기존)
// - useScrollReveal: 단일 요소 reveal
// - useStaggerReveal: 순차 reveal
// - useCountUp: 숫자 카운터
// - useParallax: 패럴랙스 효과
// - useMouseFollow: 마우스 따라가기
```

### 3. 애니메이션 유틸리티 클래스

```css
/* Level 1: 기본 reveal */
.reveal-fade { /* fadeIn 애니메이션 */ }
.reveal-slide { /* slideUp 애니메이션 */ }
.reveal-scale { /* scaleIn 애니메이션 */ }

/* Level 2: stagger 효과 */
.stagger-children > * { /* 순차 지연 */ }

/* Level 3: 마법 효과 */
.magic-glow { /* 부드러운 글로우 (절제됨) */ }
.magic-float { /* 떠다니는 효과 */ }
.magic-sparkle { /* 반짝임 (CSS 파티클) */ }
```

---

## 디자인 원칙

### Pairy에 맞는 마법적 스타일 적용

| 레퍼런스 원본 | Pairy 적용 |
|-------------|-----------|
| 강렬한 컬러 | 파스텔 핑크/민트 (브랜드 유지) |
| 화려한 파티클 | 절제된 반짝임 (성능 고려) |
| 풀스크린 애니메이션 | 요소 단위 미세 모션 |
| 다크 배경 중심 | 밝은 배경 + 부드러운 그림자 |

### 성능 가이드라인

1. **CSS 우선**: JavaScript 애니메이션 최소화
2. **will-change 사용**: 애니메이션 요소에만 적용
3. **transform/opacity**: 리페인트 유발 속성 회피
4. **prefers-reduced-motion**: 접근성 존중

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 구현된 훅/컴포넌트 목록

### 현재 구현됨

| 파일 | 기능 | 레벨 |
|------|------|------|
| `useScrollReveal.ts` | 스크롤 reveal, stagger, countUp, parallax, mouseFollow | Level 1-2 |
| `useStaggeredGrid.ts` | 그리드 순차 애니메이션 | Level 1 |
| `useMagneticHover.ts` | 자석 호버 효과 | Level 2 |

### 추가 예정

| 파일 | 기능 | 레벨 | 적용 스프린트 |
|------|------|------|--------------|
| `useTypewriter.ts` | 타이핑 효과 | Level 2 | Sprint 2 |
| `useParticle.ts` | CSS 파티클 시스템 | Level 3 | Sprint 15 |
| `useMorphTransition.ts` | 형태 변환 트랜지션 | Level 3 | Sprint 16 |

---

## 레퍼런스

### 참고 기술
- CSS Houdini (미래 고려)
- Web Animations API
- Intersection Observer API

---

## 주의사항

1. **기능 우선**: 디자인 모션은 핵심 기능 완성 후 적용
2. **점진적 적용**: 한 번에 모든 효과 적용하지 않음
3. **브랜드 일관성**: 레퍼런스 스타일을 그대로 복사하지 않고, Pairy 브랜드에 맞게 변형
4. **성능 모니터링**: Core Web Vitals 저하 시 즉시 롤백

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2025-12-30 | 초기 문서 작성 |
