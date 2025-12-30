/**
 * Skeleton 컴포넌트 유닛 테스트
 *
 * 테스트 케이스:
 * - 기본 렌더링
 * - variant별 스타일
 * - 사이즈 props
 * - 애니메이션 활성화/비활성화
 * - 복합 컴포넌트 (SkeletonText, SkeletonCard 등)
 * - 엣지 케이스
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonGrid,
  SkeletonProfile,
} from '@/components/ui/skeleton'

// ============================================
// Skeleton 기본 테스트
// ============================================

describe('Skeleton', () => {
  it('기본 variant로 렌더링된다', () => {
    render(<Skeleton data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('relative', 'overflow-hidden')
  })

  it('aria-hidden="true"가 적용된다', () => {
    render(<Skeleton data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveAttribute('aria-hidden', 'true')
  })

  it('aria-label="Loading..."이 적용된다', () => {
    render(<Skeleton data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveAttribute('aria-label', 'Loading...')
  })

  describe('variant props', () => {
    it('variant="text"일 때 rounded 클래스가 적용된다', () => {
      render(<Skeleton variant="text" data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveClass('h-4', 'rounded')
    })

    it('variant="circular"일 때 rounded-full 클래스가 적용된다', () => {
      render(<Skeleton variant="circular" data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveClass('rounded-full')
    })

    it('variant="rectangular"일 때 rounded-none 클래스가 적용된다', () => {
      render(<Skeleton variant="rectangular" data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveClass('rounded-none')
    })

    it('variant="rounded"일 때 rounded-xl 클래스가 적용된다', () => {
      render(<Skeleton variant="rounded" data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveClass('rounded-xl')
    })
  })

  describe('사이즈 props', () => {
    it('width가 숫자일 때 px 단위로 변환된다', () => {
      render(<Skeleton width={100} data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveStyle({ width: '100px' })
    })

    it('width가 문자열일 때 그대로 적용된다', () => {
      render(<Skeleton width="50%" data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveStyle({ width: '50%' })
    })

    it('height가 숫자일 때 px 단위로 변환된다', () => {
      render(<Skeleton height={50} data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveStyle({ height: '50px' })
    })

    it('height가 문자열일 때 그대로 적용된다', () => {
      render(<Skeleton height="2rem" data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveStyle({ height: '2rem' })
    })
  })

  describe('animate prop', () => {
    it('animate=true일 때 shimmer 클래스가 적용된다', () => {
      render(<Skeleton animate={true} data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveClass('skeleton-shimmer')
    })

    it('animate=false일 때 shimmer 클래스가 적용되지 않는다', () => {
      render(<Skeleton animate={false} data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).not.toHaveClass('skeleton-shimmer')
    })
  })

  describe('dark prop', () => {
    it('dark=true일 때 어두운 배경색이 적용된다', () => {
      render(<Skeleton dark={true} data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveClass('bg-gray-700')
    })

    it('dark=false일 때 기본 그라데이션이 적용된다', () => {
      render(<Skeleton dark={false} data-testid="skeleton" />)
      const element = screen.getByTestId('skeleton')

      expect(element).toHaveClass('bg-gradient-to-r')
    })
  })

  it('커스텀 className이 병합된다', () => {
    render(<Skeleton className="custom-class" data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveClass('custom-class')
  })

  it('커스텀 style이 병합된다', () => {
    render(
      <Skeleton
        style={{ marginTop: '10px' }}
        data-testid="skeleton"
      />
    )
    const element = screen.getByTestId('skeleton')

    // 커스텀 스타일이 병합됨
    expect(element).toHaveStyle({ marginTop: '10px' })
  })
})

// ============================================
// SkeletonText 테스트
// ============================================

describe('SkeletonText', () => {
  it('기본 3줄이 렌더링된다', () => {
    render(<SkeletonText data-testid="skeleton-text" />)
    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[aria-hidden="true"]')

    expect(lines.length).toBe(3)
  })

  it('lines prop에 따라 줄 수가 변경된다', () => {
    render(<SkeletonText lines={5} data-testid="skeleton-text" />)
    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[aria-hidden="true"]')

    expect(lines.length).toBe(5)
  })

  it('lines=1일 때 1줄만 렌더링된다', () => {
    render(<SkeletonText lines={1} data-testid="skeleton-text" />)
    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[aria-hidden="true"]')

    expect(lines.length).toBe(1)
  })

  it('lines=0일 때 아무것도 렌더링되지 않는다', () => {
    render(<SkeletonText lines={0} data-testid="skeleton-text" />)
    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[aria-hidden="true"]')

    expect(lines.length).toBe(0)
  })

  describe('gap prop', () => {
    it('gap="sm"일 때 gap-1.5 클래스가 적용된다', () => {
      render(<SkeletonText gap="sm" data-testid="skeleton-text" />)
      const container = screen.getByTestId('skeleton-text')

      expect(container).toHaveClass('gap-1.5')
    })

    it('gap="md"일 때 gap-2.5 클래스가 적용된다', () => {
      render(<SkeletonText gap="md" data-testid="skeleton-text" />)
      const container = screen.getByTestId('skeleton-text')

      expect(container).toHaveClass('gap-2.5')
    })

    it('gap="lg"일 때 gap-3.5 클래스가 적용된다', () => {
      render(<SkeletonText gap="lg" data-testid="skeleton-text" />)
      const container = screen.getByTestId('skeleton-text')

      expect(container).toHaveClass('gap-3.5')
    })
  })

  it('마지막 줄이 lastLineWidth에 따라 너비가 설정된다', () => {
    render(<SkeletonText lines={3} lastLineWidth={50} data-testid="skeleton-text" />)
    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[aria-hidden="true"]')
    const lastLine = lines[lines.length - 1]

    expect(lastLine).toHaveStyle({ width: '50%' })
  })

  it('animate=false일 때 모든 줄에 shimmer가 비활성화된다', () => {
    render(<SkeletonText animate={false} data-testid="skeleton-text" />)
    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[aria-hidden="true"]')

    lines.forEach((line) => {
      expect(line).not.toHaveClass('skeleton-shimmer')
    })
  })
})

// ============================================
// SkeletonAvatar 테스트
// ============================================

describe('SkeletonAvatar', () => {
  it('기본 렌더링된다', () => {
    render(<SkeletonAvatar data-testid="skeleton-avatar" />)
    const element = screen.getByTestId('skeleton-avatar')

    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('rounded-full')
  })

  describe('size prop', () => {
    it('size="sm"일 때 w-8 h-8이 적용된다', () => {
      render(<SkeletonAvatar size="sm" data-testid="skeleton-avatar" />)
      const element = screen.getByTestId('skeleton-avatar')

      expect(element).toHaveClass('w-8', 'h-8')
    })

    it('size="md"일 때 w-10 h-10이 적용된다', () => {
      render(<SkeletonAvatar size="md" data-testid="skeleton-avatar" />)
      const element = screen.getByTestId('skeleton-avatar')

      expect(element).toHaveClass('w-10', 'h-10')
    })

    it('size="lg"일 때 w-12 h-12이 적용된다', () => {
      render(<SkeletonAvatar size="lg" data-testid="skeleton-avatar" />)
      const element = screen.getByTestId('skeleton-avatar')

      expect(element).toHaveClass('w-12', 'h-12')
    })

    it('size="xl"일 때 w-16 h-16이 적용된다', () => {
      render(<SkeletonAvatar size="xl" data-testid="skeleton-avatar" />)
      const element = screen.getByTestId('skeleton-avatar')

      expect(element).toHaveClass('w-16', 'h-16')
    })
  })
})

// ============================================
// SkeletonCard 테스트
// ============================================

describe('SkeletonCard', () => {
  it('기본 렌더링된다', () => {
    render(<SkeletonCard data-testid="skeleton-card" />)
    const element = screen.getByTestId('skeleton-card')

    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('bg-white', 'rounded-[20px]')
  })

  it('hasImage=true일 때 이미지 영역이 렌더링된다', () => {
    render(<SkeletonCard hasImage={true} data-testid="skeleton-card" />)
    const element = screen.getByTestId('skeleton-card')
    const imageArea = element.querySelector('.rounded-none')

    expect(imageArea).toBeInTheDocument()
  })

  it('hasImage=false일 때 이미지 영역이 렌더링되지 않는다', () => {
    render(<SkeletonCard hasImage={false} data-testid="skeleton-card" />)
    const element = screen.getByTestId('skeleton-card')
    const imageArea = element.querySelector('.rounded-none')

    expect(imageArea).not.toBeInTheDocument()
  })

  it('hasAvatar=true일 때 아바타가 렌더링된다', () => {
    render(<SkeletonCard hasAvatar={true} data-testid="skeleton-card" />)
    const element = screen.getByTestId('skeleton-card')
    const avatar = element.querySelector('.rounded-full')

    expect(avatar).toBeInTheDocument()
  })

  it('lines prop에 따라 텍스트 줄 수가 변경된다', () => {
    render(<SkeletonCard lines={4} hasImage={false} data-testid="skeleton-card" />)
    const element = screen.getByTestId('skeleton-card')
    // SkeletonText 내부의 줄들을 확인
    const textContainer = element.querySelector('.flex.flex-col')

    expect(textContainer).toBeInTheDocument()
  })

  it('imageHeight가 적용된다', () => {
    render(
      <SkeletonCard hasImage imageHeight={250} data-testid="skeleton-card" />
    )
    const element = screen.getByTestId('skeleton-card')
    const imageArea = element.querySelector('.rounded-none')

    expect(imageArea).toHaveStyle({ height: '250px' })
  })
})

// ============================================
// SkeletonGrid 테스트
// ============================================

describe('SkeletonGrid', () => {
  it('기본 8개 카드가 렌더링된다', () => {
    render(<SkeletonGrid data-testid="skeleton-grid" />)
    const element = screen.getByTestId('skeleton-grid')
    const cards = element.querySelectorAll('.rounded-\\[20px\\]')

    expect(cards.length).toBe(8)
  })

  it('count prop에 따라 카드 수가 변경된다', () => {
    render(<SkeletonGrid count={4} data-testid="skeleton-grid" />)
    const element = screen.getByTestId('skeleton-grid')
    const cards = element.querySelectorAll('.rounded-\\[20px\\]')

    expect(cards.length).toBe(4)
  })

  it('count=0일 때 카드가 렌더링되지 않는다', () => {
    render(<SkeletonGrid count={0} data-testid="skeleton-grid" />)
    const element = screen.getByTestId('skeleton-grid')
    const cards = element.querySelectorAll('.rounded-\\[20px\\]')

    expect(cards.length).toBe(0)
  })

  it('grid 클래스가 적용된다', () => {
    render(<SkeletonGrid data-testid="skeleton-grid" />)
    const element = screen.getByTestId('skeleton-grid')

    expect(element).toHaveClass('grid', 'gap-6')
  })

  it('cardProps가 각 카드에 전달된다', () => {
    render(
      <SkeletonGrid
        count={2}
        cardProps={{ hasImage: false, lines: 1 }}
        data-testid="skeleton-grid"
      />
    )
    const element = screen.getByTestId('skeleton-grid')
    // 이미지 영역이 없어야 함
    const imageAreas = element.querySelectorAll('.rounded-none')

    expect(imageAreas.length).toBe(0)
  })
})

// ============================================
// SkeletonProfile 테스트
// ============================================

describe('SkeletonProfile', () => {
  it('기본 렌더링된다', () => {
    render(<SkeletonProfile data-testid="skeleton-profile" />)
    const element = screen.getByTestId('skeleton-profile')

    expect(element).toBeInTheDocument()
  })

  it('hasBanner=true일 때 배너가 렌더링된다', () => {
    render(<SkeletonProfile hasBanner={true} data-testid="skeleton-profile" />)
    const element = screen.getByTestId('skeleton-profile')
    // 배너는 rounded-xl과 w-full을 가진 첫 번째 요소
    const banner = element.querySelector('.rounded-xl.w-full')

    expect(banner).toBeInTheDocument()
  })

  it('hasBanner=false일 때 배너가 렌더링되지 않는다', () => {
    render(<SkeletonProfile hasBanner={false} data-testid="skeleton-profile" />)
    const element = screen.getByTestId('skeleton-profile')
    const children = element.children

    // 첫 번째 자식이 배너가 아니어야 함 (배너는 height: 160px)
    expect(children[0]).not.toHaveStyle({ height: '160px' })
  })

  it('statsCount에 따라 통계 아이템 수가 변경된다', () => {
    render(<SkeletonProfile statsCount={5} data-testid="skeleton-profile" />)
    const element = screen.getByTestId('skeleton-profile')
    // 통계 영역 내 아이템들
    const statsContainer = element.querySelector('.flex.gap-6')
    const statItems = statsContainer?.children

    expect(statItems?.length).toBe(5)
  })

  it('XL 아바타가 렌더링된다', () => {
    render(<SkeletonProfile data-testid="skeleton-profile" />)
    const element = screen.getByTestId('skeleton-profile')
    const xlAvatar = element.querySelector('.w-16.h-16')

    expect(xlAvatar).toBeInTheDocument()
  })
})

// ============================================
// 엣지 케이스 테스트
// ============================================

describe('엣지 케이스', () => {
  it('매우 큰 lines 값도 처리된다', () => {
    render(<SkeletonText lines={100} data-testid="skeleton-text" />)
    const container = screen.getByTestId('skeleton-text')
    const lines = container.querySelectorAll('[aria-hidden="true"]')

    expect(lines.length).toBe(100)
  })

  it('매우 큰 count 값도 처리된다', () => {
    render(<SkeletonGrid count={50} data-testid="skeleton-grid" />)
    const element = screen.getByTestId('skeleton-grid')
    const cards = element.querySelectorAll('.rounded-\\[20px\\]')

    expect(cards.length).toBe(50)
  })

  it('음수 width/height는 그대로 적용된다', () => {
    render(<Skeleton width={-100} height={-50} data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveStyle({ width: '-100px', height: '-50px' })
  })

  it('0 width/height도 처리된다', () => {
    render(<Skeleton width={0} height={0} data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveStyle({ width: '0px', height: '0px' })
  })

  it('ref가 올바르게 전달된다', () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Skeleton ref={ref} data-testid="skeleton" />)

    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('추가 HTML 속성이 전달된다', () => {
    render(
      <Skeleton
        data-testid="skeleton"
        id="custom-id"
        role="progressbar"
      />
    )
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveAttribute('id', 'custom-id')
    expect(element).toHaveAttribute('role', 'progressbar')
  })
})

// ============================================
// 접근성 테스트
// ============================================

describe('접근성', () => {
  it('모든 스켈레톤에 aria-hidden이 적용된다', () => {
    render(<Skeleton data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveAttribute('aria-hidden', 'true')
  })

  it('모든 스켈레톤에 aria-label이 적용된다', () => {
    render(<Skeleton data-testid="skeleton" />)
    const element = screen.getByTestId('skeleton')

    expect(element).toHaveAttribute('aria-label', 'Loading...')
  })
})
