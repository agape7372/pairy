# UI/UX & 애니메이션 디자인 리서치 2025

> 리서치 일자: 2025-12-30
> 목적: Pairy 프로젝트의 디자인 품질 향상을 위한 트렌드 및 테크닉 조사

---

## 1. 2025 UI/UX 디자인 트렌드

### 1.1 주요 트렌드 요약

| 트렌드 | 설명 | 적용 가능성 |
|--------|------|------------|
| **AI 통합** | AI 기반 개인화, 실시간 UI 조정 | 중간 |
| **초개인화** | 사용자별 맞춤 콘텐츠 및 동적 UI | 높음 |
| **Glassmorphism** | 반투명 표면, 프로스트 글래스 효과 | 높음 |
| **다크모드 + 네온** | 고대비, 미래적 심미성 | 중간 |
| **Bento Grid** | 일본 도시락 박스 스타일 그리드 | 높음 |
| **3D & 몰입형** | AR/VR 요소, 공간 네비게이션 | 낮음 |
| **지속가능한 디자인** | 저에너지 UI, 최적화된 애니메이션 | 높음 |

### 1.2 디자인 철학 변화

**미니멀리즘의 진화**
- 단순한 클린 라인이 아닌 **동적이고 참여적인** 미니멀리즘
- 마이크로인터랙션과 전략적 컬러 포인트로 주의 유도
- 사용자를 압도하지 않으면서 콘텐츠에 집중

**2025 한국 트렌드 (특이사항)**
- 맥시멀리즘 회귀: 비대칭, 대담한 타이포그래피
- Y2K 감성과 3D 요소 결합
- "완벽함에서 벗어나기": 의도적 불균형, 손글씨 스타일
- '그린 UX': 환경적 지속가능성 고려

**ROI 참고**: UX 투자 $1당 약 $100 수익 (9,900% ROI)

---

## 2. 마이크로인터랙션 & 모션 디자인

### 2.1 핵심 마이크로인터랙션 패턴

```
┌─────────────────────────────────────────────────────────┐
│  Dan Saffer의 4단계 프레임워크                          │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐ │
│  │ Trigger │ → │  Rule   │ → │Feedback │ → │ Loops   │ │
│  │ 트리거  │   │  규칙   │   │  피드백 │   │ & Modes │ │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.2 2025 인기 마이크로인터랙션

1. **Skeleton Loaders & Shimmer**: 부드러운 로딩 상태
2. **Animated Button Responses**: 성공/에러 피드백
3. **Live Form Validation**: 실시간 필드 검증
4. **Branded Pull-to-Refresh**: 브랜드화된 새로고침
5. **Scroll-Triggered Animations**: 스크롤 기반 애니메이션
6. **Waveform Feedback**: 음성 상호작용 피드백

### 2.3 타이밍 가이드

| 애니메이션 유형 | 권장 시간 |
|----------------|----------|
| 마이크로 애니메이션 | 200-500ms |
| 네비게이션 트랜지션 | 300-500ms |
| 페이지 전환 | 300-500ms |
| 모달 열기/닫기 | 200-300ms |

### 2.4 모션 디자인 원칙

**Disney 12원칙 기반 적용**
- **Easing**: 자연스러운 움직임 (linear 지양)
- **Anticipation**: 동작 전 작은 힌트
- **Follow Through**: 동작 후 잔여 움직임
- **Secondary Action**: 보조 동작으로 생동감

**디자인 시스템별 원칙**
- Material Design: Informative, Focused, Expressive
- Fluent Design: Physical, Functional, Continuous, Contextual
- Adobe Spectrum: Purposeful, Intuitive, Seamless

---

## 3. CSS 호버 & 트랜지션 효과

### 3.1 2025 인기 카드 호버 효과

#### 3D Tilt Effect
```css
.card {
  transform: perspective(1000px);
  transition: transform 0.3s ease;
}
.card:hover {
  transform: perspective(1000px) rotateX(5deg) rotateY(-5deg) scale(1.02);
}
```

#### Holographic Effect
- 스케일 업 + 컬러풀 보더 쉐도우
- `::before` 가상요소로 홀로그래픽 그라디언트

#### Glassmorphism Card
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

#### Content Reveal
- 호버 시 숨겨진 콘텐츠 슬라이드 업
- `clip-path` 또는 `overflow: hidden` 활용

### 3.2 그라디언트 보더 애니메이션

```css
@property --angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.gradient-border {
  background: conic-gradient(from var(--angle), #ff6b6b, #4ecdc4, #ff6b6b);
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  to { --angle: 360deg; }
}
```

### 3.3 추천 리소스

- [FreeFrontend - 32 CSS Card Hover Effects](https://freefrontend.com/css-card-hover-effects/)
- [Polypane - CSS 3D Transform Examples](https://polypane.app/css-3d-transform-examples/)
- [Codrops](https://tympanus.net/codrops/) - 고급 UI 효과

---

## 4. 레이아웃 트렌드: Bento Grid

### 4.1 개념
일본 도시락 박스(벤토)에서 영감받은 그리드 레이아웃
- 각 컴파트먼트가 특정 기능/콘텐츠를 담당
- 다양한 미디어 타입 조합에 효과적
- Apple 제품 페이지에서 대중화

### 4.2 장점
- 명확한 시각적 계층 구조
- 다양한 콘텐츠 타입 조화롭게 표시
- 반응형 디자인에 유연하게 적용
- 미니멀리즘과 잘 어울림

### 4.3 구현 팁
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
.bento-item.large {
  grid-column: span 2;
  grid-row: span 2;
}
```

### 4.4 레퍼런스
- [BentoGrids.com](https://bentogrids.com/) - 큐레이션 갤러리
- Apple, Framer, Supabase 웹사이트

---

## 5. 스크롤 기반 애니메이션

### 5.1 Intersection Observer API

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      observer.unobserve(entry.target); // 성능 최적화
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px' // 조기 트리거
});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

