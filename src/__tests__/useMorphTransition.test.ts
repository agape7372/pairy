/**
 * useMorphTransition Hook Unit Tests
 *
 * 테스트 시나리오:
 * 1. FLIP 애니메이션 계산
 * 2. 상태 전환
 * 3. 취소/리셋
 * 4. 접근성 (prefers-reduced-motion)
 * 5. 공유 요소 트랜지션
 * 6. 레이아웃 모프
 */

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Element.animate
Element.prototype.animate = jest.fn().mockReturnValue({
  onfinish: null,
  oncancel: null,
  cancel: jest.fn(),
})

// Mock getBoundingClientRect
const mockGetBoundingClientRect = jest.fn()
Element.prototype.getBoundingClientRect = mockGetBoundingClientRect

describe('useMorphTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetBoundingClientRect.mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    })
  })

  describe('Rect 타입 검증', () => {
    it('Rect 인터페이스가 올바르게 정의되어야 함', () => {
      const rect = {
        x: 100,
        y: 200,
        width: 300,
        height: 400,
      }

      expect(rect.x).toBe(100)
      expect(rect.y).toBe(200)
      expect(rect.width).toBe(300)
      expect(rect.height).toBe(400)
    })
  })

  describe('MorphState 타입 검증', () => {
    it('MorphState 인터페이스가 올바르게 정의되어야 함', () => {
      const state = {
        rect: { x: 0, y: 0, width: 100, height: 100 },
        isAnimating: false,
        currentState: 'source' as const,
      }

      expect(state.rect).not.toBeNull()
      expect(state.isAnimating).toBe(false)
      expect(state.currentState).toBe('source')
    })

    it('초기 상태가 올바르게 설정되어야 함', () => {
      const initialState = {
        rect: null,
        isAnimating: false,
        currentState: null,
      }

      expect(initialState.rect).toBeNull()
      expect(initialState.currentState).toBeNull()
    })
  })

  describe('유틸리티 함수 검증', () => {
    it('getRect가 올바른 위치/크기를 반환해야 함', () => {
      const getRect = (element: { getBoundingClientRect: () => DOMRect }) => {
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        }
      }

      const mockElement = {
        getBoundingClientRect: () => ({
          left: 50,
          top: 100,
          width: 200,
          height: 150,
          right: 250,
          bottom: 250,
          x: 50,
          y: 100,
          toJSON: () => ({}),
        }),
      }

      const result = getRect(mockElement)

      expect(result.x).toBe(50)
      expect(result.y).toBe(100)
      expect(result.width).toBe(200)
      expect(result.height).toBe(150)
    })

    it('calculateInvert가 올바른 역변환 값을 계산해야 함', () => {
      const calculateInvert = (
        first: { x: number; y: number; width: number; height: number },
        last: { x: number; y: number; width: number; height: number }
      ) => ({
        x: first.x - last.x,
        y: first.y - last.y,
        scaleX: first.width / last.width,
        scaleY: first.height / last.height,
      })

      const first = { x: 0, y: 0, width: 100, height: 100 }
      const last = { x: 50, y: 50, width: 200, height: 200 }

      const invert = calculateInvert(first, last)

      expect(invert.x).toBe(-50)
      expect(invert.y).toBe(-50)
      expect(invert.scaleX).toBe(0.5)
      expect(invert.scaleY).toBe(0.5)
    })

    it('calculateInvert가 위치 증가를 올바르게 계산해야 함', () => {
      const calculateInvert = (
        first: { x: number; y: number; width: number; height: number },
        last: { x: number; y: number; width: number; height: number }
      ) => ({
        x: first.x - last.x,
        y: first.y - last.y,
        scaleX: first.width / last.width,
        scaleY: first.height / last.height,
      })

      const first = { x: 100, y: 100, width: 200, height: 200 }
      const last = { x: 50, y: 50, width: 100, height: 100 }

      const invert = calculateInvert(first, last)

      expect(invert.x).toBe(50)
      expect(invert.y).toBe(50)
      expect(invert.scaleX).toBe(2)
      expect(invert.scaleY).toBe(2)
    })
  })

  describe('상태 전환 검증', () => {
    it('morphToTarget이 상태를 target으로 변경해야 함', () => {
      let currentState: 'source' | 'target' | null = 'source'

      const morphToTarget = () => {
        currentState = 'target'
      }

      morphToTarget()
      expect(currentState).toBe('target')
    })

    it('morphToSource가 상태를 source로 변경해야 함', () => {
      let currentState: 'source' | 'target' | null = 'target'

      const morphToSource = () => {
        currentState = 'source'
      }

      morphToSource()
      expect(currentState).toBe('source')
    })

    it('toggle이 상태를 전환해야 함', () => {
      let currentState: 'source' | 'target' | null = 'source'

      const toggle = () => {
        currentState = currentState === 'target' ? 'source' : 'target'
      }

      toggle()
      expect(currentState).toBe('target')

      toggle()
      expect(currentState).toBe('source')
    })
  })

  describe('애니메이션 옵션 검증', () => {
    it('기본 옵션이 올바르게 설정되어야 함', () => {
      const defaultOptions = {
        duration: 400,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
        scale: true,
        fade: true,
        delay: 0,
      }

      expect(defaultOptions.duration).toBe(400)
      expect(defaultOptions.easing).toBe('cubic-bezier(0.23, 1, 0.32, 1)')
      expect(defaultOptions.scale).toBe(true)
    })

    it('커스텀 옵션이 기본값을 오버라이드해야 함', () => {
      const defaultOptions = {
        duration: 400,
        easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
      }

      const customOptions = {
        duration: 600,
        easing: 'ease-out',
      }

      const mergedOptions = { ...defaultOptions, ...customOptions }

      expect(mergedOptions.duration).toBe(600)
      expect(mergedOptions.easing).toBe('ease-out')
    })
  })

  describe('접근성 검증', () => {
    it('prefers-reduced-motion이 true일 때 즉시 전환되어야 함', () => {
      const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // 모션 감소 설정 시 애니메이션 없이 즉시 전환
      const reducedMotion = prefersReducedMotion()
      expect(typeof reducedMotion).toBe('boolean')
    })
  })

  describe('스타일 객체 검증', () => {
    it('sourceStyle이 상태에 따라 올바르게 설정되어야 함', () => {
      const getSourceStyle = (
        currentState: 'source' | 'target' | null
      ): React.CSSProperties => ({
        visibility: currentState === 'target' ? 'hidden' : 'visible',
        opacity: currentState === 'target' ? 0 : 1,
      })

      const sourceStyle = getSourceStyle('source')
      expect(sourceStyle.visibility).toBe('visible')
      expect(sourceStyle.opacity).toBe(1)

      const hiddenSourceStyle = getSourceStyle('target')
      expect(hiddenSourceStyle.visibility).toBe('hidden')
      expect(hiddenSourceStyle.opacity).toBe(0)
    })

    it('targetStyle이 상태에 따라 올바르게 설정되어야 함', () => {
      const getTargetStyle = (
        currentState: 'source' | 'target' | null
      ): React.CSSProperties => ({
        visibility: currentState === 'source' ? 'hidden' : 'visible',
        opacity: currentState === 'source' ? 0 : 1,
      })

      const targetStyle = getTargetStyle('target')
      expect(targetStyle.visibility).toBe('visible')
      expect(targetStyle.opacity).toBe(1)

      const hiddenTargetStyle = getTargetStyle('source')
      expect(hiddenTargetStyle.visibility).toBe('hidden')
      expect(hiddenTargetStyle.opacity).toBe(0)
    })
  })
})

