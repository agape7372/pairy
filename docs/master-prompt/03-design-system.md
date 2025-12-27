# 🧚 Pairy - 디자인 시스템 (Design System)

## 디자인 원칙

### 핵심 가치
1. **친근함 (Friendly)**: 딱딱하지 않은, 부드러운 느낌
2. **마법 같은 (Magical)**: 반짝이고 특별한 경험
3. **함께하는 (Together)**: 협업과 연결을 강조
4. **창작자 중심 (Creator-first)**: 창작물이 돋보이게

### 디자인 키워드
- Soft & Rounded
- Playful but Clean
- Pastel & Vibrant
- Cozy & Warm

---

## 1. 컬러 시스템 (Color System)

### 1.1 브랜드 컬러

#### Primary Colors
```css
/* Primary - 핑크 계열 */
--primary-50:  #FFF5F7;   /* 배경, 호버 */
--primary-100: #FFE8EE;   /* 연한 배경 */
--primary-200: #FFD1DD;   /* 테두리 */
--primary-300: #FFB3C7;   /* 비활성 */
--primary-400: #FF8AAA;   /* 호버 */
--primary-500: #FF6B9D;   /* 메인 (기본) */
--primary-600: #E85A8A;   /* 활성 */
--primary-700: #C44569;   /* 강조 */
--primary-800: #9E3654;   /* 진한 */
--primary-900: #7A2A42;   /* 매우 진한 */
```

#### Secondary Colors
```css
/* Secondary - 보라 계열 */
--secondary-50:  #F8F5FF;
--secondary-100: #EDE5FF;
--secondary-200: #D9CCFF;
--secondary-300: #C4B0FF;
--secondary-400: #A78BFA;
--secondary-500: #8B5CF6;   /* 메인 */
--secondary-600: #7C3AED;
--secondary-700: #6D28D9;
--secondary-800: #5B21B6;
--secondary-900: #4C1D95;
```

#### Accent Colors
```css
/* Accent - 노랑 계열 (포인트) */
--accent-50:  #FFFBEB;
--accent-100: #FEF3C7;
--accent-200: #FDE68A;
--accent-300: #FCD34D;
--accent-400: #FBBF24;
--accent-500: #FFE66D;   /* 메인 */
--accent-600: #D97706;
--accent-700: #B45309;
```

### 1.2 시맨틱 컬러

```css
/* Success - 성공 */
--success-light: #D5F5E3;
--success-main:  #00B894;
--success-dark:  #1E8449;

/* Warning - 경고 */
--warning-light: #FEF5E7;
--warning-main:  #FDCB6E;
--warning-dark:  #B7950B;

/* Error - 에러 */
--error-light: #FADBD8;
--error-main:  #E74C3C;
--error-dark:  #C0392B;

/* Info - 정보 */
--info-light: #EBF5FB;
--info-main:  #74B9FF;
--info-dark:  #2980B9;
```

### 1.3 중립 컬러 (Neutrals)

```css
/* Gray Scale */
--gray-50:  #FAFAFA;
--gray-100: #F5F5F5;
--gray-200: #EEEEEE;
--gray-300: #E0E0E0;
--gray-400: #BDBDBD;
--gray-500: #9E9E9E;
--gray-600: #757575;
--gray-700: #616161;
--gray-800: #424242;
--gray-900: #2D3436;   /* 텍스트 기본 */

/* White & Black */
--white: #FFFFFF;
--black: #000000;
```

### 1.4 배경 & 표면

```css
/* Background */
--bg-primary:   #FFFFFF;           /* 메인 배경 */
--bg-secondary: #FFF5F7;           /* 섹션 배경 */
--bg-tertiary:  #FFE8EE;           /* 강조 배경 */
--bg-gradient:  linear-gradient(135deg, #FFF5F7 0%, #FFE8EE 100%);

/* Surface (카드, 모달 등) */
--surface-elevated: #FFFFFF;       /* 떠있는 요소 */
--surface-overlay:  rgba(0, 0, 0, 0.5);  /* 오버레이 */
```

### 1.5 컬러 사용 가이드

| 용도 | 컬러 | 예시 |
|------|------|------|
| CTA 버튼 | primary-500 | 로그인, 저장하기 |
| 보조 버튼 | primary-100 + primary-700 (텍스트) | 취소, 더보기 |
| 링크 | primary-600 | 텍스트 링크 |
| 성공 메시지 | success | 저장 완료 |
| 에러 메시지 | error | 입력 오류 |
| 경고 메시지 | warning | 주의사항 |
| 프리미엄 뱃지 | accent-500 | 구독 표시 |

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 패밀리

```css
/* Primary Font - 한글 */
--font-primary: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Secondary Font - 영문 강조 */
--font-secondary: 'Poppins', sans-serif;

/* Mono Font - 코드 */
--font-mono: 'Fira Code', 'Consolas', monospace;
```

### 2.2 폰트 사이즈