### 5.2 CSS Scroll-Driven Animations (2024+)

```css
.parallax-element {
  animation: parallax linear;
  animation-timeline: scroll();
}

@keyframes parallax {
  from { transform: translateY(100px); }
  to { transform: translateY(-100px); }
}
```

### 5.3 스태거드 애니메이션

```css
.grid-item {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  animation-delay: calc(var(--index) * 100ms);
}
```

---

## 6. Skeleton Loading & Shimmer

### 6.1 기본 구현

```css
.skeleton {
  background: #e0e0e0;
  position: relative;
  overflow: hidden;
}

.skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
```

### 6.2 동기화된 Shimmer
여러 요소에 통일된 shimmer 효과를 주려면:
```css
.skeleton::after {
  background-attachment: fixed;
}
```

### 6.3 모범 사례
- 왼쪽→오른쪽 적당히 느린 애니메이션이 가장 효과적
- 실제 콘텐츠 레이아웃과 일치하는 형태
- 로딩 중임을 명확히 전달

---

## 7. 일본/카와이 디자인 요소

### 7.1 카와이 디자인 특징

| 요소 | 설명 |
|------|------|
| **캐릭터** | 큰 머리, 작은 몸, 큰 눈, 통통한 볼 |
| **색상** | 파스텔 톤 (베이비 핑크, 민트, 라벤더) |
| **패턴** | 폴카 도트, 하트, 별, 스트라이프 |
| **형태** | 둥글고 부드러운 모서리 |
| **심리적 효과** | 긍정적 감정, 집중력 향상, 치유 효과 |

### 7.2 일본 웹 디자인 특징

- **세로 타이포그래피** (Tategaki): 전통적 세로쓰기
- **관습 거부**: 독특하고 차별화된 레이아웃
- **정보 밀도**: 서양보다 높은 콘텐츠 밀도 허용

### 7.3 Pairy 적용 포인트
- 이미 파스텔 핑크/민트 사용 중 → 카와이 감성과 일치
- 둥근 모서리, 부드러운 그림자 유지
- 캐릭터/마스코트 도입 고려

---

## 8. 가격표(Pricing Page) 디자인

### 8.1 베스트 프랙티스

1. **3-4개 플랜이 이상적**: 너무 많으면 혼란, 적으면 유연성 부족
2. **추천 플랜 강조**: "인기" 또는 "추천" 배지
3. **좌→우 저가→고가 배치**
4. **연간/월간 토글**: 연간 결제 할인 강조
5. **투명한 가격**: 숨겨진 비용 없이
6. **소셜 프루프**: 고객 후기, 로고
7. **무료 체험**: 전환율 향상

