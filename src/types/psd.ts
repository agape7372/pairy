/**
 * PSD/CLIP 파일 파싱 관련 타입 정의
 *
 * @description
 * 포토샵(PSD) 및 클립스튜디오(CLIP) 파일에서 추출한 레이어 정보를
 * 에디터 슬롯/필드로 변환하기 위한 타입 시스템
 */

// ============================================
// 기본 타입
// ============================================

/** 지원하는 디자인 파일 포맷 */
export type DesignFileFormat = 'psd' | 'clip'

/** 레이어 타입 */
export type LayerType = 'image' | 'text' | 'group' | 'shape' | 'adjustment'

/** 레이어 가시성 상태 */
export type LayerVisibility = 'visible' | 'hidden'

// ============================================
// 레이어 관련 타입
// ============================================

/** 레이어 위치 및 크기 */
export interface LayerBounds {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** 텍스트 레이어 스타일 */
export interface TextLayerStyle {
  readonly fontFamily?: string
  readonly fontSize?: number
  readonly fontColor?: string
  readonly textAlign?: 'left' | 'center' | 'right'
  readonly lineHeight?: number
  readonly letterSpacing?: number
}

/** 추출된 레이어 정보 */
export interface ExtractedLayer {
  /** 고유 ID (파싱 시 생성) */
  readonly id: string
  /** 레이어 이름 (PSD에서 추출) */
  readonly name: string
  /** 레이어 타입 */
  readonly type: LayerType
  /** 위치 및 크기 */
  readonly bounds: LayerBounds
  /** 가시성 */
  readonly visibility: LayerVisibility
  /** 불투명도 (0-1) */
  readonly opacity: number
  /** 부모 그룹 ID (최상위면 null) */
  readonly parentId: string | null
  /** 레이어 깊이 (중첩 수준) */
  readonly depth: number
  /** 이미지 데이터 URL (image 타입인 경우) */
  readonly imageDataUrl?: string
  /** 텍스트 내용 (text 타입인 경우) */
  readonly textContent?: string
  /** 텍스트 스타일 (text 타입인 경우) */
  readonly textStyle?: TextLayerStyle
  /** 자식 레이어 ID 목록 (group 타입인 경우) */
  readonly children?: readonly string[]
  /** 원본 레이어 순서 (렌더링 순서) */
  readonly order: number
}

// ============================================
// 파싱 결과 타입
// ============================================

/** 캔버스/문서 정보 */
export interface DocumentInfo {
  /** 문서 너비 (px) */
  readonly width: number
  /** 문서 높이 (px) */
  readonly height: number
  /** 비트 심도 */
  readonly bitDepth: 8 | 16 | 32
  /** 색상 모드 */
  readonly colorMode: 'RGB' | 'CMYK' | 'Grayscale' | 'Other'
  /** DPI (해상도) */
  readonly resolution?: number
}

/** 파싱 상태 */
export type ParseStatus = 'idle' | 'validating' | 'parsing' | 'extracting' | 'complete' | 'error'

/** 파싱 진행 상황 */
export interface ParseProgress {
  /** 현재 상태 */
  readonly status: ParseStatus
  /** 진행률 (0-100) */
  readonly percentage: number
  /** 현재 작업 설명 */
  readonly message: string
  /** 처리 중인 레이어 이름 */
  readonly currentLayer?: string
}

/** 파싱 에러 */
export interface ParseError {
  /** 에러 코드 */
  readonly code:
    | 'INVALID_FILE_TYPE'
    | 'FILE_TOO_LARGE'
    | 'CORRUPTED_FILE'
    | 'UNSUPPORTED_FORMAT'
    | 'PARSE_ERROR'
    | 'MEMORY_ERROR'
    | 'BROWSER_NOT_SUPPORTED'
  /** 사용자 친화적 메시지 */
  readonly message: string
  /** 상세 정보 (디버깅용) */
  readonly details?: string
}

/** PSD 파싱 결과 */
export interface PSDParseResult {
  /** 성공 여부 */
  readonly success: boolean
  /** 파일 정보 */
  readonly fileInfo: {
    readonly name: string
    readonly size: number
    readonly format: DesignFileFormat
  }
  /** 문서 정보 */
  readonly document?: DocumentInfo
  /** 추출된 레이어 목록 */
  readonly layers?: readonly ExtractedLayer[]
  /** 에러 정보 (실패 시) */
  readonly error?: ParseError
  /** 파싱 소요 시간 (ms) */
  readonly parseTime?: number
}

// ============================================
// 슬롯 매핑 타입
// ============================================

/** 페어틀 슬롯 카테고리 (페어틀 구조 기반) */
export type PairTemplateCategory =
  | 'character' // 캐릭터 영역 (A, B, ...)
  | 'info' // 기본 정보 (이름, 나이 등)
  | 'appearance' // 외모 (머리, 눈, 피부 등)
  | 'personality' // 성격/표정
  | 'relationship' // 관계성
  | 'extra' // 추가 정보 (의상, 동물화 등)
  | 'meta' // 메타 (출처, 카피라이트 등)
  | 'unknown' // 미분류

/** 레이어-슬롯 매핑 규칙 */
export interface LayerMappingRule {
  /** 레이어 이름 패턴 (정규식 또는 문자열) */
  readonly pattern: RegExp | string
  /** 매핑될 카테고리 */
  readonly category: PairTemplateCategory
  /** 생성될 슬롯/필드 타입 */
  readonly outputType: 'slot' | 'textField' | 'colorField'
  /** 자동 생성 시 사용할 라벨 */
  readonly label?: string
}

/** 레이어-슬롯 매핑 결과 */
export interface LayerMappingSuggestion {
  /** 원본 레이어 ID */
  readonly layerId: string
  /** 레이어 이름 */
  readonly layerName: string
  /** 추천 카테고리 */
  readonly suggestedCategory: PairTemplateCategory
  /** 추천 출력 타입 */
  readonly suggestedOutputType: 'slot' | 'textField' | 'colorField'
  /** 신뢰도 (0-1) */
  readonly confidence: number
  /** 사용자가 선택했는지 여부 */
  selected: boolean
}

// ============================================
// 상수
// ============================================

/** 최대 파일 크기 (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024

/** 지원하는 파일 확장자 */
export const SUPPORTED_EXTENSIONS = ['.psd', '.clip'] as const

/** PSD 매직 바이트 (8BPS) */
export const PSD_MAGIC_BYTES = new Uint8Array([0x38, 0x42, 0x50, 0x53])

/** 기본 레이어 매핑 규칙 (페어틀 구조 기반) */
export const DEFAULT_LAYER_MAPPING_RULES: readonly LayerMappingRule[] = [
  // 캐릭터 영역
  { pattern: /^[A-Z]$/, category: 'character', outputType: 'slot', label: '캐릭터' },
  { pattern: /캐릭터|character/i, category: 'character', outputType: 'slot' },

  // 기본 정보
  { pattern: /이름|name/i, category: 'info', outputType: 'textField' },
  { pattern: /나이|age/i, category: 'info', outputType: 'textField' },
  { pattern: /성별|gender/i, category: 'info', outputType: 'textField' },
  { pattern: /키|height|cm/i, category: 'info', outputType: 'textField' },

  // 외모
  { pattern: /머리(색)?|hair/i, category: 'appearance', outputType: 'colorField' },
  { pattern: /(왼쪽|오른쪽)?눈(색)?|eye/i, category: 'appearance', outputType: 'colorField' },
  { pattern: /피부|skin/i, category: 'appearance', outputType: 'colorField' },
  { pattern: /눈매|눈썹/i, category: 'appearance', outputType: 'textField' },
  { pattern: /앞머리|머리길이/i, category: 'appearance', outputType: 'textField' },

  // 성격/표정
  { pattern: /표정|expression/i, category: 'personality', outputType: 'textField' },
  { pattern: /성격|personality/i, category: 'personality', outputType: 'textField' },

  // 관계성
  { pattern: /관계(성)?|relationship/i, category: 'relationship', outputType: 'textField' },
  { pattern: /페어(명)?|pair/i, category: 'relationship', outputType: 'textField' },

  // 추가 정보
  { pattern: /의상|costume|outfit/i, category: 'extra', outputType: 'textField' },
  { pattern: /동물화|animal/i, category: 'extra', outputType: 'textField' },
  { pattern: /테마(색)?|theme/i, category: 'extra', outputType: 'colorField' },
  { pattern: /필수.*포인트|point/i, category: 'extra', outputType: 'textField' },

  // 메타
  { pattern: /출처|source|@/i, category: 'meta', outputType: 'textField' },
  { pattern: /카피라이트|copyright|©/i, category: 'meta', outputType: 'textField' },
] as const

// ============================================
// 유틸리티 타입
// ============================================

/** 파싱 옵션 */
export interface ParseOptions {
  /** 이미지 데이터 추출 여부 (기본: true) */
  readonly extractImages?: boolean
  /** 텍스트 레이어 추출 여부 (기본: true) */
  readonly extractText?: boolean
  /** 숨김 레이어 포함 여부 (기본: false) */
  readonly includeHidden?: boolean
  /** 빈 레이어 포함 여부 (기본: false) */
  readonly includeEmpty?: boolean
  /** 이미지 최대 크기 (리사이징, 기본: 1024) */
  readonly maxImageSize?: number
  /** 진행 상황 콜백 */
  readonly onProgress?: (progress: ParseProgress) => void
}

/** 파싱 이벤트 핸들러 */
export interface ParseEventHandlers {
  onStart?: () => void
  onProgress?: (progress: ParseProgress) => void
  onComplete?: (result: PSDParseResult) => void
  onError?: (error: ParseError) => void
}
