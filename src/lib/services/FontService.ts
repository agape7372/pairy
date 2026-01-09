/**
 * Sprint 36: 폰트 로딩 서비스
 *
 * 기능:
 * - 동적 폰트 로딩
 * - 로딩 상태 추적
 * - 폰트 캐싱
 * - 프리로딩
 *
 * 설계 원칙:
 * - 싱글톤 패턴으로 전역 폰트 상태 관리
 * - Promise 기반 비동기 로딩
 * - 메모리 효율적인 캐싱
 */

import type {
  FontDefinition,
  FontLoadingState,
  FontWeightNumeric,
} from '@/types/font'
import { ALL_FONTS, getFontByFamily } from '@/types/font'

// ============================================
// 타입 정의
// ============================================

/** 폰트 로딩 결과 */
interface FontLoadResult {
  success: boolean
  fontId: string
  error?: string
  loadTime?: number
}

/** 폰트 서비스 이벤트 */
type FontServiceEvent = 'load-start' | 'load-complete' | 'load-error'

type FontServiceListener = (
  event: FontServiceEvent,
  payload: { fontId: string; state: FontLoadingState }
) => void

// ============================================
// 폰트 서비스 클래스
// ============================================

class FontServiceClass {
  /** 로딩 상태 맵 */
  private loadingStates: Map<string, FontLoadingState> = new Map()

  /** 로딩 프로미스 캐시 (중복 로딩 방지) */
  private loadingPromises: Map<string, Promise<FontLoadResult>> = new Map()

  /** 로드된 폰트 family 세트 */
  private loadedFamilies: Set<string> = new Set()

  /** 이벤트 리스너 */
  private listeners: Set<FontServiceListener> = new Set()

  /** 기본 폰트 (항상 로드됨) */
  private defaultFonts: string[] = [
    'Pretendard Variable',
    'Nanum Gothic',
    'Noto Sans KR',
  ]

  constructor() {
    // 브라우저 환경에서만 초기화
    if (typeof window !== 'undefined') {
      this.initializeDefaultFonts()
    }
  }

  // ============================================
  // 초기화
  // ============================================

  /**
   * 기본 폰트 상태 초기화
   */
  private initializeDefaultFonts(): void {
    // 시스템 폰트는 이미 로드된 것으로 간주
    const systemFonts = [
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'sans-serif',
      'serif',
    ]

    systemFonts.forEach((family) => {
      this.loadedFamilies.add(family)
    })

    // 기본 폰트 상태 설정
    this.defaultFonts.forEach((family) => {
      const font = getFontByFamily(family)
      if (font) {
        this.loadingStates.set(font.id, {
          fontId: font.id,
          status: 'idle',
        })
      }
    })
  }

  // ============================================
  // 폰트 로딩
  // ============================================

  /**
   * 단일 폰트 로딩
   *
   * @param fontDef - 폰트 정의
   * @param weights - 로드할 가중치 (없으면 전체)
   * @returns 로딩 결과
   */
  async loadFont(
    fontDef: FontDefinition,
    weights?: FontWeightNumeric[]
  ): Promise<FontLoadResult> {
    const { id, family } = fontDef

    // 이미 로드됨
    if (this.loadedFamilies.has(family)) {
      return { success: true, fontId: id }
    }

    // 로딩 중인 경우 기존 프로미스 반환
    const existingPromise = this.loadingPromises.get(id)
    if (existingPromise) {
      return existingPromise
    }

    // 새 로딩 시작
    const loadPromise = this.performFontLoad(fontDef, weights)
    this.loadingPromises.set(id, loadPromise)

    try {
      const result = await loadPromise
      return result
    } finally {
      this.loadingPromises.delete(id)
    }
  }

  /**
   * 실제 폰트 로딩 수행
   */
  private async performFontLoad(
    fontDef: FontDefinition,
    weights?: FontWeightNumeric[]
  ): Promise<FontLoadResult> {
    const { id, family, source, googleUrl } = fontDef
    const startTime = Date.now()

    // 상태 업데이트: loading
    this.updateLoadingState(id, {
      fontId: id,
      status: 'loading',
      startedAt: startTime,
    })

    try {
      // Google Fonts 로딩
      if (source === 'google' && googleUrl) {
        await this.loadGoogleFont(googleUrl)
      }

      // CSS Font Loading API로 폰트 로드 확인
      const weightsToLoad = weights || fontDef.weights
      await this.waitForFontLoad(family, weightsToLoad)

      const loadTime = Date.now() - startTime

      // 상태 업데이트: loaded
      this.updateLoadingState(id, {
        fontId: id,
        status: 'loaded',
        startedAt: startTime,
        loadedAt: Date.now(),
      })

      this.loadedFamilies.add(family)

      console.log(`[FontService] Loaded "${family}" in ${loadTime}ms`)

      return { success: true, fontId: id, loadTime }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'

      // 상태 업데이트: error
      this.updateLoadingState(id, {
        fontId: id,
        status: 'error',
        error: errorMessage,
        startedAt: startTime,
      })

      console.error(`[FontService] Failed to load "${family}":`, error)

      return { success: false, fontId: id, error: errorMessage }
    }
  }