### 8.2 인터랙티브 요소

- 슬라이더로 예상 사용량 기반 가격 조정
- 드롭다운/토글로 화면 콘텐츠 최소화
- 즉시 업데이트되는 반응형 UI

### 8.3 서브컬쳐 친화적 접근 (Pairy 적용)

**기존 SaaS 스타일 대신:**
- "구독" → "서포터", "후원" 프레이밍
- 공격적 CTA → 부드럽고 친근한 초대
- 기능 나열 → 커뮤니티 참여 강조
- Ko-fi, pixiv FANBOX 스타일 참고

---

## 9. 고급 CSS 애니메이션 테크닉

### 9.1 Spring Physics (자연스러운 움직임)

```javascript
// Framer Motion 예시
<motion.div
  animate={{ x: 100 }}
  transition={{
    type: "spring",
    stiffness: 200,  // 높을수록 빠름
    damping: 15,     // 높을수록 덜 튐
    mass: 1          // 높을수록 무거움
  }}
/>
```

**왜 스프링이 자연스러운가?**
- 현재 위치, 속도, 질량을 기반으로 다음 프레임 계산
- 제스처에서 자연스럽게 이어지는 애니메이션
- 중단 가능(interruptible)

### 9.2 Blob/Liquid 효과

```css
.blob {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  animation: morph 8s ease-in-out infinite;
}

@keyframes morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
}
```

**Gooey Effect (끈적한 효과)**
```css
.goo-container {
  filter: blur(10px) contrast(20);
}
```

### 9.3 Noise/Grain 텍스처

```html
<svg style="display: none;">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4"/>
  </filter>
</svg>

<style>
.grainy {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
.grainy::before {
  content: '';
  position: absolute;
  inset: 0;
  filter: url(#noise);
  opacity: 0.3;
}
</style>
```

### 9.4 Magnetic Button

```javascript
button.addEventListener('mousemove', (e) => {
  const rect = button.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;

  gsap.to(button, {
    x: x * 0.3,
    y: y * 0.3,
    duration: 0.3
  });
});

button.addEventListener('mouseleave', () => {
  gsap.to(button, { x: 0, y: 0, duration: 0.3 });
});
```

### 9.5 Text Split & Reveal

```javascript
// SplitType 사용
const text = new SplitType('.heading', { types: 'chars' });

gsap.from(text.chars, {
  y: 100,
  opacity: 0,
  duration: 0.5,
  stagger: 0.02,
  ease: "power2.out"
});
```

---

## 10. 접근성 고려사항

### 10.1 prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 10.2 대체 전략

애니메이션 완전 제거 대신:
- **scaling/rotating** → **fade/opacity** 전환
- **parallax** → 비활성화
- **auto-play 비디오** → 비활성화
- 교육적/기능적 트랜지션은 유지

### 10.3 영향받는 사용자
- 전정기관 장애: 70백만+ 명 글로벌
- 주의력 장애
- 모션 민감성

---

## 11. 실용적 코드 스니펫

### 11.1 Scroll Reveal Hook (React)

```typescript
function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```

### 11.2 Tilt Effect Hook (React)

```typescript
function useTiltEffect(intensity = 15) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    setTransform(
      `perspective(1000px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) scale3d(1.02, 1.02, 1.02)`
    );
  };

  const handleMouseLeave = () => setTransform('');

  return { ref, transform, handleMouseMove, handleMouseLeave };
}
```

### 11.3 Animated Counter

```typescript
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.floor(eased * target));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isVisible, target, duration]);

  return { ref, count, setIsVisible };
}
```

---

## 12. 레퍼런스 & 리소스

