'use client'

import { useState, useRef, useCallback } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './interactions.module.css'

interface BookmarkButtonProps {
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
// 1. 페이지 폴드 - 종이 접히는 효과
// ============================================

export function BookmarkPageFold({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 4, (i) => {
        const fold = document.createElement('div')
        fold.className = styles.pageFold
        fold.style.setProperty('--angle', `${i * 90}deg`)
        fold.style.setProperty('--delay', `${i * 50}ms`)
        return fold
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.foldIn
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 2. 스탬프 - 쿵 찍히는 효과
// ============================================

export function BookmarkStamp({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const ink = document.createElement('div')
        ink.className = styles.stampInk
        const angle = (i * 45 + Math.random() * 20) * (Math.PI / 180)
        const distance = 20 + Math.random() * 15
        ink.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        ink.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        ink.style.setProperty('--delay', `${Math.random() * 100}ms`)
        return ink
      })
      removeParticles(particles, 600)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50',
          isAnimating && styles.stampDown
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 3. 리본 타이 - 리본이 묶이는 효과
// ============================================

export function BookmarkRibbonTie({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 2, (i) => {
        const ribbon = document.createElement('div')
        ribbon.className = styles.ribbonTie
        ribbon.style.setProperty('--side', i === 0 ? '-1' : '1')
        ribbon.style.setProperty('--delay', `${i * 80}ms`)
        return ribbon
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.ribbonPop
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 4. 플래그 웨이브 - 깃발이 펄럭임
// ============================================

export function BookmarkFlagWave({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const flags = ['🚩', '🏳️', '🎌', '⛳']
      const particles = createParticles(containerRef.current, 4, (i) => {
        const flag = document.createElement('div')
        flag.className = styles.flagWave
        flag.innerHTML = flags[i % flags.length]
        const angle = (i * 90 - 45) * (Math.PI / 180)
        flag.style.setProperty('--tx', `${Math.cos(angle) * 35}px`)
        flag.style.setProperty('--ty', `${Math.sin(angle) * 35}px`)
        flag.style.setProperty('--delay', `${i * 60}ms`)
        return flag
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.flagFlutter
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 5. 페이퍼클립 - 클립이 끼워지는 효과
// ============================================

export function BookmarkPaperClip({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 3, (i) => {
        const clip = document.createElement('div')
        clip.className = styles.paperClip
        clip.innerHTML = '📎'
        clip.style.setProperty('--tx', `${(i - 1) * 20}px`)
        clip.style.setProperty('--ty', '-30px')
        clip.style.setProperty('--delay', `${i * 70}ms`)
        clip.style.setProperty('--rotate', `${(Math.random() - 0.5) * 30}deg`)
        return clip
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.clipSnap
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 6. 스타 마크 - 별이 찍히는 효과
// ============================================

export function BookmarkStarMark({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const star = document.createElement('div')
        star.className = styles.starMark
        star.innerHTML = '✦'
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        star.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        star.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        star.style.setProperty('--delay', `${i * 40}ms`)
        star.style.setProperty('--scale', `${0.6 + Math.random() * 0.6}`)
        return star
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.starPop
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 7. 하이라이트 - 형광펜 칠하기
// ============================================

export function BookmarkHighlight({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 1, (i) => {
        const highlight = document.createElement('div')
        highlight.className = styles.highlightStroke
        return highlight
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.highlightGlow
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 8. 앵커 드롭 - 닻이 내려오는 효과
// ============================================

export function BookmarkAnchorDrop({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 1, (i) => {
        const anchor = document.createElement('div')
        anchor.className = styles.anchorDrop
        anchor.innerHTML = '⚓'
        return anchor
      })

      // Add water ripples
      const ripples = createParticles(containerRef.current, 3, (i) => {
        const ripple = document.createElement('div')
        ripple.className = styles.waterRipple
        ripple.style.setProperty('--delay', `${200 + i * 100}ms`)
        return ripple
      })

      removeParticles(particles, 700)
      removeParticles(ripples, 1000)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.anchorBounce
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 9. 핀 드롭 - 핀이 꽂히는 효과
// ============================================

export function BookmarkPinDrop({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const pins = ['📍', '📌', '🔖']
      const particles = createParticles(containerRef.current, 3, (i) => {
        const pin = document.createElement('div')
        pin.className = styles.pinDrop
        pin.innerHTML = pins[i % pins.length]
        pin.style.setProperty('--tx', `${(i - 1) * 25}px`)
        pin.style.setProperty('--delay', `${i * 80}ms`)
        return pin
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50',
          isAnimating && styles.pinStick
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 10. 테이프 - 테이프가 붙는 효과
// ============================================

export function BookmarkTape({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 2, (i) => {
        const tape = document.createElement('div')
        tape.className = styles.tapeStick
        tape.style.setProperty('--angle', i === 0 ? '-20deg' : '20deg')
        tape.style.setProperty('--ty', i === 0 ? '-20px' : '20px')
        tape.style.setProperty('--delay', `${i * 100}ms`)
        return tape
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.tapePress
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 11. 씰 스탬프 - 왁스 도장
// ============================================

export function BookmarkSealStamp({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 1, (i) => {
        const seal = document.createElement('div')
        seal.className = styles.sealStamp
        return seal
      })

      // Add wax splatter
      const splatters = createParticles(containerRef.current, 6, (i) => {
        const splat = document.createElement('div')
        splat.className = styles.waxSplatter
        const angle = (i * 60 + Math.random() * 30) * (Math.PI / 180)
        const distance = 25 + Math.random() * 15
        splat.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        splat.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        splat.style.setProperty('--delay', `${50 + i * 20}ms`)
        return splat
      })

      removeParticles(particles, 800)
      removeParticles(splatters, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50',
          isAnimating && styles.sealPress
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 12. 스티커 - 스티커 붙이기
// ============================================

export function BookmarkSticker({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const stickers = ['⭐', '💫', '✨', '🌟', '💖']
      const particles = createParticles(containerRef.current, 5, (i) => {
        const sticker = document.createElement('div')
        sticker.className = styles.stickerPop
        sticker.innerHTML = stickers[i % stickers.length]
        const angle = (i * 72 - 90) * (Math.PI / 180)
        const distance = 32 + Math.random() * 15
        sticker.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        sticker.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        sticker.style.setProperty('--delay', `${i * 50}ms`)
        sticker.style.setProperty('--rotate', `${(Math.random() - 0.5) * 40}deg`)
        return sticker
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.stickerSlap
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 13. 별똥별 - 유성이 지나가는 효과
// ============================================

export function BookmarkShootingStar({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 3, (i) => {
        const star = document.createElement('div')
        star.className = styles.shootingStar
        star.style.setProperty('--startX', `${-30 - i * 15}px`)
        star.style.setProperty('--startY', `${-30 - i * 10}px`)
        star.style.setProperty('--delay', `${i * 100}ms`)
        return star
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.starFlash
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 14. 잉크 드롭 - 잉크가 번지는 효과
// ============================================

export function BookmarkInkDrop({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 5, (i) => {
        const ink = document.createElement('div')
        ink.className = styles.inkDrop
        const angle = Math.random() * Math.PI * 2
        const distance = 15 + Math.random() * 25
        ink.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        ink.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        ink.style.setProperty('--delay', `${i * 40}ms`)
        ink.style.setProperty('--size', `${8 + Math.random() * 12}px`)
        return ink
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.inkSpread
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 15. 매직 링크 - 체인이 연결되는 효과
// ============================================

export function BookmarkMagicLink({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 4, (i) => {
        const link = document.createElement('div')
        link.className = styles.magicLink
        link.innerHTML = '🔗'
        const angle = (i * 90 + 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 10
        link.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        link.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        link.style.setProperty('--delay', `${i * 60}ms`)
        link.style.setProperty('--rotate', `${i * 90}deg`)
        return link
      })

      // Add connecting sparkles
      const sparkles = createParticles(containerRef.current, 8, (i) => {
        const sparkle = document.createElement('div')
        sparkle.className = styles.linkSparkle
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 20 + Math.random() * 15
        sparkle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        sparkle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        sparkle.style.setProperty('--delay', `${100 + i * 25}ms`)
        return sparkle
      })

      removeParticles(particles, 800)
      removeParticles(sparkles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.linkPulse
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 16. 폴드팝 - 종이가 톡 펴짐
// ============================================

export function BookmarkFoldPop({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.goldSparkle
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 6}px`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.foldPop
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 17. 탭플립 - 탭이 뒤집힘
// ============================================

export function BookmarkTabFlip({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.paperFlake
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.tabFlip
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 18. 마커드롭 - 마커가 떨어짐
// ============================================

export function BookmarkMarkerDrop({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFD700', '#FFA500', '#DAA520']
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.bookmarkMini
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.markerDrop
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 19. 라벨스윙 - 라벨이 흔들림
// ============================================

export function BookmarkLabelSwing({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.ribbonFly
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--angle', `${i * 45}deg`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.labelSwing
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 20. 북오픈 - 책이 펼쳐짐
// ============================================

export function BookmarkBookOpen({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.tagFlip
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.bookOpen
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 21. 노트플립 - 노트가 뒤집힘
// ============================================

export function BookmarkNoteFlip({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.sunburstRay
        const angle = (i * 36) * (Math.PI / 180)
        particle.style.setProperty('--angle', `${i * 36}deg`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.noteFlip
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 22. 태그위글 - 태그가 흔들림
// ============================================

export function BookmarkTagWiggle({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFE4B5', '#FFF8DC', '#F5DEB3', '#FFD700']
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.noteDot
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 28 + Math.random() * 22
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--size', `${5 + Math.random() * 5}px`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.tagWiggle
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 23. 카드팝 - 카드가 튀어오름
// ============================================

export function BookmarkCardPop({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.folderTab
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.cardPop
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 24. 클립스윙 - 클립이 흔들림
// ============================================

export function BookmarkClipSwing({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.archiveLine
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 25 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--angle', `${i * 45}deg`)
        return particle
      })
      removeParticles(particles, 600)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.clipSwing
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 25. 핀바운스 - 핀이 튕김
// ============================================

export function BookmarkPinBounce({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFF8DC', '#F5DEB3', '#FFE4B5', '#FFFACD']
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.labelFloat
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.pinBounce
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 26. 세이브슬라이드 - 저장 애니메이션
// ============================================

export function BookmarkSaveSlide({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.saveCheck
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 35}ms`)
        particle.style.setProperty('--size', `${10 + Math.random() * 6}px`)
        return particle
      })
      removeParticles(particles, 600)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.saveSlide
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 27. 마크푸시 - 마크가 눌림
// ============================================

export function BookmarkMarkPush({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFD700', '#DAA520', '#FFD700']
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.cornerMark
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.markPush
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 28. 플래그레이즈 - 깃발이 올라감
// ============================================

export function BookmarkFlagRaise({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#DAA520', '#FFD700', '#FFA500']
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.dotTrail
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.flagRaise
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 29. 리본트위스트 - 리본이 꼬임
// ============================================

export function BookmarkRibbonTwist({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.ribbonFly
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--angle', `${i * 45}deg`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.ribbonTwist
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 30. 북마크글로우 - 빛나는 효과
// ============================================

export function BookmarkGlow({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.goldSparkle
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 30 + Math.random() * 25
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 6}px`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.bookmarkGlow
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 31. 페이지턴 - 페이지가 넘어감
// ============================================

export function BookmarkPageTurn({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.paperFlake
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.pageTurn
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 32. 탭슬라이드 - 탭이 미끄러짐
// ============================================

export function BookmarkTabSlide({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFD700', '#FFA500', '#DAA520', '#FFE4B5']
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.bookmarkMini
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.tabSlide
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 33. 코너폴드 - 모서리가 접힘
// ============================================

export function BookmarkCornerFold({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.tagFlip
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.cornerFold
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 34. 스탬프프레스 - 스탬프 눌림
// ============================================

export function BookmarkStampPress({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.goldSparkle
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 28 + Math.random() * 20
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--size', `${8 + Math.random() * 4}px`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.stampPress
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 35. 씰마크 - 봉인 마크
// ============================================

export function BookmarkSealMark({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFD700', '#FFA500', '#DAA520']
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.plusMark
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--size', `${12 + Math.random() * 6}px`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 600)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.sealMark
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 36. 클립어태치 - 클립 부착
// ============================================

export function BookmarkClipAttach({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.folderTab
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 30 + Math.random() * 15
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.clipAttach
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 37. 페이퍼푸시 - 종이 밀기
// ============================================

export function BookmarkPaperPush({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.paperFlake
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 900)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.paperPush
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 38. 폴드리빌 - 접기 펼치기
// ============================================

export function BookmarkFoldReveal({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.sunburstRay
        const angle = (i * 36)
        particle.style.setProperty('--angle', `${angle}deg`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.foldReveal
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 39. 태그댕글 - 태그 매달림
// ============================================

export function BookmarkTagDangle({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFF8DC', '#F5DEB3', '#FFE4B5']
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.labelFloat
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.tagDangle
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 40. 리본랩 - 리본 감기
// ============================================

export function BookmarkRibbonWrap({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.ribbonFly
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 30 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--angle', `${i * 45}deg`)
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.ribbonWrap
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 41. 아카이브드롭 - 아카이브 저장
// ============================================

export function BookmarkArchiveDrop({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 6, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.folderTab
        const angle = (i * 60) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 30}ms`)
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 400)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.archiveDrop
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 42. 인덱스슬라이드 - 인덱스 슬라이드
// ============================================

export function BookmarkIndexSlide({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#DAA520', '#FFD700', '#FFA500']
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.dotTrail
        const angle = (i * 36) * (Math.PI / 180)
        const distance = 28 + Math.random() * 22
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 18}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.indexSlide
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 43. 노치클릭 - 딸각 클릭
// ============================================

export function BookmarkNotchClick({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.archiveLine
        const angle = (i * 45)
        particle.style.setProperty('--angle', `${angle}deg`)
        particle.style.setProperty('--tx', '0px')
        particle.style.setProperty('--ty', '0px')
        particle.style.setProperty('--delay', `${i * 25}ms`)
        return particle
      })
      removeParticles(particles, 600)
    }

    setTimeout(() => setIsAnimating(false), 300)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.notchClick
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 44. 코너필 - 모서리 벗기기
// ============================================

export function BookmarkCornerPeel({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFD700', '#DAA520', '#FFE4B5']
      const particles = createParticles(containerRef.current, 8, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.cornerMark
        const angle = (i * 45) * (Math.PI / 180)
        const distance = 28 + Math.random() * 18
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 25}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 700)
    }

    setTimeout(() => setIsAnimating(false), 500)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.cornerPeel
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 45. 북마크플로트 - 떠다니는 효과
// ============================================

export function BookmarkFloat({ className }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked && containerRef.current) {
      const colors = ['#FFD700', '#FFA500', '#DAA520', '#FFE4B5']
      const particles = createParticles(containerRef.current, 10, (i) => {
        const particle = document.createElement('div')
        particle.className = styles.bookmarkMini
        const angle = (i * 36 - 90) * (Math.PI / 180)
        const distance = 28 + Math.random() * 22
        particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`)
        particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`)
        particle.style.setProperty('--delay', `${i * 20}ms`)
        particle.style.setProperty('--color', colors[i % colors.length])
        return particle
      })
      removeParticles(particles, 800)
    }

    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div ref={containerRef} className={cn('relative inline-flex items-center justify-center', className)}>
      <button
        onClick={handleClick}
        className={cn(
          'relative p-3 rounded-full transition-all duration-200',
          'hover:bg-amber-50 active:scale-90',
          isAnimating && styles.bookmarkFloat
        )}
      >
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-200',
            isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// Export All
// ============================================

export const BookmarkButtonVariants = {
  PageFold: BookmarkPageFold,
  Stamp: BookmarkStamp,
  RibbonTie: BookmarkRibbonTie,
  FlagWave: BookmarkFlagWave,
  PaperClip: BookmarkPaperClip,
  StarMark: BookmarkStarMark,
  Highlight: BookmarkHighlight,
  AnchorDrop: BookmarkAnchorDrop,
  PinDrop: BookmarkPinDrop,
  Tape: BookmarkTape,
  SealStamp: BookmarkSealStamp,
  Sticker: BookmarkSticker,
  ShootingStar: BookmarkShootingStar,
  InkDrop: BookmarkInkDrop,
  MagicLink: BookmarkMagicLink,
  // 16-45 추가
  FoldPop: BookmarkFoldPop,
  TabFlip: BookmarkTabFlip,
  MarkerDrop: BookmarkMarkerDrop,
  LabelSwing: BookmarkLabelSwing,
  BookOpen: BookmarkBookOpen,
  NoteFlip: BookmarkNoteFlip,
  TagWiggle: BookmarkTagWiggle,
  CardPop: BookmarkCardPop,
  ClipSwing: BookmarkClipSwing,
  PinBounce: BookmarkPinBounce,
  SaveSlide: BookmarkSaveSlide,
  MarkPush: BookmarkMarkPush,
  FlagRaise: BookmarkFlagRaise,
  RibbonTwist: BookmarkRibbonTwist,
  Glow: BookmarkGlow,
  PageTurn: BookmarkPageTurn,
  TabSlide: BookmarkTabSlide,
  CornerFold: BookmarkCornerFold,
  StampPress: BookmarkStampPress,
  SealMark: BookmarkSealMark,
  ClipAttach: BookmarkClipAttach,
  PaperPush: BookmarkPaperPush,
  FoldReveal: BookmarkFoldReveal,
  TagDangle: BookmarkTagDangle,
  RibbonWrap: BookmarkRibbonWrap,
  ArchiveDrop: BookmarkArchiveDrop,
  IndexSlide: BookmarkIndexSlide,
  NotchClick: BookmarkNotchClick,
  CornerPeel: BookmarkCornerPeel,
  Float: BookmarkFloat,
}
