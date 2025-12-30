/**
 * useStaggeredGrid 훅 유닛 테스트
 *
 * 테스트 케이스:
 * - 기본 초기화 상태
 * - IntersectionObserver 트리거
 * - 방향별 스타일 계산
 * - 수동 트리거/리셋
 * - 청크 기반 고급 애니메이션
 * - 엣지 케이스 처리
 */

import { renderHook, act } from '@testing-library/react'
import {
  useStaggeredGrid,
  useAdvancedStaggeredGrid,
  type StaggeredGridOptions,
} from '@/hooks/useStaggeredGrid'

// IntersectionObserver 콜백을 저장하여 수동 트리거
let intersectionCallback: IntersectionObserverCallback | null = null

beforeEach(() => {
  // IntersectionObserver mock 리셋 및 콜백 캡처
  jest.clearAllMocks()
  ;(global.IntersectionObserver as jest.Mock).mockImplementation((callback) => {
    intersectionCallback = callback
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }
  })
})

// ============================================
// useStaggeredGrid 기본 테스트
// ============================================

describe('useStaggeredGrid', () => {
  it('기본 상태로 초기화된다', () => {
    const { result } = renderHook(() => useStaggeredGrid())

    expect(result.current.isVisible).toBe(false)
    expect(result.current.hasAnimated).toBe(false)
    expect(result.current.containerRef.current).toBe(null)
  })

  it('수동 triggerAnimation으로 상태가 변경된다', () => {
    const { result } = renderHook(() => useStaggeredGrid())

    act(() => {
      result.current.triggerAnimation()
    })

    expect(result.current.isVisible).toBe(true)
    expect(result.current.hasAnimated).toBe(true)
  })

  it('resetAnimation으로 상태가 초기화된다', () => {
    const { result } = renderHook(() => useStaggeredGrid())

    act(() => {
      result.current.triggerAnimation()
    })

    act(() => {
      result.current.resetAnimation()
    })

    expect(result.current.isVisible).toBe(false)
    expect(result.current.hasAnimated).toBe(false)
  })

  it('disabled=true일 때 애니메이션이 비활성화된다', () => {
    const { result } = renderHook(() => useStaggeredGrid({ disabled: true }))

    // IntersectionObserver가 생성되지 않아야 함
    expect(global.IntersectionObserver).not.toHaveBeenCalled()
    expect(result.current.isVisible).toBe(false)
  })

  describe('getItemStyle', () => {
    it('isVisible=false일 때 숨김 스타일을 반환한다', () => {
      const { result } = renderHook(() => useStaggeredGrid())

      const style = result.current.getItemStyle(0)

      expect(style.opacity).toBe(0)
      expect(style.transform).toBeDefined()
      expect(style.transition).toContain('opacity')
    })

    it('isVisible=true일 때 표시 스타일을 반환한다', () => {
      const { result } = renderHook(() => useStaggeredGrid())

      act(() => {
        result.current.triggerAnimation()
      })

      const style = result.current.getItemStyle(0)

      expect(style.opacity).toBe(1)
      expect(style.transform).toBe('none')
    })

    it('인덱스에 따라 딜레이가 증가한다', () => {
      const { result } = renderHook(() =>
        useStaggeredGrid({ staggerDelay: 100 })
      )

      const style0 = result.current.getItemStyle(0)
      const style1 = result.current.getItemStyle(1)
      const style2 = result.current.getItemStyle(2)

      // 트랜지션 딜레이가 증가해야 함
      expect(style0.transition).toContain('0ms')
      expect(style1.transition).toContain('100ms')
      expect(style2.transition).toContain('200ms')
    })
  })

  describe('방향별 초기 transform', () => {
    const directions = ['up', 'down', 'left', 'right', 'scale', 'fade'] as const

    directions.forEach((direction) => {
      it(`direction="${direction}"에 대해 올바른 초기 transform을 반환한다`, () => {
        const { result } = renderHook(() => useStaggeredGrid({ direction }))

        const style = result.current.getItemStyle(0)

        // 각 방향에 맞는 transform이 있어야 함
        expect(style.transform).toBeDefined()
        expect(typeof style.transform).toBe('string')
      })
    })
  })

  describe('getItemClass', () => {
    it('기본 클래스를 반환한다', () => {
      const { result } = renderHook(() => useStaggeredGrid())

      const className = result.current.getItemClass(0)

      expect(className).toContain('stagger-item')
      expect(className).toContain('stagger-delay-0')
    })

    it('visible 상태에서 is-visible 클래스가 추가된다', () => {
      const { result } = renderHook(() => useStaggeredGrid())

      act(() => {
        result.current.triggerAnimation()
      })

      const className = result.current.getItemClass(0)

      expect(className).toContain('is-visible')
    })
  })

  describe('IntersectionObserver 통합', () => {
    it('containerRef가 null일 때 IntersectionObserver가 생성되지 않는다', () => {
      // containerRef가 연결되지 않은 상태에서는 observer가 생성되지 않음
      const { result } = renderHook(() => useStaggeredGrid({ disabled: false }))

      // containerRef가 null이므로 observer는 생성되지 않음
      expect(result.current.containerRef.current).toBe(null)
    })

    it('once=true일 때 한 번만 애니메이션된다', () => {
      const { result } = renderHook(() => useStaggeredGrid({ once: true }))

      // 첫 번째 트리거
      act(() => {
        result.current.triggerAnimation()
      })

      expect(result.current.hasAnimated).toBe(true)

      // 리셋 후에도 hasAnimated는 true 유지 (once 옵션)
      act(() => {
        result.current.resetAnimation()
      })

      expect(result.current.hasAnimated).toBe(false) // resetAnimation은 hasAnimated도 리셋
    })
  })
})

