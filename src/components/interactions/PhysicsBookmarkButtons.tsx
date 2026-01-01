'use client'

import { useState, useCallback } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import styles from './physics.module.css'

interface PhysicsButtonProps {
  className?: string
}

// ============================================
// 1. Magic Bookmark - 마법 책갈피
// 마법의 빛이 책갈피를 감싸며 빛남
// ============================================

export function BookmarkMagicBookmark({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 마법 글로우 */}
      <div className={cn(
        styles.magicBookmarkGlow,
        isBookmarked && styles.magicBookmarkGlowActive
      )} />

      {/* 마법 입자 */}
      {isAnimating && (
        <>
          <div className={cn(styles.magicParticle, styles.mp1)} />
          <div className={cn(styles.magicParticle, styles.mp2)} />
          <div className={cn(styles.magicParticle, styles.mp3)} />
          <div className={cn(styles.magicParticle, styles.mp4)} />
        </>
      )}

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.magicBookmarkPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.magicBookmarkIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 2. Enchant Seal - 마법진
// 마법진이 나타나며 빛나는 효과
// ============================================

export function BookmarkEnchantSeal({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showSeal, setShowSeal] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setShowSeal(true)
      setTimeout(() => setShowSeal(false), 900)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 마법진 */}
      <div className={cn(
        styles.enchantSeal,
        showSeal && styles.enchantSealActive
      )}>
        <div className={styles.sealRing} />
        <div className={cn(styles.sealRing, styles.sealRing2)} />
      </div>

      {/* 마법 문양 */}
      {showSeal && (
        <div className={styles.sealRunes}>✧ ☆ ✦</div>
      )}

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.enchantPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.enchantIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 3. Fairy Wing - 요정 날개
// 요정 날개가 펄럭이는 효과
// ============================================

export function BookmarkFairyWing({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 날개 */}
      <div className={cn(
        styles.fairyWingLeft,
        isAnimating && styles.wingFlutter
      )} />
      <div className={cn(
        styles.fairyWingRight,
        isAnimating && styles.wingFlutter
      )} />

      {/* 반짝이는 가루 */}
      {isBookmarked && (
        <div className={styles.wingSparkle} />
      )}

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.wingPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.wingIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 4. Stardust Trail - 별가루 자취
// 별가루가 흩뿌려지는 자취 효과
// ============================================

export function BookmarkStardustTrail({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showTrail, setShowTrail] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setShowTrail(true)
      setTimeout(() => setShowTrail(false), 1000)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 별가루 자취 */}
      {showTrail && (
        <>
          <div className={cn(styles.stardustDot, styles.sd1)} />
          <div className={cn(styles.stardustDot, styles.sd2)} />
          <div className={cn(styles.stardustDot, styles.sd3)} />
          <div className={cn(styles.stardustDot, styles.sd4)} />
          <div className={cn(styles.stardustDot, styles.sd5)} />
          <div className={cn(styles.stardustDot, styles.sd6)} />
        </>
      )}

      {/* 글로우 */}
      <div className={cn(
        styles.stardustGlow,
        isBookmarked && styles.stardustGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.stardustPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.stardustIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 5. Light Beam - 빛줄기
// 위에서 빛줄기가 내려오는 효과
// ============================================

export function BookmarkLightBeam({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showBeam, setShowBeam] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setShowBeam(true)
      setTimeout(() => setShowBeam(false), 700)
    }

    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 빛줄기 */}
      {showBeam && (
        <div className={styles.lightBeam} />
      )}

      {/* 빛 후광 */}
      <div className={cn(
        styles.beamGlow,
        isBookmarked && styles.beamGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.beamPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.beamIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 6. Crystal Mark - 크리스탈 마크
// 크리스탈처럼 빛나는 마크 효과
// ============================================

export function BookmarkCrystalMark({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 크리스탈 면 */}
      <div className={cn(
        styles.crystalFacets,
        isAnimating && styles.crystalShine
      )}>
        <div className={styles.facet} />
        <div className={styles.facet} />
        <div className={styles.facet} />
      </div>

      {/* 프리즘 글로우 */}
      <div className={cn(
        styles.crystalMarkGlow,
        isBookmarked && styles.crystalMarkGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.crystalMarkPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.crystalMarkIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 7. Glow Ribbon - 빛나는 리본
// 부드럽게 빛나는 리본 효과
// ============================================

export function BookmarkGlowRibbon({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 빛나는 리본 */}
      <div className={cn(
        styles.glowRibbon,
        isBookmarked && styles.glowRibbonActive,
        isAnimating && styles.ribbonWave
      )} />

      {/* 리본 반짝임 */}
      {isBookmarked && (
        <div className={styles.ribbonSparkle} />
      )}

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.glowRibbonPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.glowRibbonIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 8. Magic Rune - 룬 문자
// 마법 룬 문자가 나타나는 효과
// ============================================

export function BookmarkMagicRune({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showRunes, setShowRunes] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setShowRunes(true)
      setTimeout(() => setShowRunes(false), 900)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 룬 문자들 */}
      {showRunes && (
        <>
          <div className={cn(styles.runeChar, styles.rune1)}>ᚱ</div>
          <div className={cn(styles.runeChar, styles.rune2)}>ᚢ</div>
          <div className={cn(styles.runeChar, styles.rune3)}>ᚾ</div>
          <div className={cn(styles.runeChar, styles.rune4)}>ᛖ</div>
        </>
      )}

      {/* 마법 서클 */}
      <div className={cn(
        styles.runeCircle,
        isAnimating && styles.runeCircleSpin
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.runePulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.runeIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 9. Firefly Dance - 반딧불이 춤
// 반딧불이가 춤추는 효과
// ============================================

export function BookmarkFireflyDance({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showFireflies, setShowFireflies] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)

    if (newBookmarked) {
      setShowFireflies(true)
      setTimeout(() => setShowFireflies(false), 1200)
    }

    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 반딧불이 */}
      {showFireflies && (
        <>
          <div className={cn(styles.firefly, styles.ff1)} />
          <div className={cn(styles.firefly, styles.ff2)} />
          <div className={cn(styles.firefly, styles.ff3)} />
          <div className={cn(styles.firefly, styles.ff4)} />
          <div className={cn(styles.firefly, styles.ff5)} />
        </>
      )}

      {/* 부드러운 글로우 */}
      <div className={cn(
        styles.fireflyGlow,
        isBookmarked && styles.fireflyGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.fireflyPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.fireflyIcon
          )}
        />
      </button>
    </div>
  )
}

// ============================================
// 10. Dream Catcher - 드림캐처
// 드림캐처처럼 빛이 엮이는 효과
// ============================================

export function BookmarkDreamCatcher({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {/* 드림캐처 웹 */}
      <div className={cn(
        styles.dreamWeb,
        isAnimating && styles.dreamWebSpin
      )}>
        <div className={styles.webLine} />
        <div className={styles.webLine} />
        <div className={styles.webLine} />
      </div>

      {/* 깃털 */}
      {isBookmarked && (
        <>
          <div className={cn(styles.dreamFeather, styles.feather1)} />
          <div className={cn(styles.dreamFeather, styles.feather2)} />
        </>
      )}

      {/* 중심 글로우 */}
      <div className={cn(
        styles.dreamGlow,
        isBookmarked && styles.dreamGlowActive
      )} />

      <button className={cn(
        styles.magicButton,
        isAnimating && styles.dreamPulse
      )}>
        <Bookmark
          className={cn(
            'w-6 h-6 transition-all duration-300',
            isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
            isAnimating && styles.dreamIcon
          )}
        />
      </button>
    </div>
  )
}

// Export all variants
export const PhysicsBookmarkButtons = {
  MagicBookmark: BookmarkMagicBookmark,
  EnchantSeal: BookmarkEnchantSeal,
  FairyWing: BookmarkFairyWing,
  StardustTrail: BookmarkStardustTrail,
  LightBeam: BookmarkLightBeam,
  CrystalMark: BookmarkCrystalMark,
  GlowRibbon: BookmarkGlowRibbon,
  MagicRune: BookmarkMagicRune,
  FireflyDance: BookmarkFireflyDance,
  DreamCatcher: BookmarkDreamCatcher,
}
