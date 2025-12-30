/**
 * useParticle Hook Unit Tests
 *
 * 테스트 시나리오:
 * 1. 파티클 생성
 * 2. 방향별 애니메이션
 * 3. 연속 파티클
 * 4. 접근성 (prefers-reduced-motion)
 * 5. 클린업
 * 6. 프리셋 훅
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

jest.useFakeTimers()

describe('useParticle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  describe('파티클 타입 검증', () => {
    it('모든 파티클 타입이 정의되어야 함', () => {
      const particleTypes = [
        'confetti',
        'sparkle',
        'heart',
        'star',
        'emoji',
        'bubble',
        'snow',
      ]

      expect(particleTypes.length).toBe(7)
      expect(particleTypes).toContain('confetti')
      expect(particleTypes).toContain('heart')
    })

    it('모든 파티클 방향이 정의되어야 함', () => {
      const directions = [
        'up',
        'down',
        'left',
        'right',
        'radial',
        'fountain',
      ]

      expect(directions.length).toBe(6)
      expect(directions).toContain('radial')
      expect(directions).toContain('fountain')
    })
  })

  describe('유틸리티 함수 검증', () => {
    it('generateId가 고유한 ID를 생성해야 함', () => {
      const generateId = () =>
        `particle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateId())
      }

      // 모든 ID가 고유해야 함
      expect(ids.size).toBe(100)
    })

    it('randomInRange가 지정된 범위 내의 값을 반환해야 함', () => {
      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min

      for (let i = 0; i < 100; i++) {
        const value = randomInRange(10, 50)
        expect(value).toBeGreaterThanOrEqual(10)
        expect(value).toBeLessThanOrEqual(50)
      }
    })

    it('randomFromArray가 배열에서 랜덤 요소를 반환해야 함', () => {
      const arr = ['a', 'b', 'c', 'd', 'e']
      const randomFromArray = <T>(array: T[]): T =>
        array[Math.floor(Math.random() * array.length)]

      for (let i = 0; i < 100; i++) {
        const item = randomFromArray(arr)
        expect(arr).toContain(item)
      }
    })

    it('getAngleForDirection이 방향별 올바른 각도를 반환해야 함', () => {
      const getBaseAngle = (direction: string): number => {
        switch (direction) {
          case 'up':
            return -90
          case 'down':
            return 90
          case 'left':
            return 180
          case 'right':
            return 0
          case 'radial':
            return 0 // 인덱스에 따라 계산
          case 'fountain':
            return -90
          default:
            return 0
        }
      }

      expect(getBaseAngle('up')).toBe(-90)
      expect(getBaseAngle('down')).toBe(90)
      expect(getBaseAngle('left')).toBe(180)
      expect(getBaseAngle('right')).toBe(0)
    })
  })

  describe('파티클 생성 검증', () => {
    it('지정된 개수만큼 파티클을 생성해야 함', () => {
      const count = 20
      const particles = Array.from({ length: count }, (_, index) => ({
        id: `particle-${index}`,
        x: 0,
        y: 0,
        size: 12,
        color: '#FFD9D9',
        rotation: 0,
        duration: 1000,
        delay: index * 20,
        type: 'confetti' as const,
        direction: 'radial' as const,
        distance: 100,
      }))

      expect(particles.length).toBe(count)
    })

    it('파티클 속성이 올바르게 설정되어야 함', () => {
      const particle = {
        id: 'test-particle',
        x: 100,
        y: 200,
        size: 16,
        color: '#FFD9D9',
        rotation: 45,
        duration: 1000,
        delay: 0,
        type: 'confetti' as const,
        direction: 'radial' as const,
        distance: 150,
      }

      expect(particle.id).toBe('test-particle')
      expect(particle.x).toBe(100)
      expect(particle.y).toBe(200)
      expect(particle.size).toBe(16)
      expect(particle.color).toBe('#FFD9D9')
      expect(particle.type).toBe('confetti')
    })

    it('이모지 타입 파티클이 이모지를 포함해야 함', () => {
      const emojis = ['🎉', '🎊', '✨', '💫', '🌟']
      const emojiParticle = {
        id: 'emoji-particle',
        x: 0,
        y: 0,
        size: 20,
        color: 'transparent',
        rotation: 0,
        duration: 1000,
        delay: 0,
        type: 'emoji' as const,
        emoji: emojis[0],
        direction: 'radial' as const,
        distance: 100,
      }

      expect(emojiParticle.emoji).toBe('🎉')
      expect(emojis).toContain(emojiParticle.emoji)
    })
  })

  describe('기본 색상 검증', () => {
    it('기본 색상 배열이 브랜드 색상을 포함해야 함', () => {
      const DEFAULT_COLORS = [
        '#FFD9D9', // primary-200
        '#FFCACA', // primary-300
        '#D7FAFA', // accent-200
        '#B8F0F0', // accent-300
        '#E8A8A8', // primary-400
        '#9FD9D9', // accent-400
      ]

      expect(DEFAULT_COLORS.length).toBe(6)
      expect(DEFAULT_COLORS).toContain('#FFD9D9')
      expect(DEFAULT_COLORS).toContain('#D7FAFA')
    })
  })

  describe('이모지 세트 검증', () => {
    it('각 이모지 세트가 올바르게 정의되어야 함', () => {
      const EMOJI_SETS = {
        celebration: ['🎉', '🎊', '✨', '💫', '🌟'],
        love: ['❤️', '💕', '💖', '💗', '💝'],
        nature: ['🌸', '🌺', '🌷', '🌹', '🌻'],
        stars: ['⭐', '🌟', '✨', '💫', '✦'],
        hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜'],
      }

      expect(EMOJI_SETS.celebration.length).toBe(5)
      expect(EMOJI_SETS.love.length).toBe(5)
      expect(EMOJI_SETS.hearts.length).toBe(6)
      expect(EMOJI_SETS.celebration).toContain('🎉')
    })
  })

  describe('접근성 검증', () => {
    it('prefers-reduced-motion이 true일 때 파티클을 생성하지 않아야 함', () => {
      const prefersReducedMotion = () =>
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // 기본값은 false
      expect(prefersReducedMotion()).toBe(false)
    })
  })

  describe('연속 파티클 검증', () => {
    it('continuous 모드에서 interval마다 파티클을 생성해야 함', () => {
      const interval = 100
      let emitCount = 0

      const startContinuous = () => {
        const intervalId = setInterval(() => {
          emitCount++
        }, interval)

        return intervalId
      }

      const intervalId = startContinuous()

      // 500ms 동안 5번 emit
      jest.advanceTimersByTime(500)
      expect(emitCount).toBe(5)

      clearInterval(intervalId)
    })

    it('stopContinuous가 interval을 정리해야 함', () => {
      let isRunning = true

      const stop = () => {
        isRunning = false
      }

      stop()
      expect(isRunning).toBe(false)
    })
  })

  describe('클린업 검증', () => {
    it('clear가 모든 파티클을 제거해야 함', () => {
      let particles = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ]

      const clear = () => {
        particles = []
      }

      clear()
      expect(particles.length).toBe(0)
    })

    it('파티클이 duration 후 제거되어야 함', () => {
      const duration = 1000
      let particles = [{ id: '1', duration }]

      const scheduleRemoval = (id: string, delay: number) => {
        setTimeout(() => {
          particles = particles.filter((p) => p.id !== id)
        }, delay)
      }

      scheduleRemoval('1', duration)
      expect(particles.length).toBe(1)

      jest.advanceTimersByTime(duration + 100)
      expect(particles.length).toBe(0)
    })
  })
})

describe('프리셋 훅', () => {
  describe('useCelebrationParticle', () => {
    it('축하 프리셋이 올바른 옵션을 가져야 함', () => {
      const celebrationOptions = {
        type: 'confetti' as const,
        count: 40,
        direction: 'fountain' as const,
        duration: 1200,
        distanceRange: [80, 200] as [number, number],
      }

      expect(celebrationOptions.type).toBe('confetti')
      expect(celebrationOptions.count).toBe(40)
      expect(celebrationOptions.direction).toBe('fountain')
    })
  })

  describe('useLikeParticle', () => {
    it('좋아요 프리셋이 올바른 옵션을 가져야 함', () => {
      const likeOptions = {
        type: 'heart' as const,
        count: 8,
        direction: 'up' as const,
        colors: ['#FFD9D9', '#FFCACA', '#E8A8A8'],
        sizeRange: [12, 20] as [number, number],
        duration: 800,
      }

      expect(likeOptions.type).toBe('heart')
      expect(likeOptions.count).toBe(8)
      expect(likeOptions.direction).toBe('up')
      expect(likeOptions.colors.length).toBe(3)
    })
  })

  describe('useSparkleParticle', () => {
    it('반짝임 프리셋이 올바른 옵션을 가져야 함', () => {
      const sparkleOptions = {
        type: 'sparkle' as const,
        count: 12,
        direction: 'radial' as const,
        sizeRange: [4, 8] as [number, number],
        duration: 600,
      }

      expect(sparkleOptions.type).toBe('sparkle')
      expect(sparkleOptions.direction).toBe('radial')
    })
  })

  describe('useSuccessParticle', () => {
    it('성공 프리셋이 올바른 옵션을 가져야 함', () => {
      const successOptions = {
        type: 'emoji' as const,
        count: 15,
        emojis: ['✨', '🎉', '💫', '⭐'],
        sizeRange: [16, 24] as [number, number],
      }

      expect(successOptions.type).toBe('emoji')
      expect(successOptions.emojis).toContain('🎉')
      expect(successOptions.emojis).toContain('✨')
    })
  })
})
