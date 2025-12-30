'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

/**
 * Typewriter Animation Hook
 *
 * UX 서사: "한 글자 한 글자, 이야기가 피어나는 순간"
 *
 * 사용 사례:
 * - 히어로 섹션의 타이틀 타이핑 효과
 * - 챗봇 메시지 출력
 * - 코드 에디터 스타일 텍스트 표시
 * - 인터랙티브 스토리텔링
 */

// ============================================
// TYPES
// ============================================

export interface TypewriterOptions {
  /** 타이핑 속도 (ms per character) */
  typingSpeed?: number
  /** 지우기 속도 (ms per character) */
  deletingSpeed?: number
  /** 타이핑 완료 후 대기 시간 (ms) */
  pauseDuration?: number
  /** 지우기 시작 전 대기 시간 (ms) */
  pauseBeforeDelete?: number
  /** 루프 여부 */
  loop?: boolean
  /** 커서 깜빡임 */
  showCursor?: boolean
  /** 커서 문자 */
  cursorChar?: string
  /** 시작 시 자동 실행 */
  autoStart?: boolean
  /** 화면에 보일 때 시작 */
  startOnView?: boolean
  /** 완료 콜백 */
  onComplete?: () => void
  /** 타이핑 시작 콜백 */
  onStart?: () => void
  /** 글자 타이핑 콜백 */
  onType?: (char: string, index: number) => void
  /** 랜덤 타이핑 속도 변화 (자연스러운 느낌) */
  humanize?: boolean
  /** 휴먼화 변동폭 (ms) */
  humanizeVariance?: number
}

export interface TypewriterState {
  /** 현재 표시되는 텍스트 */
  displayText: string
  /** 타이핑 중인지 */
  isTyping: boolean
  /** 지우는 중인지 */
  isDeleting: boolean
  /** 완료되었는지 */
  isComplete: boolean
  /** 일시정지 중인지 */
  isPaused: boolean
  /** 현재 문자열 인덱스 (여러 문자열 사용 시) */
  currentStringIndex: number
}