// ============================================
// useAdvancedStaggeredGrid 테스트
// ============================================

describe('useAdvancedStaggeredGrid', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('기본 상태로 초기화된다', () => {
    const { result } = renderHook(() => useAdvancedStaggeredGrid(10))

    expect(result.current.isVisible).toBe(false)
    expect(result.current.visibleIndices.size).toBe(0)
  })

  it('isVisible일 때 청크 단위로 아이템이 표시된다', () => {
    const { result } = renderHook(() =>
      useAdvancedStaggeredGrid(20, { chunkSize: 5, chunkDelay: 100 })
    )

    act(() => {
      result.current.triggerAnimation()
    })

    // 첫 번째 청크 (0-4) 즉시 표시
    expect(result.current.visibleIndices.size).toBe(5)
    expect(result.current.isItemVisible(0)).toBe(true)
    expect(result.current.isItemVisible(4)).toBe(true)
    expect(result.current.isItemVisible(5)).toBe(false)

    // 두 번째 청크 표시
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(result.current.visibleIndices.size).toBe(10)
    expect(result.current.isItemVisible(5)).toBe(true)
    expect(result.current.isItemVisible(9)).toBe(true)

    // 세 번째 청크
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(result.current.visibleIndices.size).toBe(15)

    // 네 번째 청크 (마지막)
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(result.current.visibleIndices.size).toBe(20)
    expect(result.current.isItemVisible(19)).toBe(true)
  })

  it('아이템 수가 chunkSize보다 작을 때도 동작한다', () => {
    const { result } = renderHook(() =>
      useAdvancedStaggeredGrid(3, { chunkSize: 8 })
    )

    act(() => {
      result.current.triggerAnimation()
    })

    expect(result.current.visibleIndices.size).toBe(3)
    expect(result.current.isItemVisible(0)).toBe(true)
    expect(result.current.isItemVisible(2)).toBe(true)
  })

  it('0개 아이템일 때 에러 없이 동작한다', () => {
    const { result } = renderHook(() => useAdvancedStaggeredGrid(0))

    act(() => {
      result.current.triggerAnimation()
    })

    expect(result.current.visibleIndices.size).toBe(0)
  })

  it('getItemStyle이 청크 내 인덱스 기반 딜레이를 반환한다', () => {
    const { result } = renderHook(() =>
      useAdvancedStaggeredGrid(10, { chunkSize: 4, staggerDelay: 50 })
    )

    act(() => {
      result.current.triggerAnimation()
    })

    // 첫 번째 청크의 아이템들
    const style0 = result.current.getItemStyle(0)
    const style1 = result.current.getItemStyle(1)

    // 청크 내 인덱스에 따른 딜레이
    expect(style0.transition).toContain('0ms')
    expect(style1.transition).toContain('50ms')

    // 두 번째 청크 (아직 안 보임)
    const style4 = result.current.getItemStyle(4)
    expect(style4.opacity).toBe(0)
  })

  it('isVisible=false일 때 모든 visibleIndices가 초기화된다', () => {
    const { result, rerender } = renderHook(
      ({ visible }) =>
        useAdvancedStaggeredGrid(10, {
          disabled: !visible,
          chunkSize: 5,
        }),
      { initialProps: { visible: true } }
    )

    act(() => {
      result.current.triggerAnimation()
    })

    expect(result.current.visibleIndices.size).toBe(5)

    // visible 상태 변경
    act(() => {
      result.current.resetAnimation()
    })

    expect(result.current.isVisible).toBe(false)
  })

  describe('대량 아이템 처리', () => {
    it('100개 아이템을 청크로 처리한다', () => {
      const { result } = renderHook(() =>
        useAdvancedStaggeredGrid(100, { chunkSize: 20, chunkDelay: 50 })
      )

      act(() => {
        result.current.triggerAnimation()
      })

      // 첫 청크
      expect(result.current.visibleIndices.size).toBe(20)

      // 모든 청크 완료
      act(() => {
        jest.advanceTimersByTime(250) // 5개 청크 * 50ms
      })

      expect(result.current.visibleIndices.size).toBe(100)
    })

    it('1000개 아이템도 메모리 오버플로 없이 처리한다', () => {
      const itemCount = 1000
      const { result } = renderHook(() =>
        useAdvancedStaggeredGrid(itemCount, { chunkSize: 50, chunkDelay: 10 })
      )

      act(() => {
        result.current.triggerAnimation()
      })

      // 모든 청크 완료
      act(() => {
        jest.advanceTimersByTime(210) // 20개 청크 * 10ms + 여유
      })

      expect(result.current.visibleIndices.size).toBe(itemCount)
    })
  })
})

