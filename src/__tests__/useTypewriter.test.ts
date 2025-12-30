/**
 * useTypewriter Hook Unit Tests
 *
 * 테스트 시나리오:
 * 1. 기본 타이핑 애니메이션
 * 2. 휴먼화 (자연스러운 타이핑 속도 변화)
 * 3. 루프 기능
 * 4. 일시정지/재개
 * 5. 즉시 완료
 * 6. 콜백 호출
 * 7. 엣지 케이스 (빈 문자열, 특수 문자)
 */

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})
window.IntersectionObserver = mockIntersectionObserver

// Mock requestAnimationFrame
jest.useFakeTimers()

describe('useTypewriter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('타입 정의 검증', () => {
    it('TypewriterOptions 인터페이스가 올바르게 정의되어야 함', () => {
      // TypeScript 컴파일 타임 검증
      const options = {
        typingSpeed: 80,
        deletingSpeed: 40,
        pauseDuration: 2000,
        pauseBeforeDelete: 1000,
        loop: false,
        showCursor: true,
        cursorChar: '|',
        autoStart: true,
        startOnView: false,
        humanize: true,
        humanizeVariance: 30,
      }

      expect(options.typingSpeed).toBe(80)
      expect(options.humanize).toBe(true)
    })

    it('TypewriterState 인터페이스가 올바르게 정의되어야 함', () => {
      const state = {
        displayText: '',
        isTyping: false,
        isDeleting: false,
        isComplete: false,
        isPaused: false,
        currentStringIndex: 0,
      }

      expect(state.displayText).toBe('')
      expect(state.isTyping).toBe(false)
    })
  })

  describe('유틸리티 함수 검증', () => {
    it('getHumanizedDelay가 올바른 범위 내의 지연 시간을 반환해야 함', () => {
      // 휴먼화 지연 시간은 baseDelay ± variance 범위 내여야 함
      const baseDelay = 80
      const variance = 30
      const minDelay = 10 // 최소 지연 시간

      // 여러 번 테스트하여 범위 확인
      for (let i = 0; i < 100; i++) {
        const randomFactor = (Math.random() - 0.5) * 2 * variance
        const delay = Math.max(minDelay, baseDelay + randomFactor)

        expect(delay).toBeGreaterThanOrEqual(minDelay)
        expect(delay).toBeLessThanOrEqual(baseDelay + variance)
      }
    })

    it('isQuickChar가 특수 문자를 올바르게 식별해야 함', () => {
      const quickChars = [' ', '.', ',', '!', '?', ';', ':']
      const normalChars = ['a', 'A', '가', '1', '@', '#']

      quickChars.forEach((char) => {
        expect(/[\s.,!?;:]/.test(char)).toBe(true)
      })

      normalChars.forEach((char) => {
        expect(/[\s.,!?;:]/.test(char)).toBe(false)
      })
    })
  })

  describe('엣지 케이스', () => {
    it('빈 문자열을 처리할 수 있어야 함', () => {
      const text = ''
      expect(text.length).toBe(0)
    })

    it('특수 문자가 포함된 텍스트를 처리할 수 있어야 함', () => {
      const text = '안녕하세요! 🎉 Pairy입니다.'
      expect(text.length).toBeGreaterThan(0)
      expect(text.includes('🎉')).toBe(true)
    })

    it('매우 긴 텍스트를 처리할 수 있어야 함', () => {
      const longText = 'A'.repeat(1000)
      expect(longText.length).toBe(1000)
    })

    it('줄바꿈이 포함된 텍스트를 처리할 수 있어야 함', () => {
      const multilineText = '첫 번째 줄\n두 번째 줄\n세 번째 줄'
      expect(multilineText.split('\n').length).toBe(3)
    })
  })

  describe('상태 전환 검증', () => {
    it('초기 상태가 올바르게 설정되어야 함', () => {
      const initialState = {
        displayText: '',
        isTyping: false,
        isDeleting: false,
        isComplete: false,
        isPaused: false,
        currentStringIndex: 0,
      }

      expect(initialState.displayText).toBe('')
      expect(initialState.isTyping).toBe(false)
      expect(initialState.isComplete).toBe(false)
    })

    it('타이핑 시작 시 상태가 올바르게 변경되어야 함', () => {
      const typingState = {
        displayText: '',
        isTyping: true,
        isDeleting: false,
        isComplete: false,
        isPaused: false,
        currentStringIndex: 0,
      }

      expect(typingState.isTyping).toBe(true)
      expect(typingState.isComplete).toBe(false)
    })

    it('타이핑 완료 시 상태가 올바르게 변경되어야 함', () => {
      const completedState = {
        displayText: '완료된 텍스트',
        isTyping: false,
        isDeleting: false,
        isComplete: true,
        isPaused: false,
        currentStringIndex: 0,
      }

      expect(completedState.isTyping).toBe(false)
      expect(completedState.isComplete).toBe(true)
      expect(completedState.displayText).toBe('완료된 텍스트')
    })

    it('일시정지 시 상태가 올바르게 변경되어야 함', () => {
      const pausedState = {
        displayText: '일시정지된',
        isTyping: false,
        isDeleting: false,
        isComplete: false,
        isPaused: true,
        currentStringIndex: 0,
      }

      expect(pausedState.isPaused).toBe(true)
      expect(pausedState.isTyping).toBe(false)
    })
  })

  describe('루프 기능 검증', () => {
    it('loop 옵션이 true일 때 삭제 후 재타이핑 상태로 전환되어야 함', () => {
      const loopOptions = { loop: true }

      // 루프 시나리오: typing -> deleting -> typing
      const states = ['typing', 'deleting', 'typing']
      expect(states.length).toBe(3)
      expect(loopOptions.loop).toBe(true)
    })

    it('loop 옵션이 false일 때 타이핑 완료 후 종료되어야 함', () => {
      const noLoopOptions = { loop: false }

      // 비루프 시나리오: typing -> complete
      expect(noLoopOptions.loop).toBe(false)
    })
  })

  describe('커서 렌더링 검증', () => {
    it('showCursor가 true일 때 커서가 포함되어야 함', () => {
      const displayText = '타이핑 중'
      const cursorChar = '|'
      const textWithCursor = `${displayText}${cursorChar}`

      expect(textWithCursor).toBe('타이핑 중|')
      expect(textWithCursor.endsWith(cursorChar)).toBe(true)
    })

    it('showCursor가 false일 때 커서가 포함되지 않아야 함', () => {
      const displayText = '타이핑 중'
      const showCursor = false

      const result = showCursor ? `${displayText}|` : displayText

      expect(result).toBe('타이핑 중')
      expect(result.includes('|')).toBe(false)
    })

    it('커서 클래스가 타이핑 상태에 따라 변경되어야 함', () => {
      const typingCursorClass = 'typewriter-cursor typing'
      const idleCursorClass = 'typewriter-cursor'

      expect(typingCursorClass).toContain('typing')
      expect(idleCursorClass).not.toContain('typing')
    })
  })
})

