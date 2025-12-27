# Pairy - 디자인 시스템 (Design System)

## 디자인 컨셉: 딸기 크림 파스텔 (Strawberry Cream Pastel)

### 핵심 가치
1. **친근함 (Friendly)**: 부드럽고 편안한 느낌
2. **깔끔함 (Clean)**: 군더더기 없이 정돈된 UI
3. **함께하는 (Together)**: 협업과 연결을 강조
4. **창작자 중심 (Creator-first)**: 창작물이 돋보이게

### 디자인 키워드
- Soft & Rounded
- Clean & Minimal
- Pastel & Calm
- Cozy & Warm

### 레퍼런스
- 크레페 스타일: 미니멀, 여백 활용, 콘텐츠 중심

---

## 1. 컬러 시스템 (Color System)

### 1.1 브랜드 컬러

#### Primary Colors (핑크 계열)
```css
/* Primary - 딸기 파스텔 핑크 */
--primary-50:  #FFF5F5;   /* 아주 연한 배경 */
--primary-100: #FFF0F0;   /* 연한 배경 */
--primary-200: #FFD9D9;   /* 메인 컬러 ⭐ */
--primary-300: #FFCACA;   /* 호버 */
--primary-400: #E8A8A8;   /* 버튼 (진한) ⭐ */
--primary-500: #D99999;   /* 버튼 호버 */
--primary-600: #C48888;   /* 활성 */
--primary-700: #A87070;   /* 강조 텍스트 */
--primary-800: #8B5A5A;   /* 진한 */
--primary-900: #6E4545;   /* 매우 진한 */
```

#### Accent Colors (민트 계열)
```css
/* Accent - 파스텔 민트 */
--accent-50:  #F5FEFE;    /* 아주 연한 배경 */
--accent-100: #EDFCFC;    /* 연한 배경 */
--accent-200: #D7FAFA;    /* 메인 컬러 ⭐ */
--accent-300: #B8F0F0;    /* 호버 */
--accent-400: #9FD9D9;    /* 버튼 (진한) ⭐ */
--accent-500: #8ECECE;    /* 버튼 호버 */
--accent-600: #7ABFBF;    /* 활성 */
--accent-700: #5A9A9A;    /* 강조 텍스트 */
--accent-800: #4A8080;    /* 진한 */
--accent-900: #3A6565;    /* 매우 진한 */
```

### 1.2 시맨틱 컬러

```css
/* Success - 성공 */
--success-light: #E8F5E8;
--success-main:  #6BBF6B;
--success-dark:  #4A9A4A;

/* Warning - 경고 */
--warning-light: #FFF8E8;
--warning-main:  #E8C56B;
--warning-dark:  #C4A04A;

/* Error - 에러 */
--error-light: #FFE8E8;
--error-main:  #D98080;
--error-dark:  #B86060;

/* Info - 정보 */
--info-light: #E8F4FF;
--info-main:  #80B8D9;
--info-dark:  #6098B8;
```

### 1.3 중립 컬러 (Neutrals)

```css
/* Warm Gray Scale (따뜻한 그레이) */
--gray-50:  #FEFEFE;      /* 배경 */
--gray-100: #F8F6F5;
--gray-200: #F0EAEA;      /* 보더 */
--gray-300: #E0D8D8;
--gray-400: #B8ACAC;
--gray-500: #8A8080;      /* 보조 텍스트 */
--gray-600: #6A6060;
--gray-700: #5A5252;      /* 본문 텍스트 */
--gray-800: #4A4040;
--gray-900: #3D3636;      /* 제목 텍스트 */

/* White & Black */
--white: #FFFFFF;
--black: #2D2626;
```

### 1.4 배경 & 표면

