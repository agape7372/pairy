/**
 * Sprint 36: 고급 폰트 시스템 타입 정의
 *
 * 기능:
 * - 폰트 카테고리별 분류
 * - 가변 폰트 지원
 * - 한글 최적화 폰트 관리
 * - 폰트 로딩 상태 추적
 */

// ============================================
// 기본 타입
// ============================================

/** 폰트 카테고리 */
export type FontCategory =
  | 'sans-serif'   // 고딕체
  | 'serif'        // 명조체
  | 'display'      // 디스플레이/장식
  | 'handwriting'  // 손글씨
  | 'monospace'    // 고정폭

/** 폰트 소스 */
export type FontSource = 'google' | 'local' | 'custom'

/** 폰트 언어 지원 */
export type FontLanguage = 'korean' | 'english' | 'both'

/** 폰트 가중치 (숫자형) */
export type FontWeightNumeric = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900

// ============================================
// 폰트 정의 인터페이스
// ============================================

/**
 * 폰트 정의
 *
 * @description 폰트의 메타데이터와 로딩 정보를 포함
 */
export interface FontDefinition {
  /** 고유 ID */
  id: string

  /** CSS font-family 값 */
  family: string

  /** 표시용 이름 (한글) */
  displayName: string

  /** 카테고리 */
  category: FontCategory

  /** 언어 지원 */
  language: FontLanguage

  /** 지원하는 가중치 목록 */
  weights: FontWeightNumeric[]

  /** 이탤릭 지원 여부 */
  hasItalic: boolean

  /** 가변 폰트 여부 */
  isVariable?: boolean

  /** 가변 폰트 축 범위 */
  variableAxes?: {
    /** 가중치 축 (wght) */
    wght?: [number, number]
    /** 너비 축 (wdth) */
    wdth?: [number, number]
    /** 기울기 축 (slnt) */
    slnt?: [number, number]
  }

  /** 폰트 소스 */
  source: FontSource

  /** Google Fonts URL (source가 'google'일 때) */
  googleUrl?: string

  /** 미리보기용 텍스트 */
  previewText?: string

  /** 폰트 설명 */
  description?: string

  /** 추천 용도 태그 */
  tags?: string[]

  /** 정렬 순서 */
  sortOrder?: number
}

/**
 * 폰트 로딩 상태
 */
export interface FontLoadingState {
  /** 폰트 ID */
  fontId: string

  /** 로딩 상태 */
  status: 'idle' | 'loading' | 'loaded' | 'error'

  /** 에러 메시지 */
  error?: string

  /** 로딩 시작 시간 */
  startedAt?: number

  /** 로딩 완료 시간 */
  loadedAt?: number
}

/**
 * 폰트 선택 옵션
 */
export interface FontSelectOption {
  /** 폰트 정의 */
  font: FontDefinition

  /** 로딩 상태 */
  loadingState: FontLoadingState

  /** 활성화 여부 (템플릿에서 사용 가능한지) */
  isAvailable: boolean
}

// ============================================
// 폰트 프리셋
// ============================================

/**
 * 폰트 조합 프리셋
 * 제목 + 본문 폰트 페어링
 */
export interface FontPairingPreset {
  id: string
  name: string
  description: string
  titleFont: {
    family: string
    weight: FontWeightNumeric
  }
  bodyFont: {
    family: string
    weight: FontWeightNumeric
  }
  tags: string[]
}

// ============================================
// 내장 폰트 목록
// ============================================