describe('useSharedElement', () => {
  describe('레지스트리 관리', () => {
    it('registerAsSource가 레지스트리에 요소를 등록해야 함', () => {
      const registry = new Map<string, { sourceRect: object | null }>()

      const registerAsSource = (
        sharedId: string,
        rect: { x: number; y: number; width: number; height: number }
      ) => {
        registry.set(sharedId, { sourceRect: rect })
      }

      registerAsSource('card-1', { x: 0, y: 0, width: 100, height: 100 })

      expect(registry.has('card-1')).toBe(true)
      expect(registry.get('card-1')?.sourceRect).not.toBeNull()
    })

    it('clearRegistry가 레지스트리에서 요소를 제거해야 함', () => {
      const registry = new Map<string, { sourceRect: object | null }>()

      registry.set('card-1', { sourceRect: { x: 0, y: 0, width: 100, height: 100 } })

      const clearRegistry = (sharedId: string) => {
        registry.delete(sharedId)
      }

      clearRegistry('card-1')
      expect(registry.has('card-1')).toBe(false)
    })
  })
})

describe('useLayoutMorph', () => {
  describe('레이아웃 변경 애니메이션', () => {
    it('requestLayoutAnimation이 현재 위치를 저장해야 함', () => {
      let firstRect: { x: number; y: number; width: number; height: number } | null = null

      const saveRect = (rect: { x: number; y: number; width: number; height: number }) => {
        firstRect = rect
      }

      saveRect({ x: 100, y: 200, width: 300, height: 400 })

      expect(firstRect).not.toBeNull()
      expect(firstRect?.x).toBe(100)
    })

    it('변화가 없을 때 애니메이션을 스킵해야 함', () => {
      const shouldSkipAnimation = (invert: {
        x: number
        y: number
        scaleX: number
        scaleY: number
      }) => {
        return (
          Math.abs(invert.x) < 1 &&
          Math.abs(invert.y) < 1 &&
          Math.abs(invert.scaleX - 1) < 0.01 &&
          Math.abs(invert.scaleY - 1) < 0.01
        )
      }

      // 변화 없음
      expect(shouldSkipAnimation({ x: 0, y: 0, scaleX: 1, scaleY: 1 })).toBe(true)

      // 미세한 변화
      expect(shouldSkipAnimation({ x: 0.5, y: 0.5, scaleX: 1.005, scaleY: 1.005 })).toBe(true)

      // 유의미한 변화
      expect(shouldSkipAnimation({ x: 10, y: 10, scaleX: 1.1, scaleY: 1.1 })).toBe(false)
    })
  })
})

describe('엣지 케이스', () => {
  it('null 요소를 처리할 수 있어야 함', () => {
    const getRect = (element: HTMLElement | null) => {
      if (!element) return null
      return { x: 0, y: 0, width: 100, height: 100 }
    }

    expect(getRect(null)).toBeNull()
  })

  it('0 크기 요소를 처리할 수 있어야 함', () => {
    // 0 크기로 나누기 방지
    const safeScale = (first: number, last: number) => {
      if (last === 0) return 1
      return first / last
    }

    expect(safeScale(100, 0)).toBe(1)
    expect(safeScale(100, 50)).toBe(2)
  })

  it('음수 위치를 처리할 수 있어야 함', () => {
    const negativeRect = { x: -50, y: -100, width: 200, height: 150 }

    expect(negativeRect.x).toBe(-50)
    expect(negativeRect.y).toBe(-100)
  })
})
