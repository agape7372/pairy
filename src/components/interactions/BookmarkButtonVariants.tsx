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
}