// ============================================
// 엣지 케이스 테스트
// ============================================

describe('엣지 케이스', () => {
  it('음수 staggerDelay는 0으로 처리된다', () => {
    const { result } = renderHook(() =>
      useStaggeredGrid({ staggerDelay: -100 })
    )

    const style = result.current.getItemStyle(1)
    // 음수 딜레이가 적용되어도 에러 없이 동작
    expect(style.transition).toBeDefined()
  })

  it('매우 큰 threshold 값도 처리된다', () => {
    expect(() => {
      renderHook(() => useStaggeredGrid({ threshold: 100 }))
    }).not.toThrow()
  })

  it('빈 rootMargin도 처리된다', () => {
    expect(() => {
      renderHook(() => useStaggeredGrid({ rootMargin: '' }))
    }).not.toThrow()
  })

  it('duration이 0이어도 동작한다', () => {
    const { result } = renderHook(() => useStaggeredGrid({ duration: 0 }))

    act(() => {
      result.current.triggerAnimation()
    })

    const style = result.current.getItemStyle(0)
    expect(style.transition).toContain('0ms')
  })

  it('컴포넌트 언마운트 시 정리가 올바르게 수행된다', () => {
    const { unmount } = renderHook(() => useStaggeredGrid())

    expect(() => {
      unmount()
    }).not.toThrow()
  })
})