  /**
   * Google Fonts CSS 로딩
   */
  private async loadGoogleFont(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 로드된 스타일시트 확인
      const existingLink = document.querySelector(`link[href="${url}"]`)
      if (existingLink) {
        resolve()
        return
      }

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url

      link.onload = () => resolve()
      link.onerror = () => reject(new Error(`Failed to load: ${url}`))

      document.head.appendChild(link)
    })
  }

  /**
   * CSS Font Loading API로 폰트 로드 대기
   */
  private async waitForFontLoad(
    family: string,
    weights: FontWeightNumeric[]
  ): Promise<void> {
    if (typeof document === 'undefined' || !document.fonts) {
      // Font Loading API 미지원 시 타임아웃으로 대체
      await new Promise((resolve) => setTimeout(resolve, 500))
      return
    }

    // 각 가중치에 대해 폰트 로드 확인
    const fontPromises = weights.map((weight) => {
      const fontSpec = `${weight} 16px "${family}"`
      return document.fonts.load(fontSpec).catch(() => {
        // 개별 가중치 실패는 무시 (일부만 있을 수 있음)
      })
    })

    await Promise.all(fontPromises)

    // fonts.ready로 최종 확인
    await document.fonts.ready
  }

  // ============================================
  // 복수 폰트 로딩
  // ============================================

  /**
   * 여러 폰트 동시 로딩
   */
  async loadFonts(fontDefs: FontDefinition[]): Promise<FontLoadResult[]> {
    const promises = fontDefs.map((font) => this.loadFont(font))
    return Promise.all(promises)
  }

  /**
   * 에디터용 필수 폰트 프리로딩
   */
  async preloadEditorFonts(): Promise<void> {
    const essentialFonts = ALL_FONTS.filter(
      (f) =>
        this.defaultFonts.includes(f.family) ||
        f.tags?.includes('인기') ||
        f.sortOrder === 1
    ).slice(0, 8) // 최대 8개만

    console.log(
      '[FontService] Preloading',
      essentialFonts.length,
      'editor fonts'
    )

    await this.loadFonts(essentialFonts)
  }

  // ============================================
  // 상태 조회
  // ============================================

  /**
   * 폰트 로딩 상태 조회
   */
  getLoadingState(fontId: string): FontLoadingState {
    return (
      this.loadingStates.get(fontId) || {
        fontId,
        status: 'idle',
      }
    )
  }

  /**
   * 폰트 로드 여부 확인
   */
  isFontLoaded(familyOrId: string): boolean {
    // family로 확인
    if (this.loadedFamilies.has(familyOrId)) {
      return true
    }

    // id로 확인
    const font = ALL_FONTS.find((f) => f.id === familyOrId)
    if (font && this.loadedFamilies.has(font.family)) {
      return true
    }

    return false
  }

  /**
   * 모든 로딩 상태 조회
   */
  getAllLoadingStates(): Map<string, FontLoadingState> {
    return new Map(this.loadingStates)
  }

  // ============================================
  // 이벤트 시스템
  // ============================================

  /**
   * 상태 업데이트 및 이벤트 발생
   */
  private updateLoadingState(fontId: string, state: FontLoadingState): void {
    this.loadingStates.set(fontId, state)

    const event: FontServiceEvent =
      state.status === 'loading'
        ? 'load-start'
        : state.status === 'loaded'
          ? 'load-complete'
          : state.status === 'error'
            ? 'load-error'
            : 'load-start'

    this.notifyListeners(event, { fontId, state })
  }

  /**
   * 리스너에게 이벤트 알림
   */
  private notifyListeners(
    event: FontServiceEvent,
    payload: { fontId: string; state: FontLoadingState }
  ): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event, payload)
      } catch (error) {
        console.error('[FontService] Listener error:', error)
      }
    })
  }

  /**
   * 이벤트 리스너 등록
   */
  subscribe(listener: FontServiceListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // ============================================
  // 유틸리티
  // ============================================

  /**
   * 폰트 유효성 확인 (렌더링 가능 여부)
   */
  async checkFontAvailability(family: string): Promise<boolean> {
    if (typeof document === 'undefined' || !document.fonts) {
      return true // SSR에서는 true 반환
    }

    try {
      return document.fonts.check(`16px "${family}"`)
    } catch {
      return false
    }
  }

  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.loadingStates.clear()
    this.loadingPromises.clear()
    this.loadedFamilies.clear()
    this.initializeDefaultFonts()
  }
}

// ============================================
// 싱글톤 인스턴스
// ============================================

export const FontService = new FontServiceClass()

// 기본 export
export default FontService