```css
/* Background */
--bg-primary:   #FEFEFE;           /* 메인 배경 */
--bg-secondary: #FFF5F5;           /* 섹션 배경 (연한 핑크) */
--bg-tertiary:  #F5FEFE;           /* 섹션 배경 (연한 민트) */
--bg-gradient:  linear-gradient(135deg, #FFF0F0 0%, #EDFCFC 100%);

/* Surface (카드, 모달 등) */
--surface-elevated: #FFFFFF;       /* 떠있는 요소 */
--surface-overlay:  rgba(45, 38, 38, 0.5);  /* 오버레이 */
```

### 1.5 컬러 사용 가이드

| 용도 | 컬러 | 코드 |
|------|------|------|
| CTA 버튼 배경 | primary-400 | `#E8A8A8` |
| CTA 버튼 호버 | primary-500 | `#D99999` |
| 보조 버튼 배경 | primary-200 | `#FFD9D9` |
| 보조 버튼 텍스트 | gray-700 | `#5A5252` |
| 민트 버튼 배경 | accent-400 | `#9FD9D9` |
| 민트 버튼 호버 | accent-500 | `#8ECECE` |
| 태그 (핑크) | primary-200 배경 + gray-700 텍스트 | |
| 태그 (민트) | accent-200 배경 + accent-700 텍스트 | |
| 링크 | primary-700 | `#A87070` |
| 제목 텍스트 | gray-900 | `#3D3636` |
| 본문 텍스트 | gray-700 | `#5A5252` |
| 보조 텍스트 | gray-500 | `#8A8080` |
| 보더 | gray-200 | `#F0EAEA` |

---

## 2. 타이포그래피 (Typography)

### 2.1 폰트 패밀리

```css
/* Primary Font - 한글/영문 */
--font-primary: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Alternative (Pretendard 사용 시) */
--font-primary: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

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
```

### 2.5 텍스트 스타일 프리셋

```css
/* Headings */
.heading-1 {
  font-size: var(--text-4xl);   /* 36px */
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

.heading-2 {
  font-size: var(--text-3xl);   /* 30px */
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  color: var(--gray-900);
}

.heading-3 {
  font-size: var(--text-2xl);   /* 24px */
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

.heading-4 {
  font-size: var(--text-xl);    /* 20px */
  font-weight: var(--font-semibold);
  color: var(--gray-900);
}

/* Body */
.body-large {
  font-size: var(--text-lg);    /* 18px */
  color: var(--gray-700);
  line-height: var(--leading-relaxed);
}

.body-base {
  font-size: var(--text-base);  /* 16px */
  color: var(--gray-700);
  line-height: var(--leading-relaxed);
}

.body-small {
  font-size: var(--text-sm);    /* 14px */
  color: var(--gray-700);
  line-height: var(--leading-normal);
}

/* Caption & Label */
.caption {
  font-size: var(--text-xs);    /* 12px */
  color: var(--gray-500);
}

.label {
  font-size: var(--text-sm);    /* 14px */
  font-weight: var(--font-medium);
  color: var(--gray-700);
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
```

### 3.2 컴포넌트 스페이싱

| 용도 | 크기 | 예시 |
|------|------|------|
| 인라인 간격 | space-2 (8px) | 아이콘과 텍스트 |
| 버튼 패딩 | space-3 / space-5 | 12px / 20px |
| 카드 패딩 | space-4 (16px) | 내부 여백 |
| 섹션 간격 | space-10 ~ space-16 | 40~64px |
| 페이지 마진 | space-4 (모바일) / space-10 (PC) | 16px / 40px |

---

## 4. 보더 & 라운드 (Border & Radius)

### 4.1 보더

```css
/* Border Width */
--border-1: 1px;
--border-2: 2px;

/* Border Color */
--border-default: var(--gray-200);   /* #F0EAEA */
--border-hover:   var(--gray-300);   /* #E0D8D8 */
--border-focus:   var(--primary-400); /* #E8A8A8 */
--border-error:   var(--error-main);  /* #D98080 */
```

### 4.2 보더 라디우스

```css
/* Border Radius */
--radius-sm:   6px;
--radius-md:   10px;
--radius-lg:   16px;
--radius-xl:   20px;
--radius-2xl:  24px;
--radius-full: 9999px;   /* 원형/pill */
```