```css
/* Font Sizes */
--text-xs:   0.75rem;    /* 12px */
--text-sm:   0.875rem;   /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg:   1.125rem;   /* 18px */
--text-xl:   1.25rem;    /* 20px */
--text-2xl:  1.5rem;     /* 24px */
--text-3xl:  1.875rem;   /* 30px */
--text-4xl:  2.25rem;    /* 36px */
--text-5xl:  3rem;       /* 48px */
```

### 2.3 폰트 웨이트

```css
--font-light:    300;
--font-regular:  400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;
```

### 2.4 라인 높이

```css
--leading-tight:  1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
--leading-loose:  2;
```

### 2.5 텍스트 스타일 프리셋

```css
/* Headings */
.heading-1 {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
}

.heading-2 {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
}

.heading-3 {
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
}

.heading-4 {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-normal);
}

/* Body */
.body-large {
  font-size: var(--text-lg);
  font-weight: var(--font-regular);
  line-height: var(--leading-relaxed);
}

.body-base {
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  line-height: var(--leading-relaxed);
}

.body-small {
  font-size: var(--text-sm);
  font-weight: var(--font-regular);
  line-height: var(--leading-normal);
}

/* Caption & Label */
.caption {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
  color: var(--gray-600);
}

.label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-normal);
}
```

---

## 3. 스페이싱 시스템 (Spacing)

### 3.1 기본 단위

```css
/* Base: 4px */
--space-0:  0;
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
```

### 3.2 컴포넌트 스페이싱

| 용도 | 크기 | 예시 |
|------|------|------|
| 인라인 간격 | space-2 (8px) | 아이콘과 텍스트 |
| 버튼 패딩 | space-3 / space-6 | 12px / 24px |
| 카드 패딩 | space-4 ~ space-6 | 16~24px |
| 섹션 간격 | space-8 ~ space-12 | 32~48px |
| 페이지 마진 | space-4 (모바일) / space-8 (PC) | 16px / 32px |

---

## 4. 보더 & 라운드 (Border & Radius)

### 4.1 보더

```css
/* Border Width */
--border-0: 0;
--border-1: 1px;
--border-2: 2px;
--border-4: 4px;

/* Border Color */
--border-default: var(--gray-200);
--border-hover:   var(--gray-300);
--border-focus:   var(--primary-500);
--border-error:   var(--error-main);
```

### 4.2 보더 라디우스

```css
/* Border Radius */
--radius-none: 0;
--radius-sm:   0.25rem;   /* 4px */
--radius-md:   0.5rem;    /* 8px */
--radius-lg:   0.75rem;   /* 12px */
--radius-xl:   1rem;      /* 16px */
--radius-2xl:  1.5rem;    /* 24px */
--radius-full: 9999px;    /* 원형 */
```

### 4.3 사용 가이드

| 요소 | 라디우스 |
|------|---------|
| 버튼 (기본) | radius-lg (12px) |
| 버튼 (pill) | radius-full |
| 카드 | radius-xl (16px) |
| 모달 | radius-2xl (24px) |
| 인풋 | radius-lg (12px) |
| 태그/뱃지 | radius-full |
| 이미지 썸네일 | radius-lg (12px) |
| 아바타 | radius-full |

---

## 5. 그림자 (Shadow)

### 5.1 그림자 단계

```css
/* Shadows */
--shadow-xs:  0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm:  0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-md:  0 4px 8px rgba(0, 0, 0, 0.08);
--shadow-lg:  0 8px 16px rgba(0, 0, 0, 0.1);
--shadow-xl:  0 16px 32px rgba(0, 0, 0, 0.12);
--shadow-2xl: 0 24px 48px rgba(0, 0, 0, 0.15);

/* Colored Shadows (브랜드 느낌) */
--shadow-primary: 0 8px 24px rgba(255, 107, 157, 0.25);
--shadow-glow:    0 0 20px rgba(255, 107, 157, 0.3);
```

### 5.2 사용 가이드

| 요소 | 그림자 |
|------|--------|
| 버튼 호버 | shadow-md |
| 카드 기본 | shadow-sm |
| 카드 호버 | shadow-lg |
| 모달 | shadow-2xl |
| 드롭다운 | shadow-lg |
| 헤더 (스크롤 시) | shadow-sm |
| CTA 버튼 | shadow-primary |

---

## 6. 애니메이션 (Animation)

### 6.1 트랜지션

```css
/* Duration */
--duration-fast:   150ms;
--duration-normal: 250ms;
--duration-slow:   400ms;

/* Easing */
--ease-in:     cubic-bezier(0.4, 0, 1, 1);
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Preset */
--transition-fast:   all 150ms var(--ease-out);
--transition-normal: all 250ms var(--ease-out);
--transition-slow:   all 400ms var(--ease-in-out);
```

### 6.2 키프레임 애니메이션

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale In */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Bounce */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-5px); }
}

