/**
 * Pairy 템플릿 설정 스키마 v2
 *
 * 3단 레이어 구조:
 * 1. background - 맨 뒤 배경 (이미지, 단색, 그라데이션)
 * 2. slots - 사용자 이미지 영역 (마스킹 지원: shape/image)
 * 3. overlay - 맨 앞 장식/프레임 이미지
 *
 * 시장 참고: Canva, Figma, Photopea 마스킹 방식 반영
 */

// ============================================
// 기본 타입
// ============================================

/** 위치 및 크기 변환 */
export interface Transform {
  x: number
  y: number
  width: number
  height: number
  rotation?: number // 회전 각도 (도 단위, 기본값: 0)
  scaleX?: number // X축 스케일 (기본값: 1)
  scaleY?: number // Y축 스케일 (기본값: 1)
  originX?: number // 변환 원점 X (0-1, 기본값: 0.5)
  originY?: number // 변환 원점 Y (0-1, 기본값: 0.5)
}

/** 동적 색상 참조 키 */
export type ColorReference =
  | 'primaryColor' // 사용자 지정 메인 컬러
  | 'secondaryColor' // 사용자 지정 서브 컬러
  | 'accentColor' // 강조 컬러
  | 'textColor' // 텍스트 기본 컬러

/** 텍스트 정렬 */
export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

/** 폰트 스타일 */
export type FontWeight =
  | 'normal'
  | 'bold'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
export type FontStyle = 'normal' | 'italic'

/** 지원하는 마스크 모양 */
export type MaskShape =
  | 'rect' // 직사각형
  | 'circle' // 원형
  | 'roundedRect' // 둥근 모서리 직사각형
  | 'ellipse' // 타원
  | 'heart' // 하트
  | 'star' // 별
  | 'hexagon' // 육각형
  | 'diamond' // 다이아몬드
  | 'triangle' // 삼각형

// ============================================
// 마스크 설정
// ============================================

/** Shape 기반 마스크 (벡터) */
export interface ShapeMask {
  type: 'shape'
  shape: MaskShape
  cornerRadius?: number // roundedRect일 때 모서리 반경
  points?: number // star일 때 꼭짓점 개수 (기본값: 5)
  innerRadius?: number // star일 때 내부 반경 비율 (0-1, 기본값: 0.5)
}

/** Image 기반 마스크 (알파 채널 사용) */
export interface ImageMask {
  type: 'image'
  imageUrl: string // 마스크 이미지 경로 (흰색=표시, 검정=숨김)
  invert?: boolean // true면 반전 (검정=표시, 흰색=숨김)
}

export type MaskConfig = ShapeMask | ImageMask

// ============================================
// 레이어 요소 타입
// ============================================

/** 배경 레이어 설정 */
export interface BackgroundLayer {
  type: 'image' | 'solid' | 'gradient'

  // type: 'image'일 때
  imageUrl?: string
  imageFit?: 'cover' | 'contain' | 'fill' | 'tile' // 기본값: cover

  // type: 'solid'일 때
  color?: string | ColorReference

  // type: 'gradient'일 때
  gradient?: {
    type: 'linear' | 'radial'
    colors: Array<{ offset: number; color: string | ColorReference }>
    angle?: number // linear일 때 각도 (기본값: 0)
    centerX?: number // radial일 때 중심 X (0-1, 기본값: 0.5)
    centerY?: number // radial일 때 중심 Y (0-1, 기본값: 0.5)
  }
}

/** 이미지 슬롯 (마스킹 영역) */
export interface ImageSlot {
  id: string
  name: string // UI 표시명 (예: "캐릭터 A")

  // 위치 및 크기
  transform: Transform

  // 마스킹 설정 (shape 또는 image)
  mask?: MaskConfig

  // 이미지 피팅 방식
  imageFit?: 'cover' | 'contain' | 'fill' // 기본값: cover

  // 이미지 위치 조정 (cover/contain일 때 사용)
  imagePosition?: {
    x?: number // -1 ~ 1 (0 = 중앙)
    y?: number // -1 ~ 1 (0 = 중앙)
  }

  // 테두리 설정
  border?: {
    width: number
    color: string | ColorReference
    style?: 'solid' | 'dashed' | 'dotted'
    dashArray?: number[] // dashed/dotted일 때 패턴
  }

  // 그림자 효과
  shadow?: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }

  // 기본 플레이스홀더 이미지
  placeholder?: string

  // 데이터 바인딩 키 (예: 'characterA')
  dataKey: string

  // 클릭 가능 여부 (에디팅용)
  clickable?: boolean // 기본값: true
}

/** 텍스트 필드 */
export interface TextField {
  id: string

  // 위치 및 크기
  transform: Transform

  // 데이터 바인딩 키 (예: 'charName', 'date')
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
    verticalAlign?: VerticalAlign
    lineHeight?: number // 기본값: 1.2
    letterSpacing?: number // 픽셀 단위
    textDecoration?: 'none' | 'underline' | 'line-through'
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
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
    glow?: {
      color: string | ColorReference
      blur: number
    }
  }

  // 배경 (선택적)
  background?: {
    color: string | ColorReference
    padding?: number
    cornerRadius?: number
  }

  // 입력 제한
  maxLength?: number
  multiline?: boolean // 기본값: false
  minFontSize?: number // 자동 축소 최소 크기
}