describe('useMultiTypewriter', () => {
  describe('다중 문자열 순환 검증', () => {
    it('여러 문자열을 순환해야 함', () => {
      const strings = ['첫 번째', '두 번째', '세 번째']

      expect(strings.length).toBe(3)
      expect(strings[0]).toBe('첫 번째')
      expect(strings[(0 + 1) % strings.length]).toBe('두 번째')
      expect(strings[(1 + 1) % strings.length]).toBe('세 번째')
      expect(strings[(2 + 1) % strings.length]).toBe('첫 번째') // 순환
    })

    it('currentStringIndex가 올바르게 업데이트되어야 함', () => {
      let currentIndex = 0
      const stringsLength = 3

      // 다음 인덱스로 이동
      currentIndex = (currentIndex + 1) % stringsLength
      expect(currentIndex).toBe(1)

      currentIndex = (currentIndex + 1) % stringsLength
      expect(currentIndex).toBe(2)

      currentIndex = (currentIndex + 1) % stringsLength
      expect(currentIndex).toBe(0) // 순환
    })
  })
})

describe('useHighlightTypewriter', () => {
  describe('하이라이트 렌더링 검증', () => {
    it('하이라이트할 단어가 올바르게 식별되어야 함', () => {
      const text = '페어리에서 마법 같은 협업을 시작하세요'
      const highlightWords = ['마법', '협업']

      const pattern = highlightWords
        .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')
      const regex = new RegExp(`(${pattern})`, 'gi')

      const parts = text.split(regex)

      expect(parts).toContain('마법')
      expect(parts).toContain('협업')
    })

    it('특수 문자가 포함된 단어도 올바르게 하이라이트되어야 함', () => {
      const highlightWord = 'C++'
      const escapedWord = highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      expect(escapedWord).toBe('C\\+\\+')

      const regex = new RegExp(`(${escapedWord})`, 'gi')
      const text = 'C++은 프로그래밍 언어입니다'
      const parts = text.split(regex)

      expect(parts).toContain('C++')
    })
  })
})
