# Pairy - 페어리/마법 모션 원칙 (Fairy Motion Principles)

## 개요

이 문서는 Pairy 플랫폼의 **핵심 모션 스타일**을 정의합니다.
기계적/물리적 모션이 아닌, **페어리, 마법, 빛, 반짝임**을 주제로 한 부드럽고 마법적인 인터랙션을 구현합니다.

> ⚠️ **중요**: 모든 인터랙션 구현 시 이 원칙을 참고하세요.

---

## 핵심 철학

### ❌ 피해야 할 것 (기계적 모션)
| 유형 | 예시 | 문제점 |
|------|------|--------|
| 딱딱한 물리 | 스프링, 바운스, 관성 | Pairy 브랜드와 맞지 않음 |
| 기계적 은유 | 밸브, 기어, 스탬프, 펌프 | 차갑고 산업적인 느낌 |
| 과격한 움직임 | 뒤집기, 흔들기, 튀기기 | 부드러움 부족 |
| 단순 반복 | 제자리 뛰기, 좌우 흔들림 | 창의성 부족 |

### ✅ 추구해야 할 것 (마법적 모션)
| 유형 | 예시 | 효과 |
|------|------|------|
| 빛 효과 | 글로우, 후광, 광선 | 따뜻하고 마법적인 느낌 |
| 파티클 | 요정 가루, 별가루, 반딧불이 | 환상적인 분위기 |
| 자연 요소 | 꽃잎, 오로라, 무지개 | 부드럽고 유기적 |
| 변형 효과 | 페이드, 필 업, 그라데이션 변화 | 우아한 상태 전환 |

---

## 컬러 팔레트

### 마법 효과용 컬러
```css
/* Primary - 마법 핑크 */
--magic-pink: #f472b6;
--magic-pink-light: #fbcfe8;
--magic-pink-glow: rgba(244, 114, 182, 0.4);

/* Secondary - 마법 바이올렛 */
--magic-violet: #a78bfa;
--magic-violet-light: #ddd6fe;
--magic-violet-glow: rgba(167, 139, 250, 0.4);

/* Accent - 마법 골드 */
--magic-gold: #fbbf24;
--magic-gold-light: #fef3c7;
--magic-gold-glow: rgba(251, 191, 36, 0.4);

/* 글로우 효과 */
--glow-white: rgba(255, 255, 255, 0.8);
--glow-soft: rgba(255, 255, 255, 0.3);
```

### 컬러 사용 규칙
| 요소 | Like 버튼 | Bookmark 버튼 |
|------|-----------|---------------|
| 기본 아이콘 | gray-400 | gray-400 |
| 활성 아이콘 | magic-pink | magic-violet |
| 파티클/효과 | pink, gold | violet, gold |
| 글로우 | pink-glow | violet-glow |

---

## 이징 함수 (Easing Functions)

### 마법 이징 라이브러리
```css
:root {
  /* 부드러운 마법 - 자연스러운 감속 */
  --magic-soft: cubic-bezier(0.25, 0.8, 0.25, 1);

  /* 떠오르는 효과 - 우아한 등장 */
  --magic-float: cubic-bezier(0.4, 0, 0.2, 1);

  /* 반짝임 - 살짝 오버슈트 */
  --magic-sparkle: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* 요정 날갯짓 - 탄성 있는 움직임 */
  --fairy-flutter: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* 요정 가루 - 부드러운 확산 */
  --fairy-dust: cubic-bezier(0.16, 1, 0.3, 1);

  /* 글로우 맥동 - 숨쉬는 듯한 */
  --glow-pulse: cubic-bezier(0.4, 0, 0.6, 1);

  /* 글로우 페이드 - 자연스러운 소멸 */
  --glow-fade: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### 이징 사용 가이드
| 효과 유형 | 권장 이징 | 용도 |
|-----------|-----------|------|
| 아이콘 등장 | magic-soft | 기본 상태 전환 |
| 파티클 확산 | fairy-dust | 요정 가루, 별가루 |
| 글로우 펄스 | glow-pulse | 후광, 빛 효과 |
| 바운스 효과 | fairy-flutter | 탄성 있는 움직임 |
| 오버슈트 | magic-sparkle | 강조 효과 |

---

## 효과 유형별 구현 가이드

### 1. 글로우 효과 (Glow Effects)

```css
/* 기본 글로우 */
.glow-base {
  box-shadow: 0 0 20px var(--magic-pink-glow);
  transition: box-shadow 0.3s var(--glow-fade);
}