/** 한글 고딕체 */
export const KOREAN_SANS_FONTS: FontDefinition[] = [
  {
    id: 'pretendard',
    family: 'Pretendard Variable',
    displayName: '프리텐다드',
    category: 'sans-serif',
    language: 'both',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    hasItalic: false,
    isVariable: true,
    variableAxes: { wght: [100, 900] },
    source: 'custom',
    previewText: '사랑해요 Love',
    description: '가장 많이 사용되는 한글 폰트',
    tags: ['인기', '깔끔', '현대적'],
    sortOrder: 1,
  },
  {
    id: 'nanum-gothic',
    family: 'Nanum Gothic',
    displayName: '나눔고딕',
    category: 'sans-serif',
    language: 'both',
    weights: [400, 700, 800],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap',
    previewText: '함께해요',
    description: '네이버가 만든 클래식 한글 폰트',
    tags: ['클래식', '안정적'],
    sortOrder: 2,
  },
  {
    id: 'noto-sans-kr',
    family: 'Noto Sans KR',
    displayName: '노토 산스',
    category: 'sans-serif',
    language: 'both',
    weights: [100, 300, 400, 500, 700, 900],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&display=swap',
    previewText: '안녕하세요',
    description: '구글이 만든 범용 폰트',
    tags: ['범용', '가독성'],
    sortOrder: 3,
  },
  {
    id: 'spoqa-han-sans',
    family: 'Spoqa Han Sans Neo',
    displayName: '스포카 한 산스',
    category: 'sans-serif',
    language: 'both',
    weights: [100, 300, 400, 500, 700],
    hasItalic: false,
    source: 'custom',
    previewText: '스타트업',
    description: '스타트업에서 인기 있는 폰트',
    tags: ['비즈니스', '깔끔'],
    sortOrder: 4,
  },
]

/** 한글 명조체 */
export const KOREAN_SERIF_FONTS: FontDefinition[] = [
  {
    id: 'nanum-myeongjo',
    family: 'Nanum Myeongjo',
    displayName: '나눔명조',
    category: 'serif',
    language: 'both',
    weights: [400, 700, 800],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap',
    previewText: '그리움',
    description: '우아한 한글 명조체',
    tags: ['우아함', '감성적', '문학'],
    sortOrder: 1,
  },
  {
    id: 'noto-serif-kr',
    family: 'Noto Serif KR',
    displayName: '노토 세리프',
    category: 'serif',
    language: 'both',
    weights: [200, 300, 400, 500, 600, 700, 900],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@200;300;400;500;600;700;900&display=swap',
    previewText: '전통',
    description: '클래식한 세리프체',
    tags: ['전통', '고급스러움'],
    sortOrder: 2,
  },
]

/** 한글 손글씨 */
export const KOREAN_HANDWRITING_FONTS: FontDefinition[] = [
  {
    id: 'gaegu',
    family: 'Gaegu',
    displayName: '개구',
    category: 'handwriting',
    language: 'both',
    weights: [300, 400, 700],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Gaegu:wght@300;400;700&display=swap',
    previewText: '귀여워',
    description: '귀여운 손글씨체',
    tags: ['귀여움', '캐주얼'],
    sortOrder: 1,
  },
  {
    id: 'jua',
    family: 'Jua',
    displayName: '주아',
    category: 'handwriting',
    language: 'both',
    weights: [400],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Jua&display=swap',
    previewText: '사랑스러워',
    description: '동글동글 귀여운 폰트',
    tags: ['동글', '사랑스러움'],
    sortOrder: 2,
  },
  {
    id: 'nanum-pen',
    family: 'Nanum Pen Script',
    displayName: '나눔손글씨 펜',
    category: 'handwriting',
    language: 'both',
    weights: [400],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap',
    previewText: '편지',
    description: '감성적인 펜글씨',
    tags: ['감성', '편지'],
    sortOrder: 3,
  },
  {
    id: 'gamja-flower',
    family: 'Gamja Flower',
    displayName: '감자꽃',
    category: 'handwriting',
    language: 'both',
    weights: [400],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap',
    previewText: '행복해',
    description: '둥글둥글 친근한 폰트',
    tags: ['친근함', '밝음'],
    sortOrder: 4,
  },
]