export interface TypewriterReturn extends TypewriterState {
  /** 컨테이너 ref (startOnView용) */
  ref: React.RefObject<HTMLElement | null>
  /** 수동 시작 */
  start: () => void
  /** 일시정지 */
  pause: () => void
  /** 재개 */
  resume: () => void
  /** 리셋 */
  reset: () => void
  /** 즉시 완료 (전체 텍스트 표시) */
  complete: () => void
  /** 커서 스타일 (CSS 클래스용) */
  cursorClass: string
  /** 표시 텍스트 + 커서 */
  textWithCursor: string
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/** 랜덤 지연 시간 생성 (휴먼화) */
function getHumanizedDelay(baseDelay: number, variance: number): number {
  const randomFactor = (Math.random() - 0.5) * 2 * variance
  return Math.max(10, baseDelay + randomFactor)
}

/** 특수 문자인지 확인 (빠르게 타이핑) */
function isQuickChar(char: string): boolean {
  return /[\s.,!?;:]/.test(char)
}

// ============================================
// SINGLE STRING TYPEWRITER
// ============================================

/**
 * 단일 문자열 타이프라이터 훅
 *
 * @example
 * ```tsx
 * const { displayText, isTyping, textWithCursor } = useTypewriter(
 *   '안녕하세요, Pairy입니다!',
 *   { typingSpeed: 80, showCursor: true }
 * )
 *
 * return <h1>{textWithCursor}</h1>
 * ```
 */
export function useTypewriter(
  text: string,
  options: TypewriterOptions = {}
): TypewriterReturn {
  const {
    typingSpeed = 80,
    deletingSpeed = 40,
    pauseDuration = 2000,
    pauseBeforeDelete = 1000,
    loop = false,
    showCursor = true,
    cursorChar = '|',
    autoStart = true,
    startOnView = false,
    onComplete,
    onStart,
    onType,
    humanize = true,
    humanizeVariance = 30,
  } = options

  const ref = useRef<HTMLElement>(null)
  const [state, setState] = useState<TypewriterState>({
    displayText: '',
    isTyping: false,
    isDeleting: false,
    isComplete: false,
    isPaused: false,
    currentStringIndex: 0,
  })

  const animationRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const charIndexRef = useRef(0)
  const hasStartedRef = useRef(false)
  const isVisibleRef = useRef(!startOnView)

  // 상태 업데이트 헬퍼 (안전한 업데이트)
  const updateState = useCallback((updates: Partial<TypewriterState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // 클린업 함수
  const cleanup = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // 리셋
  const reset = useCallback(() => {
    cleanup()
    charIndexRef.current = 0
    hasStartedRef.current = false
    setState({
      displayText: '',
      isTyping: false,
      isDeleting: false,
      isComplete: false,
      isPaused: false,
      currentStringIndex: 0,
    })
  }, [cleanup])

  // 즉시 완료
  const complete = useCallback(() => {
    cleanup()
    charIndexRef.current = text.length
    setState({
      displayText: text,
      isTyping: false,
      isDeleting: false,
      isComplete: true,
      isPaused: false,
      currentStringIndex: 0,
    })
    onComplete?.()
  }, [cleanup, text, onComplete])

  // 일시정지
  const pause = useCallback(() => {
    cleanup()
    updateState({ isPaused: true, isTyping: false, isDeleting: false })
  }, [cleanup, updateState])

  // 함수 참조 (순환 참조 방지)
  const typeCharRef = useRef<() => void>(() => {})
  const deleteCharRef = useRef<() => void>(() => {})

  // 타이핑 로직
  const typeChar = useCallback(() => {
    if (charIndexRef.current >= text.length) {
      updateState({ isTyping: false, isComplete: !loop })

      if (loop) {
        timeoutRef.current = setTimeout(() => {
          updateState({ isDeleting: true })
          deleteCharRef.current()
        }, pauseBeforeDelete)
      } else {
        onComplete?.()
      }
      return
    }

    const currentChar = text[charIndexRef.current]
    charIndexRef.current++
    const newText = text.slice(0, charIndexRef.current)

    updateState({ displayText: newText })
    onType?.(currentChar, charIndexRef.current - 1)

    // 다음 글자 타이핑
    let delay = typingSpeed
    if (humanize) {
      delay = getHumanizedDelay(typingSpeed, humanizeVariance)
      if (isQuickChar(currentChar)) {
        delay *= 0.5
      }
    }

    timeoutRef.current = setTimeout(() => typeCharRef.current(), delay)
  }, [
    text,
    typingSpeed,
    humanize,
    humanizeVariance,
    loop,
    pauseBeforeDelete,
    onComplete,
    onType,
    updateState,
  ])

  // 삭제 로직
  const deleteChar = useCallback(() => {
    if (charIndexRef.current <= 0) {
      updateState({ isDeleting: false })

      // 루프: 다시 타이핑 시작
      timeoutRef.current = setTimeout(() => {
        updateState({ isTyping: true })
        typeCharRef.current()
      }, pauseDuration)
      return
    }

    charIndexRef.current--
    const newText = text.slice(0, charIndexRef.current)
    updateState({ displayText: newText })

    const delay = humanize
      ? getHumanizedDelay(deletingSpeed, humanizeVariance * 0.5)
      : deletingSpeed

    timeoutRef.current = setTimeout(() => deleteCharRef.current(), delay)
  }, [
    text,
    deletingSpeed,
    humanize,
    humanizeVariance,
    pauseDuration,
    updateState,
  ])

  // ref 업데이트
  useEffect(() => {
    typeCharRef.current = typeChar
    deleteCharRef.current = deleteChar
  })

  // 시작
  const start = useCallback(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    cleanup()
    charIndexRef.current = 0

    onStart?.()
    updateState({
      isTyping: true,
      isDeleting: false,
      isComplete: false,
      isPaused: false,
      displayText: '',
    })

    timeoutRef.current = setTimeout(typeChar, typingSpeed)
  }, [cleanup, onStart, updateState, typeChar, typingSpeed])

  // 재개
  const resume = useCallback(() => {
    if (!state.isPaused) return

    updateState({ isPaused: false })

    if (state.isComplete && loop) {
      // 완료 상태에서 재개 시 다시 시작
      reset()
      start()
    } else if (charIndexRef.current < text.length) {
      updateState({ isTyping: true })
      timeoutRef.current = setTimeout(typeChar, typingSpeed)
    }
  }, [state.isPaused, state.isComplete, loop, reset, start, updateState, text.length, typeChar, typingSpeed])

  // startOnView: IntersectionObserver
  useEffect(() => {
    if (!startOnView || !ref.current) {
      if (autoStart && !hasStartedRef.current) {
        start()
      }
      return
    }

    const element = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStartedRef.current) {
            isVisibleRef.current = true
            start()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [startOnView, autoStart, start])

  // 언마운트 시 클린업
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // 커서 클래스
  const cursorClass = useMemo(() => {
    if (!showCursor) return ''
    return state.isTyping || state.isDeleting
      ? 'typewriter-cursor typing'
      : 'typewriter-cursor'
  }, [showCursor, state.isTyping, state.isDeleting])

  // 커서 포함 텍스트
  const textWithCursor = useMemo(() => {
    if (!showCursor) return state.displayText
    return `${state.displayText}${cursorChar}`
  }, [showCursor, state.displayText, cursorChar])

  return {
    ...state,
    ref,
    start,
    pause,
    resume,
    reset,
    complete,
    cursorClass,
    textWithCursor,
  }
}

// ============================================
// MULTI-STRING TYPEWRITER
// ============================================

export interface MultiTypewriterOptions extends TypewriterOptions {
  /** 문자열 간 전환 시 지연 (ms) */
  stringTransitionDelay?: number
}

/**
 * 여러 문자열을 순환하는 타이프라이터 훅
 *
 * @example
 * ```tsx
 * const { displayText, currentStringIndex } = useMultiTypewriter(
 *   ['페어틀 에디터', '실시간 협업', '창작의 마법'],
 *   { loop: true, typingSpeed: 100 }
 * )
 * ```
 */
export function useMultiTypewriter(
  strings: string[],
  options: MultiTypewriterOptions = {}
): TypewriterReturn {
  const { stringTransitionDelay = 500, ...baseOptions } = options

  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'pausing' | 'deleting'>('typing')

  const currentString = strings[currentIndex] || ''

  // 문자열 변경 시 처리
  const handleComplete = useCallback(() => {
    if (phase === 'typing') {
      setPhase('pausing')

      setTimeout(() => {
        setPhase('deleting')
      }, baseOptions.pauseBeforeDelete || 1000)
    }
  }, [phase, baseOptions.pauseBeforeDelete])

  const typewriterReturn = useTypewriter(currentString, {
    ...baseOptions,
    loop: false,
    onComplete: handleComplete,
  })

  // 함수 참조를 안정화 (무한 루프 방지)
  const { reset, start, displayText } = typewriterReturn
  const resetRef = useRef(reset)
  const startRef = useRef(start)

  // ref 업데이트 (렌더링마다)
  useEffect(() => {
    resetRef.current = reset
    startRef.current = start
  })

  // 삭제 완료 후 다음 문자열로
  useEffect(() => {
    if (phase === 'deleting' && displayText === '') {
      const nextIndex = (currentIndex + 1) % strings.length

      // 마지막 문자열이고 loop가 false면 종료
      if (nextIndex === 0 && !baseOptions.loop) {
        return
      }

      const timeoutId = setTimeout(() => {
        setCurrentIndex(nextIndex)
        setPhase('typing')
        resetRef.current()
        startRef.current()
      }, stringTransitionDelay)

      return () => clearTimeout(timeoutId)
    }
  }, [
    phase,
    displayText,
    currentIndex,
    strings.length,
    baseOptions.loop,
    stringTransitionDelay,
  ])

  return {
    ...typewriterReturn,
    currentStringIndex: currentIndex,
  }
}

// ============================================
// TYPEWRITER WITH HIGHLIGHT
// ============================================

export interface HighlightTypewriterOptions extends TypewriterOptions {
  /** 하이라이트할 단어들 */
  highlightWords?: string[]
  /** 하이라이트 클래스 */
  highlightClass?: string
}

/**
 * 특정 단어를 하이라이트하는 타이프라이터
 *
 * @example
 * ```tsx
 * const { renderText } = useHighlightTypewriter(
 *   '페어리에서 마법 같은 협업을 시작하세요',
 *   { highlightWords: ['마법', '협업'] }
 * )
 *
 * return <h1>{renderText()}</h1>
 * ```
 */
export function useHighlightTypewriter(
  text: string,
  options: HighlightTypewriterOptions = {}
): TypewriterReturn & {
  /** 하이라이트가 적용된 JSX 렌더 함수 */
  renderText: () => React.ReactNode
} {
  const { highlightWords = [], highlightClass = 'text-gradient', ...baseOptions } = options

  const typewriterReturn = useTypewriter(text, baseOptions)

  const renderText = useCallback((): React.ReactNode => {
    const { displayText } = typewriterReturn

    if (highlightWords.length === 0) {
      return displayText
    }

    // 정규식 생성
    const pattern = highlightWords
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const regex = new RegExp(`(${pattern})`, 'gi')

    const parts = displayText.split(regex)

    return parts.map((part, index): React.ReactNode => {
      const isHighlighted = highlightWords.some(
        (word) => word.toLowerCase() === part.toLowerCase()
      )

      if (isHighlighted) {
        return (
          <span key={index} className={highlightClass}>
            {part}
          </span>
        )
      }

      return <span key={index}>{part}</span>
    })
  }, [typewriterReturn.displayText, highlightWords, highlightClass])

  return {
    ...typewriterReturn,
    renderText,
  }
}

// ============================================
// EXPORTS
// ============================================

export default useTypewriter
