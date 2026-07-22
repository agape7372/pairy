// 자료 카테고리 타입
export type ResourceCategory =
  | 'imeres'
  | 'tretle'
  | 'pairtl'
  | 'sessionlog'
  | 'cocofolia'
  | 'program'

/**
 * 업로드 방식
 * - media: 이미지 미리보기 + (선택)파일 업로드 — 시각 자료
 * - file: 파일 전용 — 프로그램/세션 데이터 등
 */
export type UploadMode = 'media' | 'file'

// 카테고리 정보
export const RESOURCE_CATEGORIES: Record<ResourceCategory, {
  id: ResourceCategory
  name: string
  nameKo: string
  description: string
  emoji: string
  color: string
  bgColor: string
  uploadMode: UploadMode
}> = {
  imeres: {
    id: 'imeres',
    name: 'Imeres',
    nameKo: '이메레스',
    description: '이미지 리소스, 배경, 소스 자료',
    emoji: '🖼️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    uploadMode: 'media',
  },
  tretle: {
    id: 'tretle',
    name: 'Tretle',
    nameKo: '트레틀',
    description: '트레이싱 틀, 밑그림 가이드',
    emoji: '✏️',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    uploadMode: 'media',
  },
  pairtl: {
    id: 'pairtl',
    name: 'Pairtl',
    nameKo: '페어틀',
    description: '2인+ 협업용 프로필, 관계도 틀',
    emoji: '💕',
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    uploadMode: 'media',
  },
  sessionlog: {
    id: 'sessionlog',
    name: 'Session Log',
    nameKo: '세션로그',
    description: 'TRPG, 세션 기록용 템플릿',
    emoji: '📜',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    uploadMode: 'file',
  },
  cocofolia: {
    id: 'cocofolia',
    name: 'CoCoFolia',
    nameKo: '코코포리아',
    description: '코코포리아 세션룸, 코마, 꾸미기 파일',
    emoji: '🎲',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    uploadMode: 'file',
  },
  program: {
    id: 'program',
    name: 'Program',
    nameKo: '프로그램',
    description: '자캐/창작 지원 프로그램, 배포 툴',
    emoji: '💻',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    uploadMode: 'file',
  },
}

// 라이선스 타입
export type LicenseType = 'free' | 'credit' | 'noncommercial' | 'paid'

export const LICENSE_INFO: Record<LicenseType, {
  id: LicenseType
  name: string
  description: string
  icon: string
  requirements: string[]
}> = {
  free: {
    id: 'free',
    name: '자유 이용',
    description: '출처 표기 없이 자유롭게 사용 가능',
    icon: '✅',
    requirements: [],
  },
  credit: {
    id: 'credit',
    name: '출처 표기',
    description: '크리에이터 출처 표기 필수',
    icon: '📝',
    requirements: ['크리에이터 이름/ID 표기'],
  },
  noncommercial: {
    id: 'noncommercial',
    name: '비상업적 이용',
    description: '비상업적 용도로만 사용 가능',
    icon: '🚫',
    requirements: ['크리에이터 출처 표기', '상업적 사용 금지'],
  },
  paid: {
    id: 'paid',
    name: '유료 자료',
    description: '구매 후 이용 가능',
    icon: '💰',
    requirements: ['구매 필수', '재배포 금지'],
  },
}

// 파일 형식 타입
export type FileFormat = 'png' | 'jpg' | 'psd' | 'clip' | 'svg' | 'webp'

export const FILE_FORMAT_INFO: Record<FileFormat, {
  extension: string
  name: string
  supportsTransparency: boolean
}> = {
  png: { extension: '.png', name: 'PNG', supportsTransparency: true },
  jpg: { extension: '.jpg', name: 'JPEG', supportsTransparency: false },
  psd: { extension: '.psd', name: 'Photoshop', supportsTransparency: true },
  clip: { extension: '.clip', name: 'CLIP STUDIO', supportsTransparency: true },
  svg: { extension: '.svg', name: 'SVG', supportsTransparency: true },
  webp: { extension: '.webp', name: 'WebP', supportsTransparency: true },
}

// 확장된 자료/템플릿 타입
export interface Resource {
  id: string
  title: string
  description: string

  // 카테고리 및 태그
  category: ResourceCategory
  tags: string[]

  // 크리에이터 정보
  creator: {
    id: string
    displayName: string
    username: string
    avatarUrl?: string
    isVerified: boolean
  }

  // 파일 정보
  fileInfo: {
    format: FileFormat[]
    width: number
    height: number
    sizeKB: number
    hasTransparency: boolean
  }

  // 라이선스
  license: LicenseType
  price?: number // paid인 경우

  // 통계
  stats: {
    views: number
    downloads: number
    likes: number
    uses: number // 작품에 사용된 횟수
  }

  // 미리보기 이미지
  thumbnailUrl: string
  previewUrls: string[]

  // 실 다운로드 대상 (M5 서버 자료 — 샘플엔 없음)
  downloadUrl?: string
  externalUrl?: string

  // 메타데이터
  createdAt: string
  updatedAt: string
  isPremium: boolean
}

/**
 * 카드/상세에 표시할 파일 형식 라벨.
 * `fileInfo.format` 은 비어 있을 수 있다 — 외부 링크만 등록한 자료(file_name null)나
 * KNOWN_FORMATS 밖 확장자(zip·pdf 등)는 매핑에서 빈 배열이 된다.
 * 따라서 `format[0]` 을 그대로 참조하지 말고 이 함수를 쓴다.
 */
export function resourceFormatLabel(resource: Resource): string {
  const known = resource.fileInfo.format[0]
  if (known) return known.toUpperCase()
  if (resource.downloadUrl) return '파일'
  if (resource.externalUrl) return '링크'
  return ''
}

// 태그 목록 (카테고리별)
export const CATEGORY_TAGS: Record<ResourceCategory, string[]> = {
  imeres: ['배경', '소스', '텍스처', '패턴', '프레임', '데코', '이펙트', '캐릭터'],
  tretle: ['전신', '반신', '얼굴', '손', '포즈', '의상', '소품', '동물'],
  pairtl: ['커플', '친구', '관계도', '프로필', '2인용', '3인용+', 'OC', '팬아트'],
  sessionlog: ['TRPG', '캐릭터시트', '세션기록', '월드빌딩', 'NPC', '아이템', '맵'],
  cocofolia: ['세션룸', '코마', '배경', 'BGM', '판넬', '스탠딩', '이펙트', '다이스'],
  program: ['자동화', '에디터', '뷰어', '생성기', '유틸', '확장프로그램', '웹앱', '오픈소스'],
}

// 정렬 옵션
export type SortOption = 'popular' | 'recent' | 'downloads' | 'likes'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'popular', label: '인기순' },
  { value: 'recent', label: '최신순' },
  { value: 'downloads', label: '다운로드순' },
  { value: 'likes', label: '좋아요순' },
]