/** 한글 디스플레이 */
export const KOREAN_DISPLAY_FONTS: FontDefinition[] = [
  {
    id: 'black-han-sans',
    family: 'Black Han Sans',
    displayName: '검은고딕',
    category: 'display',
    language: 'both',
    weights: [400],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap',
    previewText: '강렬함',
    description: '임팩트 있는 타이틀용',
    tags: ['임팩트', '타이틀'],
    sortOrder: 1,
  },
  {
    id: 'do-hyeon',
    family: 'Do Hyeon',
    displayName: '도현',
    category: 'display',
    language: 'both',
    weights: [400],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap',
    previewText: '제목',
    description: '굵은 타이틀 폰트',
    tags: ['굵음', '제목용'],
    sortOrder: 2,
  },
]

/** 영문 세리프 */
export const ENGLISH_SERIF_FONTS: FontDefinition[] = [
  {
    id: 'playfair-display',
    family: 'Playfair Display',
    displayName: 'Playfair Display',
    category: 'serif',
    language: 'english',
    weights: [400, 500, 600, 700, 800, 900],
    hasItalic: true,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    previewText: 'Love Story',
    description: '우아한 영문 세리프',
    tags: ['우아함', '로맨틱'],
    sortOrder: 1,
  },
  {
    id: 'cormorant-garamond',
    family: 'Cormorant Garamond',
    displayName: 'Cormorant Garamond',
    category: 'serif',
    language: 'english',
    weights: [300, 400, 500, 600, 700],
    hasItalic: true,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap',
    previewText: 'Elegant',
    description: '클래식 가라몬드 스타일',
    tags: ['클래식', '고급'],
    sortOrder: 2,
  },
]

/** 영문 산세리프 */
export const ENGLISH_SANS_FONTS: FontDefinition[] = [
  {
    id: 'inter',
    family: 'Inter',
    displayName: 'Inter',
    category: 'sans-serif',
    language: 'english',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    hasItalic: true,
    isVariable: true,
    variableAxes: { wght: [100, 900] },
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap',
    previewText: 'Modern UI',
    description: '현대적인 UI 폰트',
    tags: ['모던', 'UI'],
    sortOrder: 1,
  },
  {
    id: 'montserrat',
    family: 'Montserrat',
    displayName: 'Montserrat',
    category: 'sans-serif',
    language: 'english',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    hasItalic: true,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    previewText: 'Trendy',
    description: '트렌디한 제목용 폰트',
    tags: ['트렌디', '제목용'],
    sortOrder: 2,
  },
  {
    id: 'poppins',
    family: 'Poppins',
    displayName: 'Poppins',
    category: 'sans-serif',
    language: 'english',
    weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    hasItalic: true,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap',
    previewText: 'Clean',
    description: '깔끔한 범용 폰트',
    tags: ['깔끔', '범용'],
    sortOrder: 3,
  },
]

/** 영문 손글씨 */
export const ENGLISH_HANDWRITING_FONTS: FontDefinition[] = [
  {
    id: 'dancing-script',
    family: 'Dancing Script',
    displayName: 'Dancing Script',
    category: 'handwriting',
    language: 'english',
    weights: [400, 500, 600, 700],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&display=swap',
    previewText: 'With Love',
    description: '우아한 필기체',
    tags: ['우아함', '필기체'],
    sortOrder: 1,
  },
  {
    id: 'great-vibes',
    family: 'Great Vibes',
    displayName: 'Great Vibes',
    category: 'handwriting',
    language: 'english',
    weights: [400],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap',
    previewText: 'Forever',
    description: '화려한 캘리그래피',
    tags: ['캘리그래피', '화려함'],
    sortOrder: 2,
  },
  {
    id: 'pacifico',
    family: 'Pacifico',
    displayName: 'Pacifico',
    category: 'handwriting',
    language: 'english',
    weights: [400],
    hasItalic: false,
    source: 'google',
    googleUrl: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap',
    previewText: 'Summer',
    description: '여유로운 브러시체',
    tags: ['브러시', '캐주얼'],
    sortOrder: 3,
  },
]