/* 펄스 글로우 */
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 15px var(--magic-pink-glow);
    opacity: 0.7;
  }
  50% {
    box-shadow: 0 0 25px var(--magic-pink-glow);
    opacity: 1;
  }
}

/* 후광 (Halo) */
.halo {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, var(--glow-white) 0%, transparent 70%);
  animation: haloExpand 0.6s var(--fairy-dust) forwards;
}
```

### 2. 파티클 효과 (Particle Effects)

#### 요정 가루 (Fairy Dust)
```css
.fairy-dust-particle {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--magic-gold);
  box-shadow: 0 0 6px var(--magic-gold-glow);
  animation: dustFloat 0.8s var(--fairy-dust) forwards;
}

@keyframes dustFloat {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--end-x), var(--end-y)) scale(0.3);
  }
}
```

#### 별 (Stars)
```css
.magic-star {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--magic-gold);
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%,
    79% 91%, 50% 70%, 21% 91%, 32% 57%,
    2% 35%, 39% 35%
  );
  animation: starBurst 0.6s var(--magic-sparkle) forwards;
}
```

#### 반딧불이 (Fireflies)
```css
.firefly {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--magic-gold-light);
  box-shadow: 0 0 8px var(--magic-gold);
  animation: fireflyDance 1.5s var(--glow-pulse) infinite;
}

@keyframes fireflyDance {
  0%, 100% {
    opacity: 0.3;
    transform: translate(0, 0);
  }
  25% {
    opacity: 1;
    transform: translate(3px, -5px);
  }
  50% {
    opacity: 0.6;
    transform: translate(-2px, 3px);
  }
  75% {
    opacity: 1;
    transform: translate(4px, 2px);
  }
}
```

### 3. 자연 요소 (Natural Elements)

#### 꽃잎 (Petals)
```css
.petal {
  position: absolute;
  width: 10px;
  height: 14px;
  background: linear-gradient(
    135deg,
    var(--magic-pink-light) 0%,
    var(--magic-pink) 100%
  );
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  animation: petalFloat 1s var(--magic-float) forwards;
}

@keyframes petalFloat {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(0deg) scale(0);
  }
  50% {
    opacity: 1;
    transform: translate(var(--mid-x), var(--mid-y)) rotate(180deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(var(--end-x), var(--end-y)) rotate(360deg) scale(0.5);
  }
}
```

#### 오로라 (Aurora)
```css
.aurora-layer {
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    transparent,
    var(--magic-pink-glow),
    transparent,
    var(--magic-violet-glow),
    transparent
  );
  border-radius: 50%;
  animation: auroraRotate 3s linear infinite;
}

@keyframes auroraRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

#### 무지개 (Rainbow)
```css
.rainbow-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(
                45deg,
                #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #9b59b6
              ) border-box;
  animation: rainbowExpand 0.8s var(--fairy-dust) forwards;
}
```

### 4. 마법 효과 (Magic Effects)

#### 마법진 (Magic Circle)
```css
.magic-rune {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 1px solid var(--magic-violet);
  border-radius: 50%;
  animation: runeRotate 2s linear infinite, runePulse 1s var(--glow-pulse) infinite;
}

.magic-rune::before {
  content: '✦';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  color: var(--magic-violet);
  font-size: 10px;
}
```

#### 광선 (Light Beam)
```css
.light-beam {
  position: absolute;
  width: 2px;
  height: 60px;
  background: linear-gradient(
    to bottom,
    transparent,
    var(--magic-gold),
    transparent
  );
  transform-origin: top center;
  animation: beamShine 0.6s var(--magic-soft) forwards;
}

@keyframes beamShine {
  0% {
    opacity: 0;
    transform: scaleY(0);
  }
  50% {
    opacity: 1;
    transform: scaleY(1);
  }
  100% {
    opacity: 0;
    transform: scaleY(1);
  }
}
```

---

## 버튼 인터랙션 패턴