/* Pulse (로딩) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

/* Sparkle (반짝임) */
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50%      { opacity: 1; transform: scale(1); }
}
```

### 6.3 사용 가이드

| 상황 | 애니메이션 | 지속 시간 |
|------|-----------|----------|
| 버튼 호버 | scale(1.02) | fast |
| 모달 열기 | scaleIn | normal |
| 토스트 | slideUp | normal |
| 페이지 전환 | fadeIn | normal |
| 좋아요 | bounce + sparkle | slow |
| 로딩 스켈레톤 | pulse | 1.5s (반복) |

---

## 7. 아이콘 (Icons)

### 7.1 아이콘 라이브러리

**추천: Lucide Icons** (https://lucide.dev)
- 가볍고 일관된 스타일
- React 컴포넌트 지원
- 커스터마이징 용이

### 7.2 아이콘 사이즈

```css
--icon-xs: 12px;
--icon-sm: 16px;
--icon-md: 20px;   /* 기본 */
--icon-lg: 24px;
--icon-xl: 32px;
--icon-2xl: 48px;
```

### 7.3 주요 아이콘 매핑

| 용도 | 아이콘 이름 |
|------|------------|
| 검색 | Search |
| 홈 | Home |
| 좋아요 | Heart |
| 북마크 | Bookmark |
| 공유 | Share2 |
| 설정 | Settings |
| 메뉴 | Menu |
| 닫기 | X |
| 이미지 | Image |
| 텍스트 | Type |
| 다운로드 | Download |
| 협업 | Users |
| 로그인 | LogIn |
| 프로필 | User |
| 더보기 | MoreHorizontal |
| 에디터 | Edit3 |
| 되돌리기 | Undo2 |
| 다시하기 | Redo2 |
| 컬러 | Palette |

---

## 8. 반응형 (Responsive)

### 8.1 브레이크포인트

```css
/* Breakpoints (Mobile First) */
--screen-sm: 640px;   /* 스마트폰 가로 */
--screen-md: 768px;   /* 태블릿 */
--screen-lg: 1024px;  /* 작은 데스크톱 */
--screen-xl: 1280px;  /* 데스크톱 */
--screen-2xl: 1536px; /* 큰 데스크톱 */
```

### 8.2 Tailwind 사용 예시

```jsx
// 반응형 그리드
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* 카드들 */}
</div>

// 반응형 텍스트
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  제목
</h1>

// 반응형 패딩
<div className="p-4 sm:p-6 lg:p-8">
  {/* 컨텐츠 */}
</div>
```

### 8.3 컨테이너

```css
/* Container Max Width */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1200px;   /* 메인 컨텐츠 */
```

---

## 9. 컴포넌트 스타일 가이드

### 9.1 버튼 (Button)

```jsx
// 버튼 Variants
const buttonVariants = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-primary",
  secondary: "bg-primary-100 text-primary-700 hover:bg-primary-200",
  outline: "border-2 border-primary-500 text-primary-500 hover:bg-primary-50",
  ghost: "text-primary-500 hover:bg-primary-50",
  danger: "bg-error-main text-white hover:bg-error-dark",
};

// 버튼 Sizes
const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

// 공통 스타일
const buttonBase = `
  inline-flex items-center justify-center
  font-medium rounded-xl
  transition-all duration-fast
  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
`;
```

### 9.2 인풋 (Input)

```jsx
const inputStyles = `
  w-full px-4 py-3
  bg-white
  border-2 border-gray-200
  rounded-xl
  text-gray-900 placeholder:text-gray-400
  transition-all duration-fast
  focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100
  disabled:bg-gray-100 disabled:cursor-not-allowed
`;
```

### 9.3 카드 (Card)

```jsx
const cardStyles = `
  bg-white
  rounded-2xl
  border border-gray-100
  shadow-sm
  hover:shadow-lg
  transition-shadow duration-normal
  overflow-hidden
`;
```

### 9.4 태그 (Tag)

```jsx
const tagVariants = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-primary-100 text-primary-700",
  success: "bg-success-light text-success-dark",
  warning: "bg-warning-light text-warning-dark",
  premium: "bg-accent-100 text-accent-700",
};

const tagStyles = `
  inline-flex items-center
  px-3 py-1
  rounded-full
  text-sm font-medium
`;
```

### 9.5 모달 (Modal)

```jsx
// Overlay
const overlayStyles = `
  fixed inset-0
  bg-black/50
  backdrop-blur-sm
  z-50
`;

// Modal Container
const modalStyles = `
  fixed top-1/2 left-1/2
  -translate-x-1/2 -translate-y-1/2
  w-full max-w-md
  bg-white
  rounded-3xl
  shadow-2xl
  p-6
  z-50
  animate-scaleIn
`;
```

---

## 10. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F7',
          100: '#FFE8EE',
          200: '#FFD1DD',
          300: '#FFB3C7',
          400: '#FF8AAA',
          500: '#FF6B9D',
          600: '#E85A8A',
          700: '#C44569',
          800: '#9E3654',
          900: '#7A2A42',
        },
        secondary: {
          50: '#F8F5FF',
          100: '#EDE5FF',
          500: '#8B5CF6',
          700: '#6D28D9',
        },
        accent: {
          100: '#FEF3C7',
          500: '#FFE66D',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'primary': '0 8px 24px rgba(255, 107, 157, 0.25)',
        'glow': '0 0 20px rgba(255, 107, 157, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'scale-in': 'scaleIn 0.25s ease-out',
        'bounce-soft': 'bounce 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
};
```