// ============================================
// 통합 폰트 목록
// ============================================

/** 모든 내장 폰트 */
export const ALL_FONTS: FontDefinition[] = [
  ...KOREAN_SANS_FONTS,
  ...KOREAN_SERIF_FONTS,
  ...KOREAN_HANDWRITING_FONTS,
  ...KOREAN_DISPLAY_FONTS,
  ...ENGLISH_SERIF_FONTS,
  ...ENGLISH_SANS_FONTS,
  ...ENGLISH_HANDWRITING_FONTS,
]

/** 카테고리별 폰트 맵 */
export const FONTS_BY_CATEGORY: Record<FontCategory, FontDefinition[]> = {
  'sans-serif': [...KOREAN_SANS_FONTS, ...ENGLISH_SANS_FONTS],
  'serif': [...KOREAN_SERIF_FONTS, ...ENGLISH_SERIF_FONTS],
  'display': [...KOREAN_DISPLAY_FONTS],
  'handwriting': [...KOREAN_HANDWRITING_FONTS, ...ENGLISH_HANDWRITING_FONTS],
  'monospace': [],
}

/** 언어별 폰트 맵 */
export const FONTS_BY_LANGUAGE: Record<FontLanguage, FontDefinition[]> = {
  korean: [
    ...KOREAN_SANS_FONTS,
    ...KOREAN_SERIF_FONTS,
    ...KOREAN_HANDWRITING_FONTS,
    ...KOREAN_DISPLAY_FONTS,
  ],
  english: [
    ...ENGLISH_SERIF_FONTS,
    ...ENGLISH_SANS_FONTS,
    ...ENGLISH_HANDWRITING_FONTS,
  ],
  both: ALL_FONTS.filter((f) => f.language === 'both'),
}

// ============================================
// 카테고리 라벨
// ============================================

export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  'sans-serif': '고딕',
  'serif': '명조',
  'display': '디스플레이',
  'handwriting': '손글씨',
  'monospace': '고정폭',
}

export const FONT_CATEGORY_ICONS: Record<FontCategory, string> = {
  'sans-serif': '가',
  'serif': '가',
  'display': 'Aa',
  'handwriting': '✍️',
  'monospace': '</>',
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 폰트 ID로 폰트 정의 찾기
 */
export function getFontById(id: string): FontDefinition | undefined {
  return ALL_FONTS.find((f) => f.id === id)
}

/**
 * 폰트 family 이름으로 폰트 정의 찾기
 */
export function getFontByFamily(family: string): FontDefinition | undefined {
  return ALL_FONTS.find(
    (f) => f.family.toLowerCase() === family.toLowerCase()
  )
}

/**
 * 카테고리별 폰트 필터링
 */
export function getFontsByCategory(category: FontCategory): FontDefinition[] {
  return FONTS_BY_CATEGORY[category] || []
}

/**
 * 검색어로 폰트 필터링
 */
export function searchFonts(query: string): FontDefinition[] {
  const lowerQuery = query.toLowerCase()
  return ALL_FONTS.filter(
    (f) =>
      f.family.toLowerCase().includes(lowerQuery) ||
      f.displayName.toLowerCase().includes(lowerQuery) ||
      f.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Google Fonts URL 생성
 */
export function buildGoogleFontsUrl(fonts: FontDefinition[]): string {
  const googleFonts = fonts.filter((f) => f.source === 'google' && f.googleUrl)

  if (googleFonts.length === 0) return ''

  const families = googleFonts.map((f) => {
    const weights = f.weights.join(';')
    const family = f.family.replace(/ /g, '+')
    return f.hasItalic
      ? `family=${family}:ital,wght@0,${weights};1,${weights}`
      : `family=${family}:wght@${weights}`
  })

  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`
}

/**
 * 폰트 가중치 라벨
 */
export function getWeightLabel(weight: FontWeightNumeric): string {
  const labels: Record<FontWeightNumeric, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  }
  return labels[weight]
}
