/**
 * Pairy 템플릿 설정 스키마
 *
 * 3단 레이어 구조:
 * 1. background - 맨 뒤 배경 이미지
 * 2. slots - 사용자 이미지가 들어갈 영역 (마스킹 지원)
 * 3. overlay - 맨 앞 장식/프레임 이미지
 */

// ============================================
// 기본 타입
// ============================================

/** 위치 및 크기 */
export interface Transform {
  x: number
  y: number
  width: number
  height: number
  rotation?: number // 회전 각도 (도 단위)
  scaleX?: number
  scaleY?: number
}

/** 동적 색상 참조 키 */
export type ColorReference =
  | 'primaryColor'    // 사용자 지정 메인 컬러
  | 'secondaryColor'  // 사용자 지정 서브 컬러
  | 'accentColor'     // 강조 컬러
  | 'textColor'       // 텍스트 기본 컬러

/** 텍스트 정렬 */
export type TextAlign = 'left' | 'center' | 'right'

/** 폰트 스타일 */
export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'
export type FontStyle = 'normal' | 'italic'

// ============================================
// 레이어 요소 타입
// ============================================

/** 배경 레이어 설정 */
export interface BackgroundLayer {
  type: 'image' | 'solid' | 'gradient'

  // type: 'image'일 때
  imageUrl?: string

  // type: 'solid'일 때
  color?: string | ColorReference

  // type: 'gradient'일 때
  gradient?: {
    type: 'linear' | 'radial'
    colors: Array<{ offset: number; color: string | ColorReference }>
    angle?: number // linear일 때 각도
  }
}

/** 이미지 슬롯 (마스킹 영역) */
export interface ImageSlot {
  id: string
  name: string // 표시명 (예: "캐릭터 A", "캐릭터 B")

  // 위치 및 크기
  transform: Transform

  // 마스킹 설정
  mask?: {
    type: 'image' | 'shape'
    // type: 'image'일 때 - 마스크 이미지 경로
    imageUrl?: string
    // type: 'shape'일 때 - 모양
    shape?: 'circle' | 'rect' | 'roundedRect' | 'heart' | 'star'
    // roundedRect일 때 radius
    cornerRadius?: number
  }

  // 테두리 설정
  border?: {
    width: number
    color: string | ColorReference
    style?: 'solid' | 'dashed'
  }

  // 기본 플레이스홀더 이미지
  placeholder?: string

  // 이 슬롯이 참조할 데이터 키 (예: 'characterA', 'characterB')
  dataKey: string
}

/** 텍스트 필드 */
export interface TextField {
  id: string

  // 위치 및 크기
  transform: Transform

  // 데이터 바인딩 키 (예: 'charName', 'date', 'description')
  dataKey: string

  // 기본값/플레이스홀더
  defaultValue?: string
  placeholder?: string

  // 텍스트 스타일
  style: {
    fontFamily: string
    fontSize: number
    fontWeight?: FontWeight
    fontStyle?: FontStyle
    color: string | ColorReference
    align?: TextAlign
    verticalAlign?: 'top' | 'middle' | 'bottom'
    lineHeight?: number
    letterSpacing?: number
  }

  // 텍스트 효과
  effects?: {
    shadow?: {
      color: string
      blur: number
      offsetX: number
      offsetY: number
    }
    stroke?: {
      color: string | ColorReference
      width: number
    }
  }

  // 최대 글자 수
  maxLength?: number

  // 여러 줄 허용
  multiline?: boolean
}

/** 동적 색상 도형 (사용자 컬러에 반응하는 장식 요소) */
export interface DynamicShape {
  id: string
  type: 'rect' | 'circle' | 'ellipse' | 'line' | 'path'

  // 위치 및 크기
  transform: Transform

  // 채우기 색상 (동적 참조 가능)
  fill?: string | ColorReference

  // 테두리
  stroke?: {
    color: string | ColorReference
    width: number
    dashArray?: number[]
  }

  // path 타입일 때 SVG 경로 데이터
  pathData?: string

  // 모서리 둥글기 (rect)
  cornerRadius?: number
}

/** 오버레이 이미지 (장식 프레임) */
export interface OverlayImage {
  id: string
  imageUrl: string
  transform: Transform
  opacity?: number
}

// ============================================
// 메인 템플릿 설정
// ============================================

/** 캔버스 설정 */
export interface CanvasConfig {
  width: number
  height: number
  backgroundColor?: string
}

/** 사용자 입력 필드 정의 */
export interface InputFieldConfig {
  key: string // formData에서 사용할 키
  type: 'text' | 'textarea' | 'color' | 'image' | 'date' | 'select'
  label: string // UI에 표시할 라벨
  placeholder?: string
  defaultValue?: string
  required?: boolean
  // select 타입일 때 옵션
  options?: Array<{ value: string; label: string }>
  // 연결된 슬롯 ID (그룹핑용)
  slotId?: string
}

/** 동적 색상 설정 */
export interface ColorConfig {
  key: ColorReference
  label: string
  defaultValue: string // Hex 코드
}

/** 전체 템플릿 설정 */
export interface TemplateConfig {
  // 메타 정보
  id: string
  name: string
  description?: string
  category: 'pair' | 'profile' | 'group' | 'custom'
  thumbnail?: string
  author?: string
  version: string

  // 캔버스 설정
  canvas: CanvasConfig

  // 사용자 지정 색상
  colors: ColorConfig[]

  // 레이어 (렌더링 순서: background → slots → dynamicShapes → texts → overlays)
  layers: {
    background: BackgroundLayer
    slots: ImageSlot[]
    dynamicShapes?: DynamicShape[]
    texts: TextField[]
    overlays?: OverlayImage[]
  }

  // 사용자 입력 폼 구성
  inputFields: InputFieldConfig[]
}

// ============================================
// 런타임 데이터 타입 (사용자 입력값)
// ============================================

/** 사용자가 입력한 폼 데이터 */
export interface FormData {
  [key: string]: string | undefined
}

/** 사용자가 업로드한 이미지 */
export interface ImageData {
  [slotDataKey: string]: string | null // dataKey -> 이미지 URL
}

/** 사용자가 선택한 색상 */
export interface ColorData {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  textColor?: string
}

/** 에디터 전체 상태 */
export interface EditorData {
  templateId: string
  formData: FormData
  images: ImageData
  colors: ColorData
}