/** 동적 색상 도형 (사용자 컬러에 반응하는 장식 요소) */
export interface DynamicShape {
  id: string
  type: 'rect' | 'circle' | 'ellipse' | 'line' | 'path' | 'polygon' | 'arc'

  // 위치 및 크기
  transform: Transform

  // 채우기 색상 (동적 참조 가능)
  fill?: string | ColorReference

  // 테두리
  stroke?: {
    color: string | ColorReference
    width: number
    dashArray?: number[]
    lineCap?: 'butt' | 'round' | 'square'
    lineJoin?: 'miter' | 'round' | 'bevel'
  }

  // path 타입일 때 SVG 경로 데이터
  pathData?: string

  // polygon 타입일 때 점 배열 [x1, y1, x2, y2, ...]
  points?: number[]

  // arc 타입일 때 설정
  arc?: {
    innerRadius: number
    outerRadius: number
    startAngle: number // 도 단위
    endAngle: number
    clockwise?: boolean
  }

  // rect 타입일 때 모서리 둥글기
  cornerRadius?: number

  // 투명도
  opacity?: number // 0-1, 기본값: 1

  // 그림자
  shadow?: {
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }

  // 블렌드 모드
  blendMode?: GlobalCompositeOperation
}

/** 오버레이 이미지 (장식 프레임) */
export interface OverlayImage {
  id: string
  imageUrl: string
  transform: Transform
  opacity?: number // 0-1, 기본값: 1
  blendMode?: GlobalCompositeOperation
}

// ============================================
// 메인 템플릿 설정
// ============================================

/** 캔버스 설정 */
export interface CanvasConfig {
  width: number
  height: number
  backgroundColor?: string
  pixelRatio?: number // 내보내기 시 기본 해상도 배율 (기본값: 2)
}

/** 사용자 입력 필드 정의 */
export interface InputFieldConfig {
  key: string // formData에서 사용할 키
  type: 'text' | 'textarea' | 'color' | 'image' | 'date' | 'select' | 'number'
  label: string // UI에 표시할 라벨
  placeholder?: string
  defaultValue?: string
  required?: boolean
  // select 타입일 때 옵션
  options?: Array<{ value: string; label: string }>
  // number 타입일 때 범위
  min?: number
  max?: number
  step?: number
  // 연결된 슬롯 ID (그룹핑용)
  slotId?: string
  // 도움말 텍스트
  helpText?: string
}

/** 동적 색상 설정 */
export interface ColorConfig {
  key: ColorReference
  label: string
  defaultValue: string // Hex 코드 (#RRGGBB)
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
  tags?: string[]

  // 캔버스 설정
  canvas: CanvasConfig

  // 사용자 지정 색상 목록
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

  // 폰트 설정 (웹폰트 로드용)
  fonts?: Array<{
    family: string
    url?: string // Google Fonts URL 또는 커스텀 폰트 URL
    weights?: FontWeight[]
    styles?: FontStyle[]
  }>

  // 내보내기 설정
  exportSettings?: {
    defaultScale?: number // 기본값: 2
    formats?: ('png' | 'jpg' | 'webp')[] // 지원 포맷
    quality?: number // jpg/webp 품질 (0-1)
    watermark?: {
      text?: string
      imageUrl?: string
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
      opacity?: number
    }
  }
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
  [slotDataKey: string]: string | null // dataKey -> 이미지 URL 또는 Data URL
}

/** 사용자가 선택한 색상 */
export interface ColorData {
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  textColor?: string
  [key: string]: string | undefined
}

/** 에디터 전체 상태 */
export interface EditorData {
  templateId: string
  formData: FormData
  images: ImageData
  colors: ColorData
}

// ============================================
// 슬롯 이미지 변환 타입 (드래그/줌/회전)
// 변경 이유: TemplateRenderer.tsx와 canvasEditorStore.ts에서 중복 정의되어 있던 타입을 통합
// ============================================

/** 슬롯 내 이미지 변환 상태 */
export interface SlotImageTransform {
  x: number // -1 ~ 1 (중앙 = 0)
  y: number // -1 ~ 1 (중앙 = 0)
  scale: number // 1 = 원본
  rotation: number // 도 단위
}

/** 슬롯별 이미지 변환 데이터 */
export interface SlotTransforms {
  [slotId: string]: SlotImageTransform
}

/** 슬롯 이미지 변환 기본값 */
export const DEFAULT_SLOT_TRANSFORM: SlotImageTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
}

// ============================================
// 유틸리티 타입
// ============================================

/** GlobalCompositeOperation 타입 (Canvas 2D) */
export type GlobalCompositeOperation =
  | 'source-over'
  | 'source-in'
  | 'source-out'
  | 'source-atop'
  | 'destination-over'
  | 'destination-in'
  | 'destination-out'
  | 'destination-atop'
  | 'lighter'
  | 'copy'
  | 'xor'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'

/** 렌더러 ref 타입 (외부에서 접근하는 메서드) */
export interface TemplateRendererRef {
  exportToImage: (scale?: number) => Promise<string | null>
  exportToBlob: (scale?: number, format?: 'png' | 'jpg' | 'webp') => Promise<Blob | null>
  getStage: () => unknown // Konva.Stage
  resetView: () => void
  getDataURL: () => string | null
}