### Like 버튼 효과 목록
| 이름 | 효과 설명 | 주요 요소 |
|------|----------|----------|
| FairyDust | 요정 가루가 흩뿌려지는 반짝임 | 파티클 8-12개, 랜덤 방향 |
| MagicWand | 마법 지팡이 터치 시 별 폭발 | 별 모양 파티클, 방사형 |
| SparkleBurst | 중심에서 빛이 방사형으로 퍼짐 | 광선, 글로우 링 |
| HeartGlow | 부드러운 빛 발산과 후광 | 다층 글로우, 펄스 |
| CrystalShine | 크리스탈처럼 빛이 굴절 | 프리즘 효과, 무지개 |
| AuroraWave | 오로라 빛이 물결치듯 퍼짐 | 회전 그라데이션 |
| StarTwinkle | 주변에 별들이 반짝임 | 별 파티클, 깜빡임 |
| MoonPhase | 달빛이 차오르는 효과 | 그라데이션 필, 글로우 |
| PetalFloat | 꽃잎이 떠오름 | 꽃잎 파티클, 회전 |
| RainbowShimmer | 무지개 색이 일렁임 | 무지개 링, 확산 |

### Bookmark 버튼 효과 목록
| 이름 | 효과 설명 | 주요 요소 |
|------|----------|----------|
| MagicBookmark | 마법의 빛이 감싸며 빛남 | 글로우, 반짝임 파티클 |
| EnchantSeal | 마법진이 나타나며 회전 | 원형 룬, 심볼 |
| FairyWing | 요정 날개가 펄럭임 | 날개 모양, 글로우 |
| StardustTrail | 별가루가 흩뿌려지는 자취 | 점 파티클, 트레일 |
| LightBeam | 위에서 빛줄기가 내려옴 | 수직 광선, 페이드 |
| CrystalMark | 크리스탈처럼 빛나는 마크 | 다면체 반사, 글로우 |
| GlowRibbon | 부드럽게 빛나는 리본 | 곡선 글로우, 펄스 |
| MagicRune | 마법 룬 문자가 나타남 | 회전 원, 심볼 |
| FireflyDance | 반딧불이가 춤춤 | 발광 점, 불규칙 이동 |
| DreamCatcher | 드림캐처처럼 빛이 엮임 | 동심원, 연결선 |

---

## 상태 전환 가이드

### 기본 → 활성 상태
```
1. 아이콘 색상 변화 (0.15s, magic-soft)
2. 스케일 업 1.0 → 1.15 (0.2s, fairy-flutter)
3. 글로우 효과 시작 (0.3s, glow-fade)
4. 파티클 생성 (stagger 0.05s)
5. 스케일 다운 1.15 → 1.0 (0.15s, magic-soft)
```

### 활성 → 기본 상태
```
1. 파티클/효과 페이드 아웃 (0.3s, glow-fade)
2. 글로우 소멸 (0.2s, glow-fade)
3. 아이콘 색상 변화 (0.15s, magic-soft)
4. 미세한 스케일 펄스 (subtle)
```

### 호버 상태
```
1. 미세한 스케일 업 1.0 → 1.05 (0.2s, magic-soft)
2. 약한 글로우 표시 (0.2s, glow-fade)
3. 커서: pointer
```

---

## 성능 최적화

### GPU 가속
```css
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### 파티클 제한
- Like 버튼: 최대 12개 파티클
- Bookmark 버튼: 최대 10개 파티클
- 동시 활성 효과: 최대 2개 레이어

### 접근성
```css
@media (prefers-reduced-motion: reduce) {
  .magic-effect,
  .fairy-particle,
  .glow-animation {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 체크리스트

새로운 인터랙션 구현 시 확인사항:

- [ ] 기계적/물리적 은유 대신 마법적 은유 사용
- [ ] 마법 이징 함수 적용 (magic-soft, fairy-dust 등)
- [ ] 브랜드 컬러 팔레트 준수 (pink, violet, gold)
- [ ] 글로우/파티클 효과 포함
- [ ] 상태 전환이 부드럽고 우아함
- [ ] 파티클 수 제한 준수
- [ ] reduced-motion 미디어 쿼리 적용
- [ ] GPU 가속 최적화

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|----------|
| 2026-01-01 | 초기 문서 작성 - 페어리/마법 모션 원칙 정립 |

