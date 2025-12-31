'use client'

import { useState, useRef, useCallback } from 'react'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './interactions.module.css'

interface LikeButtonProps {
  className?: string
}

// ============================================
// 공통 유틸리티
// ============================================

function createParticles(
  container: HTMLElement,
  count: number,
  createParticle: (index: number) => HTMLElement
) {
  const particles: HTMLElement[] = []
  for (let i = 0; i < count; i++) {
    const particle = createParticle(i)
    container.appendChild(particle)
    particles.push(particle)
  }
  return particles
}

function removeParticles(particles: HTMLElement[], delay: number) {
  setTimeout(() => {
    particles.forEach((p) => p.remove())
  }, delay)
}

// ============================================
// 1. 스타 버스트 - 4점 별이 방사형으로 튀어나옴
// ============================================

export function LikeStarBurst({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const star = document.createElement('div')
        star.className = styles.starParticle
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 40 + Math.random() * 20
        star.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        star.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        star.style.setProperty('--delay', `${i * 30}ms`)
        return star
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartPop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 2. 하트 분수 - 하트가 위로 솟았다가 떨어짐
// ============================================

export function LikeHeartFountain({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const heart = document.createElement('div')
        heart.className = styles.fountainHeart
        heart.innerHTML = '♥'
        heart.style.setProperty('--tx', `${(Math.random() - 0.5) * 50}px`)
        heart.style.setProperty('--ty', `${-60 - Math.random() * 30}px`)
        heart.style.setProperty('--delay', `${i * 50}ms`)
        heart.style.setProperty('--scale', `${0.5 + Math.random() * 0.5}`)
        return heart
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartPop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 3. 스파클 트레일 - 반짝이며 회전하는 별
// ============================================

export function LikeSparkleTrail({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 12, (i) => {
        const sparkle = document.createElement('div')
        sparkle.className = styles.sparkleTrail
        sparkle.innerHTML = '✦'
        const angle = (i * 30 + Math.random() * 15) * (Math.PI / 180)
        const distance = 30 + Math.random() * 25
        sparkle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        sparkle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        sparkle.style.setProperty('--delay', `${i * 25}ms`)
        sparkle.style.setProperty('--rotate', `${Math.random() * 360}deg`)
        return sparkle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.sparkleRotate
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 4. 버블 팝 - 거품이 팡 터지는 효과
// ============================================

export function LikeBubblePop({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 7, (i) => {
        const bubble = document.createElement('div')
        bubble.className = styles.bubbleParticle
        const angle = Math.random() * Math.PI * 2
        const distance = 25 + Math.random() * 30
        bubble.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        bubble.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        bubble.style.setProperty('--delay', `${i * 40}ms`)
        bubble.style.setProperty('--size', `${6 + Math.random() * 8}px`)
        return bubble
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.bubbleScale
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 5. 리본 웨이브 - 리본이 물결치며 퍼짐
// ============================================

export function LikeRibbonWave({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const colors = ['#FFD9D9', '#FFCACA', '#FFC0CB', '#FFB6C1']
      const particles = createParticles(containerRef.current, 4, (i) => {
        const ribbon = document.createElement('div')
        ribbon.className = styles.ribbonWave
        ribbon.style.setProperty('--color', colors[i % colors.length])
        ribbon.style.setProperty('--delay', `${i * 60}ms`)
        ribbon.style.setProperty('--angle', `${i * 90}deg`)
        return ribbon
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartWobble
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 6. 콩팡 점프 - 통통 튀는 효과
// ============================================

export function LikeBounceJump({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 5, (i) => {
        const dot = document.createElement('div')
        dot.className = styles.bounceDot
        const angle = (i * 72 - 90) * (Math.PI / 180)
        dot.style.setProperty('--tx', `${Math.cos(angle) * 35}px`)
        dot.style.setProperty('--ty', `${Math.sin(angle) * 35}px`)
        dot.style.setProperty('--delay', `${i * 50}ms`)
        return dot
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50',
          isAnimating && styles.jumpBounce
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 7. 스케일 펄스 - 크기가 펄스치며 파동
// ============================================

export function LikeScalePulse({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 3, (i) => {
        const ring = document.createElement('div')
        ring.className = styles.pulseRing
        ring.style.setProperty('--delay', `${i * 150}ms`)
        return ring
      })
      removeParticles(particles, 1000)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.scalePulse
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 8. 로테이션 스핀 - 회전하며 반짝임
// ============================================

export function LikeRotationSpin({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const star = document.createElement('div')
        star.className = styles.spinStar
        star.innerHTML = '✦'
        const angle = (i * 60) * (Math.PI / 180)
        star.style.setProperty('--startAngle', `${i * 60}deg`)
        star.style.setProperty('--radius', '32px')
        star.style.setProperty('--delay', `${i * 30}ms`)
        return star
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartSpin
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 9. 슬라이스 파티클 - 조각들이 사방으로
// ============================================

export function LikeSliceParticle({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const slice = document.createElement('div')
        slice.className = styles.sliceParticle
        const angle = Math.random() * Math.PI * 2
        const distance = 35 + Math.random() * 25
        slice.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        slice.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        slice.style.setProperty('--rotate', `${Math.random() * 360}deg`)
        slice.style.setProperty('--delay', `${i * 20}ms`)
        return slice
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.sliceExplode
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 10. 웨이브 링 - 동심원 파동
// ============================================

export function LikeWaveRing({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 3, (i) => {
        const ring = document.createElement('div')
        ring.className = styles.waveRing
        ring.style.setProperty('--delay', `${i * 100}ms`)
        return ring
      })
      removeParticles(particles, 1000)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartPop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 11. 플라워 블룸 - 꽃잎이 피어남
// ============================================

export function LikeFlowerBloom({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const petals = ['🌸', '💮', '🌷', '✿', '❀']
      const particles = createParticles(containerRef.current, 6, (i) => {
        const petal = document.createElement('div')
        petal.className = styles.flowerPetal
        petal.innerHTML = petals[i % petals.length]
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 35 + Math.random() * 15
        petal.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        petal.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        petal.style.setProperty('--delay', `${i * 40}ms`)
        petal.style.setProperty('--rotate', `${Math.random() * 30 - 15}deg`)
        return petal
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.bloomPop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 12. 스노우 플레이크 - 눈결정 흩날림
// ============================================

export function LikeSnowflake({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const snow = document.createElement('div')
        snow.className = styles.snowflakeParticle
        snow.innerHTML = '❄'
        const angle = (i * 45 + Math.random() * 20) * (Math.PI / 180)
        const distance = 30 + Math.random() * 25
        snow.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        snow.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        snow.style.setProperty('--delay', `${i * 30}ms`)
        snow.style.setProperty('--rotate', `${Math.random() * 180}deg`)
        return snow
      })
      removeParticles(particles, 1000)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.snowShake
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 13. 컨페티 샤워 - 색종이 비
// ============================================

export function LikeConfettiShower({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const colors = ['#FFD9D9', '#D7FAFA', '#FFF0B3', '#E8D5FF', '#D5F5E3']
      const particles = createParticles(containerRef.current, 15, (i) => {
        const confetti = document.createElement('div')
        confetti.className = styles.confettiPiece
        confetti.style.setProperty('--color', colors[i % colors.length])
        confetti.style.setProperty('--tx', `${(Math.random() - 0.5) * 80}px`)
        confetti.style.setProperty('--ty', `${-50 - Math.random() * 30}px`)
        confetti.style.setProperty('--delay', `${i * 25}ms`)
        confetti.style.setProperty('--rotate', `${Math.random() * 360}deg`)
        return confetti
      })
      removeParticles(particles, 1200)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.confettiPop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 14. 스프링 바운스 - 스프링처럼 튕김
// ============================================

export function LikeSpringBounce({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 4, (i) => {
        const spring = document.createElement('div')
        spring.className = styles.springLine
        spring.style.setProperty('--angle', `${i * 90}deg`)
        spring.style.setProperty('--delay', `${i * 50}ms`)
        return spring
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50',
          isAnimating && styles.springBounce
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 15. 매직 더스트 - 마법 가루 흩뿌림
// ============================================

export function LikeMagicDust({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 20, (i) => {
        const dust = document.createElement('div')
        dust.className = styles.magicDust
        const angle = Math.random() * Math.PI * 2
        const distance = 20 + Math.random() * 40
        dust.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        dust.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        dust.style.setProperty('--delay', `${i * 15}ms`)
        dust.style.setProperty('--size', `${2 + Math.random() * 4}px`)
        dust.style.setProperty('--opacity', `${0.5 + Math.random() * 0.5}`)
        return dust
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.magicGlow
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 16. 하트 지글 - 좌우로 흔들림
// ============================================

export function LikeHeartJiggle({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.diamondParticle
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartJiggle
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 17. 플로팅 업 - 위로 떠오르는 효과
// ============================================

export function LikeFloatUp({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.twinkle
        particle.innerHTML = '✧'
        const angle = (i * 45 - 90) * (Math.PI / 180)
        const distance = 35 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.floatUp
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 18. 펑키 펄스 - 색상이 변하며 펄스
// ============================================

export function LikeFunkyPulse({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 12, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.glowOrb
        const angle = Math.random() * Math.PI * 2
        const distance = 25 + Math.random() * 30
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--size', `${6 + Math.random() * 8}px`)
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.funkyPulse
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 19. 트위스트 - 회전하며 확대
// ============================================

export function LikeTwist({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.crescent
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.twist
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 20. 드럼 비트 - 쿵쿵 뛰는 효과
// ============================================

export function LikeDrumBeat({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.sprite
        const angle = (i * 60 - 30) * (Math.PI / 180)
        const distance = 28 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 35}ms`)
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.drumBeat
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 21. 스윙 - 매달려 흔들림
// ============================================

export function LikeSwing({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.pixieTrail
        const angle = Math.random() * Math.PI * 2
        const distance = 25 + Math.random() * 25
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.swing
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 22. 러버밴드 - 고무줄처럼 늘어남
// ============================================

export function LikeRubberBand({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.rosePetal
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 1000)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.rubberBand
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 23. 텀블 - 구르듯 흔들림
// ============================================

export function LikeTumble({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.sparkleStar
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 6}px`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.tumble
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 24. 버블팝2 - 거품이 톡 터짐
// ============================================

export function LikeBubblePop2({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const colors = ['#FFD9D9', '#FFCACA', '#FFB6C1', '#FFC0CB']
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.miniHeart
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 4}px`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.bubblePop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 25. 슬라이드인 - 옆에서 미끄러져 들어옴
// ============================================

export function LikeSlideIn({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.crystal
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.slideIn
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 26. 파티팝 - 파티처럼 화려하게
// ============================================

export function LikePartyPop({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 15, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.glitter
        const angle = Math.random() * Math.PI * 2
        const distance = 30 + Math.random() * 30
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 15}ms`)
        return particle
      })
      removeParticles(particles, 600)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.partyPop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 27. 웨이브2 - 물결치는 효과
// ============================================

export function LikeWave2({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const colors = ['#FFD9D9', '#FFCACA', '#FFB6C1']
      const particles = createParticles(containerRef.current, 9, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.softDot
        const angle = (i * 40) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--size', `${6 + Math.random() * 6}px`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.wave
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 28. 스파이럴 - 나선형 회전
// ============================================

export function LikeSpiral({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.shimmer
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        particle.style.setProperty('--angle', `${i * 45}deg`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.spiral
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 29. 플립 - 뒤집히는 효과
// ============================================

export function LikeFlip({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const colors = ['#FFD9D9', '#FFB6C1', '#FFCACA']
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.blurDot
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--size', `${6 + Math.random() * 6}px`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.flip
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 30. 스퀴시 - 찌그러지며 늘어남
// ============================================

export function LikeSquish({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.crossStar
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--size', `${10 + Math.random() * 6}px`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.squish
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 31. 하트플로트 - 하트가 떠다님
// ============================================

export function LikeHeartFloat({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const colors = ['#FFD9D9', '#FFCACA', '#FFB6C1', '#FFC0CB']
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.miniHeart
        const angle = (i * 36 - 90) * (Math.PI / 180)
        const distance = 25 + Math.random() * 30
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 6}px`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartFloat
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 32. 펄세이트 - 맥동하는 효과
// ============================================

export function LikePulsate({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 3, (i) => {
        const ring = document.createElement('div')
        ring.className = styles.pulseRing
        ring.style.setProperty('--delay', `${i * 120}ms`)
        return ring
      })
      removeParticles(particles, 1100)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.pulsate
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 33. 쉐이크 - 떨림 효과
// ============================================

export function LikeShake({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 12, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.glitter
        const angle = (i * 30) * (Math.PI / 180)
        const distance = 25 + Math.random() * 25
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 15}ms`)
        return particle
      })
      removeParticles(particles, 600)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.shake
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 34. 타다 - 짠! 하는 효과
// ============================================

export function LikeTada({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.sparkleStar
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 35 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        particle.style.setProperty('--size', `${12 + Math.random() * 8}px`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.tada
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 35. 하트비트 - 심장박동
// ============================================

export function LikeHeartbeat({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.glowOrb
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 40}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 6}px`)
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.heartbeat
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 36. 바운스2 - 통통 튀기
// ============================================

export function LikeBounce2({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.sprite
        const angle = (i * 45 - 90) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 1000)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.bounce
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 37. 플래시 - 번쩍임
// ============================================

export function LikeFlash({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.twinkle
        particle.innerHTML = '✧'
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.flash
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 38. 줌인 - 확대되며 나타남
// ============================================

export function LikeZoomIn({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.diamondParticle
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 35 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.zoomIn
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 39. 로테이트인 - 회전하며 나타남
// ============================================

export function LikeRotateIn({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.crescent
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.rotateIn
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 40. 슬라이드업 - 아래서 위로
// ============================================

export function LikeSlideUp({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.pixieTrail
        const angle = (i * 45 - 90) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.slideUp
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 41. 확장축소 - 커졌다 작아짐
// ============================================

export function LikeExpandContract({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.rosePetal
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        return particle
      })
      removeParticles(particles, 1000)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.expandContract
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 42. 글로우펄스 - 빛나는 맥동
// ============================================

export function LikeGlowPulse({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.glowOrb
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 25
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 8}px`)
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.glowPulse
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 43. 스핀팝 - 회전하며 팝
// ============================================

export function LikeSpinPop({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.crystal
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.spinPop
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 44. 젤리워블 - 젤리처럼 흔들림
// ============================================

export function LikeJellyWobble({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const colors = ['#FFD9D9', '#FFCACA', '#FFB6C1', '#FFC0CB']
      const particles = createParticles(containerRef.current, 12, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.softDot
        const angle = (i * 30) * (Math.PI / 180)
        const distance = 28 + Math.random() * 22
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 18}ms`)
        particle.style.setProperty('--size', `${6 + Math.random() * 6}px`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.jellyWobble
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 45. 브리드 - 숨쉬는 듯한 효과
// ============================================

export function LikeBreathe({ className }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newLiked = !isLiked
    setIsLiked(newLiked)

    if (newLiked && containerRef.current) {
      const particles = createParticles(containerRef.current, 3, (i) => {
        const ring = document.createElement('div')
        ring.className = styles.waveRing
        ring.style.setProperty('--delay', `${i * 150}ms`)
        return ring
      })
      removeParticles(particles, 1100)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isLiked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-pink-50 active:scale-90',
          isAnimating && styles.breathe
        )}
      >
        <Heart
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isLiked ? 'fill-pink-400 text-pink-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// Export All
// ============================================

export const LikeButtonVariants = {
  StarBurst: LikeStarBurst,
  HeartFountain: LikeHeartFountain,
  SparkleTrail: LikeSparkleTrail,
  BubblePop: LikeBubblePop,
  RibbonWave: LikeRibbonWave,
  BounceJump: LikeBounceJump,
  ScalePulse: LikeScalePulse,
  RotationSpin: LikeRotationSpin,
  SliceParticle: LikeSliceParticle,
  WaveRing: LikeWaveRing,
  FlowerBloom: LikeFlowerBloom,
  Snowflake: LikeSnowflake,
  ConfettiShower: LikeConfettiShower,
  SpringBounce: LikeSpringBounce,
  MagicDust: LikeMagicDust,
  // 16-45 추가
  HeartJiggle: LikeHeartJiggle,
  FloatUp: LikeFloatUp,
  FunkyPulse: LikeFunkyPulse,
  Twist: LikeTwist,
  DrumBeat: LikeDrumBeat,
  Swing: LikeSwing,
  RubberBand: LikeRubberBand,
  Tumble: LikeTumble,
  BubblePop2: LikeBubblePop2,
  SlideIn: LikeSlideIn,
  PartyPop: LikePartyPop,
  Wave2: LikeWave2,
  Spiral: LikeSpiral,
  Flip: LikeFlip,
  Squish: LikeSquish,
  HeartFloat: LikeHeartFloat,
  Pulsate: LikePulsate,
  Shake: LikeShake,
  Tada: LikeTada,
  Heartbeat: LikeHeartbeat,
  Bounce2: LikeBounce2,
  Flash: LikeFlash,
  ZoomIn: LikeZoomIn,
  RotateIn: LikeRotateIn,
  SlideUp: LikeSlideUp,
  ExpandContract: LikeExpandContract,
  GlowPulse: LikeGlowPulse,
  SpinPop: LikeSpinPop,
  JellyWobble: LikeJellyWobble,
  Breathe: LikeBreathe,
}