### 4.3 사용 가이드

| 요소 | 라디우스 |
|------|---------|
| 버튼 (pill) | radius-full (24px) |
| 카드 | radius-xl (20px) |
| 모달 | radius-xl (20px) |
| 인풋 | radius-lg (16px) |
| 태그/뱃지 | radius-lg (12px) |
| 이미지 썸네일 | radius-lg (16px) |
| 아바타 | radius-full |

---

## 5. 그림자 (Shadow)

### 5.1 그림자 단계

```css
/* Shadows - 부드럽고 은은한 스타일 */
--shadow-xs:  0 1px 2px rgba(90, 82, 82, 0.04);
--shadow-sm:  0 2px 4px rgba(90, 82, 82, 0.05);
--shadow-md:  0 4px 8px rgba(90, 82, 82, 0.06);
--shadow-lg:  0 8px 16px rgba(90, 82, 82, 0.08);
--shadow-xl:  0 12px 24px rgba(90, 82, 82, 0.1);

/* Colored Shadow - 브랜드 느낌 (절제해서 사용) */
--shadow-primary: 0 4px 12px rgba(232, 168, 168, 0.3);
```

### 5.2 사용 가이드

| 요소 | 그림자 |
|------|--------|
| 버튼 기본 | 없음 |
| 버튼 호버 | shadow-sm |
| 카드 기본 | shadow-sm 또는 없음 (보더 사용) |
| 카드 호버 | shadow-lg |
| 모달 | shadow-xl |
| 드롭다운 | shadow-lg |
| 헤더 (스크롤 시) | shadow-sm |

---

## 6. 애니메이션 (Animation)

### 6.1 트랜지션

```css
/* Duration */
--duration-fast:   150ms;
--duration-normal: 200ms;
--duration-slow:   300ms;

/* Easing */
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Preset */
--transition-fast:   all 150ms var(--ease-out);
--transition-normal: all 200ms var(--ease-out);
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
    transform: translateY(8px);
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
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

### 6.3 사용 가이드

| 상황 | 애니메이션 | 지속 시간 |
|------|-----------|----------|
| 버튼 호버 | 배경색 변경 | fast |
| 카드 호버 | translateY(-4px) | normal |
| 모달 열기 | scaleIn | normal |
| 토스트 | slideUp | normal |
| 페이지 전환 | fadeIn | normal |

---

## 7. 아이콘 (Icons)

### 7.1 아이콘 라이브러리

**추천: Lucide Icons** (https://lucide.dev)
- 가볍고 일관된 스타일
- React 컴포넌트 지원

### 7.2 아이콘 사이즈

```css
--icon-sm: 16px;
--icon-md: 20px;   /* 기본 */
--icon-lg: 24px;
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
| 다운로드 | Download |
| 협업 | Users |
| 프로필 | User |

---

## 8. 반응형 (Responsive)

### 8.1 브레이크포인트

```css
/* Breakpoints (Mobile First) */
--screen-sm: 640px;   /* 스마트폰 가로 */
--screen-md: 768px;   /* 태블릿 */
--screen-lg: 1024px;  /* 작은 데스크톱 */
--screen-xl: 1280px;  /* 데스크톱 */
```

### 8.2 컨테이너

```css
/* Container Max Width */
--container-max: 1200px;   /* 메인 컨텐츠 */
```

---

## 9. 컴포넌트 스타일 가이드

### 9.1 버튼 (Button)

```jsx
// 버튼 Variants
const buttonVariants = {
  primary: "bg-primary-400 text-white hover:bg-primary-500",
  secondary: "bg-primary-200 text-gray-700 hover:bg-primary-300",
  accent: "bg-accent-400 text-white hover:bg-accent-500",
  ghost: "bg-transparent text-gray-700 hover:bg-primary-200",
  outline: "bg-transparent border-2 border-accent-400 text-accent-700 hover:bg-accent-200",
};

// 버튼 Sizes
const buttonSizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-3.5 text-base",
};

// 공통 스타일
const buttonBase = `
  inline-flex items-center justify-center
  font-semibold rounded-full
  transition-all duration-fast
  focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
