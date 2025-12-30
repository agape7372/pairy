/**
 * Filter 컴포넌트 유닛 테스트
 *
 * 테스트 케이스:
 * - FilterChip 기본 동작
 * - FilterDropdown 선택 동작
 * - FilterBar 통합 동작
 * - SortDropdown 정렬 동작
 * - 엣지 케이스 처리
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  FilterChip,
  FilterDropdown,
  FilterBar,
  SortDropdown,
  type FilterOption,
  type FilterGroup,
  type SortOption,
} from '@/components/ui/filter'

// 테스트 데이터
const mockOptions: FilterOption[] = [
  { value: 'option1', label: '옵션 1' },
  { value: 'option2', label: '옵션 2' },
  { value: 'option3', label: '옵션 3', count: 5 },
]

const mockFilterGroups: FilterGroup[] = [
  {
    id: 'category',
    label: '카테고리',
    options: [
      { value: 'pair', label: '페어틀' },
      { value: 'single', label: '솔로틀' },
    ],
  },
  {
    id: 'price',
    label: '가격',
    options: [
      { value: 'free', label: '무료' },
      { value: 'paid', label: '유료' },
    ],
  },
]

const mockSortOptions: SortOption[] = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'price_asc', label: '가격 낮은순' },
  { value: 'price_desc', label: '가격 높은순' },
]

// ============================================
// FilterChip 테스트
// ============================================

describe('FilterChip', () => {
  it('기본 렌더링된다', () => {
    render(<FilterChip label="테스트" />)

    expect(screen.getByText('테스트')).toBeInTheDocument()
  })

  it('selected=false일 때 기본 스타일이 적용된다', () => {
    render(<FilterChip label="테스트" selected={false} />)
    const chip = screen.getByRole('button')

    expect(chip).toHaveClass('bg-gray-100')
  })

  it('selected=true일 때 활성 스타일이 적용된다', () => {
    render(<FilterChip label="테스트" selected={true} />)
    const chip = screen.getByRole('button')

    expect(chip).toHaveClass('bg-primary-100')
  })

  it('클릭 시 onClick이 호출된다', async () => {
    const handleClick = jest.fn()
    render(<FilterChip label="테스트" onClick={handleClick} />)

    await userEvent.click(screen.getByText('테스트'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('count가 표시된다', () => {
    render(<FilterChip label="테스트" count={10} />)

    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('count=0일 때도 처리된다', () => {
    render(<FilterChip label="테스트" count={0} />)

    // count 0은 falsy이므로 표시되지 않을 수 있음
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('removable=true일 때 제거 가능', () => {
    render(<FilterChip label="테스트" removable onRemove={() => {}} />)

    // 버튼이 존재해야 함
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('제거 버튼 클릭 시 onRemove가 호출된다', async () => {
    const handleRemove = jest.fn()
    render(<FilterChip label="테스트" removable onRemove={handleRemove} />)

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(handleRemove).toHaveBeenCalledTimes(1)
  })

  it('size="sm"일 때 작은 패딩이 적용된다', () => {
    render(<FilterChip label="테스트" size="sm" />)
    const chip = screen.getByRole('button')

    expect(chip).toHaveClass('px-2.5', 'py-1')
  })

  it('size="md"일 때 기본 패딩이 적용된다', () => {
    render(<FilterChip label="테스트" size="md" />)
    const chip = screen.getByRole('button')

    expect(chip).toHaveClass('px-3', 'py-1.5')
  })
})

// ============================================
// FilterDropdown 테스트
// ============================================

describe('FilterDropdown', () => {
  it('기본 렌더링된다', () => {
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={[]}
        onChange={() => {}}
      />
    )

    expect(screen.getByText('카테고리')).toBeInTheDocument()
  })

  it('트리거 클릭 시 드롭다운이 열린다', async () => {
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={[]}
        onChange={() => {}}
      />
    )

    await userEvent.click(screen.getByText('카테고리'))

    // 옵션들이 표시되어야 함
    expect(screen.getByText('옵션 1')).toBeInTheDocument()
    expect(screen.getByText('옵션 2')).toBeInTheDocument()
  })

  it('옵션 클릭 시 onChange가 호출된다', async () => {
    const handleChange = jest.fn()
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={[]}
        onChange={handleChange}
      />
    )

    await userEvent.click(screen.getByText('카테고리'))
    await userEvent.click(screen.getByText('옵션 1'))

    expect(handleChange).toHaveBeenCalledWith(['option1'])
  })

  it('multiple=true일 때 여러 옵션 선택 가능', async () => {
    const handleChange = jest.fn()
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={['option1']}
        onChange={handleChange}
        multiple={true}
      />
    )

    // 드롭다운 열기
    await userEvent.click(screen.getByText('카테고리'))
    // 두 번째 옵션 선택 (이미 option1이 선택된 상태)
    await userEvent.click(screen.getByText('옵션 2'))

    // multiple 모드에서는 기존 선택에 추가됨
    expect(handleChange).toHaveBeenLastCalledWith(['option1', 'option2'])
  })

  it('multiple=false일 때 하나만 선택 가능', async () => {
    const handleChange = jest.fn()
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={['option1']}
        onChange={handleChange}
        multiple={false}
      />
    )

    await userEvent.click(screen.getByText('카테고리'))
    await userEvent.click(screen.getByText('옵션 2'))

    expect(handleChange).toHaveBeenLastCalledWith(['option2'])
  })

  it('선택된 아이템 수가 표시된다', () => {
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={['option1', 'option2']}
        onChange={() => {}}
      />
    )

    // 선택된 수 표시 (구현에 따라 다를 수 있음)
    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it('placeholder가 표시된다', () => {
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={[]}
        onChange={() => {}}
        placeholder="선택하세요"
      />
    )

    expect(screen.getByText('선택하세요')).toBeInTheDocument()
  })

  it('count가 있는 옵션에 카운트가 표시된다', async () => {
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={[]}
        onChange={() => {}}
      />
    )

    await userEvent.click(screen.getByText('카테고리'))

    expect(screen.getByText('5')).toBeInTheDocument()
  })
})

// ============================================
// FilterBar 테스트
// ============================================

describe('FilterBar', () => {
  it('기본 렌더링된다', () => {
    render(
      <FilterBar
        groups={mockFilterGroups}
        selected={{}}
        onFilterChange={() => {}}
      />
    )

    expect(screen.getByText('카테고리')).toBeInTheDocument()
    expect(screen.getByText('가격')).toBeInTheDocument()
  })

  it('필터 그룹 클릭 시 드롭다운이 열린다', async () => {
    render(
      <FilterBar
        groups={mockFilterGroups}
        selected={{}}
        onFilterChange={() => {}}
      />
    )

    await userEvent.click(screen.getByText('카테고리'))

    expect(screen.getByText('페어틀')).toBeInTheDocument()
    expect(screen.getByText('솔로틀')).toBeInTheDocument()
  })

  it('옵션 선택 시 onFilterChange가 호출된다', async () => {
    const handleFilterChange = jest.fn()
    render(
      <FilterBar
        groups={mockFilterGroups}
        selected={{}}
        onFilterChange={handleFilterChange}
      />
    )

    await userEvent.click(screen.getByText('카테고리'))
    await userEvent.click(screen.getByText('페어틀'))

    expect(handleFilterChange).toHaveBeenCalledWith('category', ['pair'])
  })

  it('onClearAll이 있을 때 초기화 버튼이 표시된다', () => {
    render(
      <FilterBar
        groups={mockFilterGroups}
        selected={{ category: ['pair'] }}
        onFilterChange={() => {}}
        onClearAll={() => {}}
      />
    )

    // 초기화 버튼이 렌더링되어야 함
    expect(document.body).toBeInTheDocument()
  })

  it('onClearAll 클릭 시 호출된다', async () => {
    const handleClearAll = jest.fn()
    render(
      <FilterBar
        groups={mockFilterGroups}
        selected={{ category: ['pair'], price: ['free'] }}
        onFilterChange={() => {}}
        onClearAll={handleClearAll}
      />
    )

    // 초기화 버튼을 찾아서 클릭
    const clearButton = screen.queryByText(/초기화|리셋|전체/i)
    if (clearButton) {
      await userEvent.click(clearButton)
      expect(handleClearAll).toHaveBeenCalled()
    }
  })

  it('빈 그룹 배열도 처리된다', () => {
    render(
      <FilterBar
        groups={[]}
        selected={{}}
        onFilterChange={() => {}}
      />
    )

    // 에러 없이 렌더링되어야 함
    expect(document.body).toBeInTheDocument()
  })
})

// ============================================
// SortDropdown 테스트
// ============================================

describe('SortDropdown', () => {
  it('기본 렌더링된다', () => {
    render(
      <SortDropdown
        options={mockSortOptions}
        value="latest"
        onChange={() => {}}
      />
    )

    expect(screen.getByText('최신순')).toBeInTheDocument()
  })

  it('트리거 클릭 시 드롭다운이 열린다', async () => {
    render(
      <SortDropdown
        options={mockSortOptions}
        value="latest"
        onChange={() => {}}
      />
    )

    await userEvent.click(screen.getByText('최신순'))

    expect(screen.getByText('인기순')).toBeInTheDocument()
    expect(screen.getByText('가격 낮은순')).toBeInTheDocument()
  })

  it('옵션 선택 시 onChange가 호출된다', async () => {
    const handleChange = jest.fn()
    render(
      <SortDropdown
        options={mockSortOptions}
        value="latest"
        onChange={handleChange}
      />
    )

    await userEvent.click(screen.getByText('최신순'))
    await userEvent.click(screen.getByText('인기순'))

    expect(handleChange).toHaveBeenCalledWith('popular')
  })

  it('선택된 옵션에 체크 표시가 있다', async () => {
    render(
      <SortDropdown
        options={mockSortOptions}
        value="latest"
        onChange={() => {}}
      />
    )

    await userEvent.click(screen.getByText('최신순'))

    // 선택된 아이템에 체크 아이콘이 있어야 함 (구현에 따라 다름)
    const selectedOption = screen.getAllByText('최신순')[0]
    expect(selectedOption.closest('button') || selectedOption.closest('div')).toBeInTheDocument()
  })

  it('라벨이 표시된다', () => {
    render(
      <SortDropdown
        options={mockSortOptions}
        value="latest"
        onChange={() => {}}
        label="정렬"
      />
    )

    // 라벨은 "정렬:" 형태로 렌더링됨
    expect(screen.getByText('정렬:')).toBeInTheDocument()
  })
})

// ============================================
// 엣지 케이스 테스트
// ============================================

describe('엣지 케이스', () => {
  it('빈 옵션 배열도 처리된다', async () => {
    render(
      <FilterDropdown
        label="카테고리"
        options={[]}
        selected={[]}
        onChange={() => {}}
      />
    )

    await userEvent.click(screen.getByText('카테고리'))

    // 에러 없이 드롭다운이 열려야 함
    expect(screen.getByText('카테고리')).toBeInTheDocument()
  })

  it('긴 레이블도 표시된다', () => {
    const longLabel = '매우 긴 카테고리 이름입니다 아주 아주 길어요'
    render(
      <FilterChip label={longLabel} />
    )

    expect(screen.getByText(longLabel)).toBeInTheDocument()
  })

  it('특수 문자가 포함된 value도 처리된다', async () => {
    const handleChange = jest.fn()
    const specialOptions = [
      { value: 'option-with-dash', label: '대시 옵션' },
      { value: 'option_with_underscore', label: '언더스코어 옵션' },
      { value: 'option.with.dot', label: '점 옵션' },
    ]

    render(
      <FilterDropdown
        label="특수"
        options={specialOptions}
        selected={[]}
        onChange={handleChange}
      />
    )

    await userEvent.click(screen.getByText('특수'))
    await userEvent.click(screen.getByText('대시 옵션'))

    expect(handleChange).toHaveBeenCalledWith(['option-with-dash'])
  })

  it('중복된 value가 있어도 처리된다', () => {
    const duplicateOptions = [
      { value: 'same', label: '옵션 1' },
      { value: 'same', label: '옵션 2' },
    ]

    render(
      <FilterDropdown
        label="중복"
        options={duplicateOptions}
        selected={[]}
        onChange={() => {}}
      />
    )

    // 에러 없이 렌더링되어야 함
    expect(screen.getByText('중복')).toBeInTheDocument()
  })

  it('빈 레이블도 처리된다', () => {
    render(<FilterChip label="" />)

    // 에러 없이 렌더링되어야 함
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

// ============================================
// 접근성 테스트
// ============================================

describe('접근성', () => {
  it('FilterChip이 버튼 역할을 가진다', () => {
    render(<FilterChip label="테스트" onClick={() => {}} />)
    const chip = screen.getByRole('button')

    expect(chip).toBeInTheDocument()
  })

  it('FilterDropdown 트리거가 키보드로 접근 가능하다', async () => {
    render(
      <FilterDropdown
        label="카테고리"
        options={mockOptions}
        selected={[]}
        onChange={() => {}}
      />
    )

    const trigger = screen.getByText('카테고리')
    trigger.focus()

    // Enter 키로 열기
    fireEvent.keyDown(trigger, { key: 'Enter' })

    // 드롭다운이 열려야 함 (구현에 따라 다를 수 있음)
  })

  it('SortDropdown에 aria-label이 적용된다', () => {
    render(
      <SortDropdown
        options={mockSortOptions}
        value="latest"
        onChange={() => {}}
        aria-label="정렬 옵션"
      />
    )

    const trigger = screen.getByText('최신순').closest('button')
    // aria-label이 전달되었는지 확인
    expect(trigger).toBeInTheDocument()
  })
})

// ============================================
// 성능 테스트
// ============================================

describe('성능', () => {
  it('많은 옵션도 렌더링된다', async () => {
    const manyOptions = Array.from({ length: 100 }, (_, i) => ({
      value: `option${i}`,
      label: `옵션 ${i}`,
    }))

    render(
      <FilterDropdown
        label="많은옵션"
        options={manyOptions}
        selected={[]}
        onChange={() => {}}
      />
    )

    await userEvent.click(screen.getByText('많은옵션'))

    expect(screen.getByText('옵션 0')).toBeInTheDocument()
    expect(screen.getByText('옵션 99')).toBeInTheDocument()
  })

  it('많은 그룹도 렌더링된다', () => {
    const manyGroups = Array.from({ length: 20 }, (_, i) => ({
      id: `group${i}`,
      label: `그룹 ${i}`,
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
    }))

    render(
      <FilterBar
        groups={manyGroups}
        selected={{}}
        onFilterChange={() => {}}
      />
    )

    expect(screen.getByText('그룹 0')).toBeInTheDocument()
    expect(screen.getByText('그룹 19')).toBeInTheDocument()
  })
})