### 12.1 영감 사이트
- [Dribbble](https://dribbble.com/tags/ui_animation) - UI 애니메이션
- [Awwwards](https://www.awwwards.com/awwwards/collections/transitions/) - 페이지 트랜지션
- [Codrops](https://tympanus.net/codrops/) - 고급 UI 효과
- [BentoGrids](https://bentogrids.com/) - 벤토 레이아웃

### 12.2 도구
- [fffuel nnnoise](https://www.fffuel.co/nnnoise/) - SVG 노이즈 생성기
- [Grainy Gradients Playground](https://grainy-gradients.vercel.app) - 그레인 그라디언트
- [Blobz](https://toruskit.com/tools/blobz) - CSS 블롭 생성기

### 12.3 라이브러리
- **GSAP**: 고성능 애니메이션 라이브러리
- **Framer Motion**: React 애니메이션
- **Anime.js**: 경량 JS 애니메이션
- **Lenis**: 부드러운 스크롤

### 12.4 학습 자료
- [Josh Comeau's CSS Guide](https://www.joshwcomeau.com/animation/keyframe-animations/)
- [Motion Dev Docs](https://motion.dev/docs)
- [CSS-Tricks Animation Articles](https://css-tricks.com/tag/animation/)

---

## 13. Pairy 적용 권장사항

### 13.1 즉시 적용 가능

| 기법 | 적용 위치 | 난이도 |
|------|----------|-------|
| Scroll Reveal | 메인 페이지 섹션 | 낮음 |
| Skeleton Loading | 템플릿 로딩 | 낮음 |
| Staggered Grid | 템플릿 그리드 | 중간 |
| Tilt Effect | 특별 카드 | 중간 |
| Glassmorphism | 모달, 카드 | 낮음 |

### 13.2 고려할 효과

| 기법 | 장점 | 주의사항 |
|------|------|---------|
| Magnetic Button | 인터랙티브 | 터치 디바이스 호환성 |
| Blob Background | 생동감 | 성능 모니터링 |
| Noise Texture | 질감 | 미묘하게 사용 |
| Parallax | 깊이감 | 접근성 |

### 13.3 디자인 원칙 정렬

Pairy 디자인 시스템과 조화:
- **Soft & Rounded**: 둥근 모서리, 부드러운 그림자 유지
- **Pastel & Calm**: 파스텔 톤 애니메이션
- **Clean & Minimal**: 과도한 효과 지양
- **200-300ms 트랜지션**: 빠르고 자연스럽게

---

## 14. 디자인 시스템 사례 분석

### 14.1 주요 디자인 시스템

| 시스템 | 특징 | Pairy 참고 포인트 |
|--------|------|------------------|
| **Carbon (IBM)** | 포괄적 문서화, 접근성 중심 | 컴포넌트 문서화 방식 |
| **Atlassian** | 사용 사례별 상세 가이드 | UX 가이드라인 |
| **Chakra UI** | 접근성 우선, 직관적 API | React 컴포넌트 패턴 |
| **Radix UI** | Headless, 로직/스타일 분리 | 유연한 컴포넌트 |
| **shadcn/ui** | Tailwind 기반, 복사-붙여넣기 | 빠른 구현 |

### 14.2 Linear 디자인 철학
- 극도로 정제된 미니멀리즘
- 키보드 중심 인터페이스
- 부드러운 애니메이션과 피드백
- 다크모드 최적화

---

## 15. 게이미피케이션 & 감정적 디자인

### 15.1 게이미피케이션 요소

| 요소 | 목적 | 예시 |
|------|------|------|
| **배지/뱃지** | 성취감, 인정 | Duolingo 스트릭 배지 |
| **레벨/랭크** | 진행감 | 사용자 등급 시스템 |
| **포인트** | 보상, 동기부여 | 활동 포인트 |
| **리더보드** | 경쟁, 비교 | 주간 랭킹 |
| **진행바** | 목표 시각화 | 프로필 완성도 |
| **챌린지** | 참여 유도 | 주간 미션 |

### 15.2 감정적 디자인 (Emotional Design)

**Donald Norman의 3단계**
1. **Visceral**: 첫인상, 시각적 매력
2. **Behavioral**: 사용성, 기능성
3. **Reflective**: 의미, 자아 정체성

**Delight Moments 만들기**
- Asana의 "Celebration Creatures" (작업 완료 시)
- Mailchimp의 하이파이브 애니메이션
- Twitter/X의 하트 애니메이션

### 15.3 Pairy 적용
- 크리에이터 배지 시스템
- 다운로드/좋아요 마일스톤 축하
- 서포터 전용 시각적 구분

---

## 16. Empty State & 에러 UI

### 16.1 Empty State 유형

| 유형 | 상황 | 디자인 접근 |
|------|------|------------|
| **First Use** | 신규 사용자 | 가이드, CTA |
| **User Cleared** | 작업 완료 | 축하, 다음 액션 |
| **No Results** | 검색 결과 없음 | 대안 제시 |
| **Error** | 문제 발생 | 명확한 설명, 해결책 |

### 16.2 모범 사례
```
┌─────────────────────────────────────┐
│         [일러스트/아이콘]           │
│                                     │
│      "아직 저장한 자료가 없어요"     │
│    마음에 드는 자료를 찾아보세요     │
│                                     │
│       [ 자료 둘러보기 → ]           │
└─────────────────────────────────────┘
```

### 16.3 창의적 404 페이지 예시
- **IKEA**: 404를 제품으로 표현
- **Figma**: 인터랙티브 벡터 조작
- **Spotify**: "404s and Heartbreaks" 플레이리스트 컨셉

---

## 17. 온보딩 UX 패턴

### 17.1 주요 패턴

| 패턴 | 설명 | 사용 시점 |
|------|------|----------|
| **Welcome Message** | 첫 인사, 기대 설정 | 첫 로그인 |
| **Product Tour** | 3-5개 툴팁 가이드 | 핵심 기능 소개 |
| **Checklist** | 완료해야 할 작업 목록 | 설정 과정 |
| **Progress Bar** | 완료율 시각화 | 긴 설정 과정 |
| **Persona-Based** | 사용자 유형별 맞춤 | 다양한 사용 사례 |

### 17.2 2025 AI 트렌드
- 사용자 행동 기반 적응형 플로우
- AI 기반 세그먼테이션
- 실시간 생성 가이드 콘텐츠

### 17.3 핵심 원칙
- 첫 사용 80% 이탈 방지
- 3-5개 핵심 액션에 집중
- Progressive Disclosure
- 바로 가치를 경험하게

---

## 18. 타이포그래피 트렌드 2025

### 18.1 Variable Fonts

```css
/* 단일 파일로 다양한 스타일 */
@font-face {
  font-family: 'InterVariable';
  src: url('Inter.var.woff2') format('woff2');
  font-weight: 100 900;
}

.text {
  font-variation-settings: 'wght' 450;
}
```

**장점**:
- 파일 크기 감소 (여러 폰트 → 1개)
- 반응형 타이포그래피
- 부드러운 가중치 전환 애니메이션

### 18.2 2025 트렌드

| 트렌드 | 설명 |
|--------|------|
| **세리프 복귀** | 따뜻함, 신뢰감 |
| **3D/Inflated** | 입체감, 장난스러움 |
| **Art Deco** | 기하학적, 럭셔리 |
| **손글씨 스타일** | 진정성, 개인적 느낌 |
| **Fluid Typography** | `clamp()` 활용 반응형 |

### 18.3 Fluid Typography 예시
```css
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
}
```

---

## 19. UI 컴포넌트 베스트 프랙티스

### 19.1 Toast/Snackbar

| 항목 | 가이드라인 |
|------|-----------|
| **위치** | 모바일: 하단, 웹: 우하단 |
| **시간** | 3-5초 (글자 수에 따라) |
| **개수** | 한 번에 1개만 |
| **액션** | 간단하고 되돌리기 쉬운 것만 |

### 19.2 Modal/Dialog

**사용 시점**:
- 중요한 확인 필요 (삭제, 결제)
- 집중 필요한 입력 폼
- 컨텍스트 전환

**피해야 할 상황**:
- 에러 메시지 (배너 사용)
- 연속 모달
- 너무 자주 사용

### 19.3 Form Validation

```
┌─ 인라인 검증 ─────────────────────┐
│ ✓ 이메일, 비밀번호 즉시 피드백    │
│ ✓ 필드 이탈 시 검증              │
│ ✗ 타이핑 중 방해하지 않기        │
└──────────────────────────────────┘

┌─ 제출 후 검증 ────────────────────┐
│ ✓ 복잡한 폼에 적합               │
│ ✓ 전체 에러 한 번에 표시         │
│ ✓ 인라인과 하이브리드 가능       │
└──────────────────────────────────┘
```

---

## 20. 마켓플레이스 UX

### 20.1 필터 UI 베스트 프랙티스

- **필터 상태 명확히**: 적용된 필터 칩으로 표시
- **결과 수 표시**: 각 옵션 옆에 개수
- **실시간 업데이트**: 필터 변경 시 즉시 반영
- **카테고리별 필터**: 상품 유형에 맞는 필터

### 20.2 검색 UX

- 검색바 상단 중앙 배치
- 자동완성 드롭다운
- 최근 검색, 최근 본 항목
- Federated Search (여러 카테고리 동시)

### 20.3 갤러리 레이아웃

| 레이아웃 | 특징 | 사용 사례 |
|----------|------|----------|
| **Grid** | 균일, 정돈됨 | 상품 목록 |
| **Masonry** | Pinterest 스타일 | 다양한 비율 이미지 |
| **Quilted** | Google Photos | 하이라이트 강조 |

---

## 21. 다크모드 디자인

### 21.1 색상 가이드라인

| 요소 | 권장 | 피해야 할 것 |
|------|------|-------------|
| **배경** | `#121212` (다크 그레이) | `#000000` (순수 검정) |
| **텍스트** | `rgba(255,255,255,0.87)` | `#FFFFFF` (순수 흰색) |
| **강조색** | 채도 낮춘 파스텔 | 과포화 네온 |

### 21.2 접근성 체크

- 텍스트 대비: 4.5:1 이상
- UI 요소 대비: 3:1 이상
- 난독증 사용자: 극단적 대비 피하기
- 사용자 선택권 제공

---

## 22. 네오브루탈리즘 (Neubrutalism)

### 22.1 특징

"Anti-design" 철학으로 기존 UI 규칙을 거부

| 요소 | 설명 |
|------|------|
| **색상** | 클래시, 고대비, 미우트 |
| **그림자** | 하드 쉐도우, 오프셋 |
| **타이포** | 대담하지만 가독성 유지 |
| **보더** | 두꺼운 검정 테두리 |
| **그라디언트** | 없음 (플랫 컬러) |

### 22.2 대표 사례
- Figma 웹사이트
- Gumroad
- WORKWITHUS

### 22.3 Pairy와의 관계
Pairy의 "Soft & Calm" 원칙과는 상반됨. 부분적 요소만 참고 가능:
- 특별 이벤트 페이지
- 크리에이터 프로필 커스텀 옵션

---

## 23. 반응형 디자인 2025

### 23.1 브레이크포인트

| 디바이스 | 너비 |
|----------|------|
| 모바일 | 360-480px |
| 태블릿 | 768px |
| 데스크탑 | 1024-1280px |
| 대형 | 1440px+ |

### 23.2 Mobile-First 원칙

1. 모바일 뷰포트 먼저 디자인
2. Progressive Enhancement로 확장
3. 터치 친화적 (48px 최소 탭 영역)
4. 세로 스크롤 우선

### 23.3 Adaptive Navigation

- 모바일: 햄버거 메뉴
- 태블릿: 아이콘 + 라벨
- 데스크탑: 전체 네비게이션

---

## 24. 프로그레스 인디케이터

### 24.1 대기 시간별 권장

| 시간 | 권장 패턴 |
|------|----------|
| < 1초 | 없음 (글리치 느낌) |
| 1-3초 | 스피너, 스켈레톤 |
| 3-10초 | 진행률 바, 퍼센트 |
| > 10초 | 단계별 진행, 예상 시간 |

### 24.2 인지 속도 향상 팁

```css
/* 끝에서 빨라지는 진행바 → 더 빠르게 느껴짐 */
.progress-bar {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 25. Motion 라이브러리 (구 Framer Motion)

### 25.1 2025 업데이트
- React 19 Concurrent Rendering 지원
- 개선된 Layout Animations
- 대량 요소 성능 향상

### 25.2 핵심 패턴

```tsx
// Exit Animation
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    />
  )}
</AnimatePresence>

// Layout Animation
<motion.div layout>
  {/* 크기/위치 변경 시 자동 애니메이션 */}
</motion.div>

// Gesture
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click
</motion.button>
```

---

## 참고 출처

### UI/UX 트렌드
- [Shakuro - UI/UX Design Trends 2025](https://shakuro.com/blog/ui-ux-design-trends-for-2025)
- [NN/g - The UX Reckoning 2025](https://www.nngroup.com/articles/ux-reset-2025/)
- [Pixelmatters - 8 UI Design Trends 2025](https://www.pixelmatters.com/insights/8-ui-design-trends-2025)

### 마이크로인터랙션
- [Stan Vision - Micro Interactions 2025](https://www.stan.vision/journal/micro-interactions-2025-in-web-design)
- [Interaction Design Foundation](https://www.interaction-design.org/literature/article/micro-interactions-ux)

### CSS 애니메이션
- [CSS-Tricks](https://css-tricks.com)
- [FreeFrontend](https://freefrontend.com)
- [Codrops](https://tympanus.net/codrops)

### 접근성
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Smashing Magazine - Reduced Motion](https://www.smashingmagazine.com/2020/09/design-reduced-motion-sensitivities/)

### 한국/일본 트렌드
- [Wix 한국 블로그 - 2025 웹디자인 트렌드](https://ko.wix.com/blog/post/new-web-design-trends)
- [Humble Bunny - Japanese Web Design](https://www.humblebunny.com/japanese-web-design-trends-in-japan/)

### 디자인 시스템
- [UXPin - Best Design Systems 2025](https://www.uxpin.com/studio/blog/best-design-system-examples/)
- [Carbon Design System](https://carbondesignsystem.com/)
- [Atlassian Design System](https://atlassian.design/)

### 게이미피케이션
- [Arounda - Gamification 2025](https://arounda.agency/blog/gamification-in-product-design-in-2024-ui-ux)
- [Designlab - Gamification in UX](https://designlab.com/blog/gamification-in-ux-enhancing-engagement-and-interaction)

### 온보딩 UX
- [DesignerUp - 200 Onboarding Flows Study](https://designerup.co/blog/i-studied-the-ux-ui-of-over-200-onboarding-flows-heres-everything-i-learned/)
- [Chameleon - Onboarding Patterns](https://www.chameleon.io/blog/onboarding-ux-patterns)

### 크리에이터 플랫폼
- [Sacra - Gumroad Analysis](https://sacra.com/research/gumroad-android-creator-economy/)
- [Whop - Gumroad vs Patreon](https://whop.com/blog/gumroad-vs-patreon/)

### UI 컴포넌트
- [LogRocket - Toast Notifications](https://blog.logrocket.com/ux-design/toast-notifications/)
- [LogRocket - Modal UX](https://blog.logrocket.com/ux-design/modal-ux-design-patterns-examples-best-practices/)
- [Eleken - Empty State UX](https://www.eleken.co/blog-posts/empty-state-ux)

### 마켓플레이스 UX
- [Pencil & Paper - Filter UX](https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-filtering)
- [Rigby - Marketplace UX](https://www.rigbyjs.com/blog/marketplace-ux)

### 타이포그래피
- [Fontfabric - Typography Trends 2025](https://www.fontfabric.com/blog/top-typography-trends-2025/)
- [FontsArena - Variable Fonts 2025](https://fontsarena.com/blog/design-trends-2025-variable-fonts-responsive-typography-studio-workflows/)

### 다크모드 & 접근성
- [Design Studio - Dark Mode Best Practices](https://www.designstudiouiux.com/blog/dark-mode-ui-design-best-practices/)
- [Smashing Magazine - Inclusive Dark Mode](https://www.smashingmagazine.com/2025/04/inclusive-dark-mode-designing-accessible-dark-themes/)

### 네오브루탈리즘
- [Bejamas - Neubrutalism Trend](https://bejamas.com/blog/neubrutalism-web-design-trend)
- [SVGator - Visual Guide](https://www.svgator.com/blog/what-is-neubrutalism/)

### 일러스트레이션
- [Lummi - Illustration Styles 2025](https://www.lummi.ai/blog/illustration-styles-2025)
- [Fireart - Illustration Trends](https://fireart.studio/blog/illustration-trends/)

### 404 페이지
- [404s.design](https://www.404s.design/) - 큐레이션 갤러리
- [Canva - Creative 404 Pages](https://www.canva.com/learn/404-page-design/)

### 모션 라이브러리
- [Motion Dev](https://motion.dev/) - 공식 문서
- [Luxis Design - Advanced Framer Motion 2025](https://www.luxisdesign.io/blog/mastering-framer-motion-advanced-animation-techniques-for-2025)