`;
```

### 9.2 인풋 (Input)

```jsx
const inputStyles = `
  w-full px-4 py-3
  bg-white
  border border-gray-200
  rounded-2xl
  text-gray-700 placeholder:text-gray-400
  transition-all duration-fast
  focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100
  disabled:bg-gray-100 disabled:cursor-not-allowed
`;
```

### 9.3 카드 (Card)

```jsx
const cardStyles = `
  bg-white
  rounded-[20px]
  border border-gray-200
  hover:shadow-lg
  transition-all duration-normal
  overflow-hidden
`;
```

### 9.4 태그 (Tag)

```jsx
const tagVariants = {
  primary: "bg-primary-200 text-gray-700",
  accent: "bg-accent-200 text-accent-700",
};

const tagStyles = `
  inline-flex items-center
  px-3 py-1
  rounded-xl
  text-xs font-medium
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
  rounded-[20px]
  shadow-xl
  p-6
  z-50
  animate-scaleIn
`;
```

---

## 10. Tailwind Config

```javascript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary - 딸기 파스텔 핑크
        primary: {
          50: '#FFF5F5',
          100: '#FFF0F0',
          200: '#FFD9D9',  // 메인
          300: '#FFCACA',
          400: '#E8A8A8',  // 버튼
          500: '#D99999',
          600: '#C48888',
          700: '#A87070',
          800: '#8B5A5A',
          900: '#6E4545',
        },
        // Accent - 파스텔 민트
        accent: {
          50: '#F5FEFE',
          100: '#EDFCFC',
          200: '#D7FAFA',  // 메인
          300: '#B8F0F0',
          400: '#9FD9D9',  // 버튼
          500: '#8ECECE',
          600: '#7ABFBF',
          700: '#5A9A9A',
          800: '#4A8080',
          900: '#3A6565',
        },
        // Warm Gray
        gray: {
          50: '#FEFEFE',
          100: '#F8F6F5',
          200: '#F0EAEA',
          300: '#E0D8D8',
          400: '#B8ACAC',
          500: '#8A8080',
          600: '#6A6060',
          700: '#5A5252',
          800: '#4A4040',
          900: '#3D3636',
        },
        // Semantic
        success: {
          light: '#E8F5E8',
          DEFAULT: '#6BBF6B',
          dark: '#4A9A4A',
        },
        warning: {
          light: '#FFF8E8',
          DEFAULT: '#E8C56B',
          dark: '#C4A04A',
        },
        error: {
          light: '#FFE8E8',
          DEFAULT: '#D98080',
          dark: '#B86060',
        },
      },
      fontFamily: {
        sans: ['Noto Sans KR', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'sm': '0 2px 4px rgba(90, 82, 82, 0.05)',
        'md': '0 4px 8px rgba(90, 82, 82, 0.06)',
        'lg': '0 8px 16px rgba(90, 82, 82, 0.08)',
        'xl': '0 12px 24px rgba(90, 82, 82, 0.1)',
        'primary': '0 4px 12px rgba(232, 168, 168, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 컬러 요약

| 용도 | 컬러명 | 코드 |
|------|--------|------|
| **메인 핑크** | primary-200 | `#FFD9D9` |
| **핑크 버튼** | primary-400 | `#E8A8A8` |
| **메인 민트** | accent-200 | `#D7FAFA` |
| **민트 버튼** | accent-400 | `#9FD9D9` |
| **제목 텍스트** | gray-900 | `#3D3636` |
| **본문 텍스트** | gray-700 | `#5A5252` |
| **보조 텍스트** | gray-500 | `#8A8080` |
| **보더** | gray-200 | `#F0EAEA` |
| **배경** | gray-50 | `#FEFEFE` |
