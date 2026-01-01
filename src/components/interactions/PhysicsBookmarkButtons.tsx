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

// ============================================
// 11. Nebula Glow - 성운 글로우
// 성운처럼 여러 색이 섞인 글로우
// ============================================

export function BookmarkNebulaGlow({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.nebulaGlowLayer, styles.nebula1, isAnimating && styles.nebulaExpand)} />
      <div className={cn(styles.nebulaGlowLayer, styles.nebula2, isAnimating && styles.nebulaExpand)} />
      <div className={cn(styles.nebulaCore, isBookmarked && styles.nebulaCoreActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.nebulaPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.nebulaIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 12. Pixie Dust - 픽시 가루
// 작은 픽시 가루가 흩날림
// ============================================

export function BookmarkPixieDust({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showDust, setShowDust] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowDust(true)
      setTimeout(() => setShowDust(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showDust && (
        <>
          <div className={cn(styles.pixieDust, styles.pd1)} />
          <div className={cn(styles.pixieDust, styles.pd2)} />
          <div className={cn(styles.pixieDust, styles.pd3)} />
          <div className={cn(styles.pixieDust, styles.pd4)} />
          <div className={cn(styles.pixieDust, styles.pd5)} />
          <div className={cn(styles.pixieDust, styles.pd6)} />
          <div className={cn(styles.pixieDust, styles.pd7)} />
          <div className={cn(styles.pixieDust, styles.pd8)} />
        </>
      )}
      <div className={cn(styles.pixieGlow, isBookmarked && styles.pixieGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.pixiePulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.pixieIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 13. Enchanted Scroll - 마법 두루마리
// 두루마리가 펼쳐지는 효과
// ============================================

export function BookmarkEnchantedScroll({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.scrollTop, isAnimating && styles.scrollUnfurl)} />
      <div className={cn(styles.scrollBottom, isAnimating && styles.scrollUnfurl)} />
      <div className={cn(styles.scrollGlow, isBookmarked && styles.scrollGlowActive)} />
      {isAnimating && <div className={styles.scrollSparkle}>✦</div>}

      <button className={cn(styles.magicButton, isAnimating && styles.scrollPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.scrollIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 14. Starfall - 별 떨어짐
// 별들이 위에서 떨어지는 효과
// ============================================

export function BookmarkStarfall({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showStars, setShowStars] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowStars(true)
      setTimeout(() => setShowStars(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showStars && (
        <div className={styles.starfallContainer}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={styles.fallingStar} style={{
              '--delay': `${i * 0.08}s`,
              '--x': `${(i % 4) * 25 - 37.5}%`
            } as React.CSSProperties}>★</div>
          ))}
        </div>
      )}
      <div className={cn(styles.starfallGlow, isBookmarked && styles.starfallGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.starfallPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.starfallIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 15. Fairy Circle - 요정의 원
// 회전하는 마법의 원
// ============================================

export function BookmarkFairyCircle({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.fairyCircleOuter, isAnimating && styles.circleRotate)}>
        <span>✦</span><span>✧</span><span>✦</span><span>✧</span>
      </div>
      <div className={cn(styles.fairyCircleInner, isAnimating && styles.circleRotateReverse)}>
        <span>·</span><span>·</span><span>·</span><span>·</span>
      </div>
      <div className={cn(styles.circleGlow, isBookmarked && styles.circleGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.circlePulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.circleIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 16. Celestial Mark - 천상의 마크
// 빛으로 된 마크가 새겨지는 효과
// ============================================

export function BookmarkCelestialMark({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMark, setShowMark] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowMark(true)
      setTimeout(() => setShowMark(false), 800)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showMark && (
        <div className={styles.celestialMark}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className={styles.celestialRay} style={{
              transform: `rotate(${i * 60}deg)`
            }} />
          ))}
        </div>
      )}
      <div className={cn(styles.celestialMarkGlow, isBookmarked && styles.celestialMarkGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.celestialMarkPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.celestialMarkIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 17. Mystic Veil - 신비로운 베일
// 신비로운 베일이 감싸는 효과
// ============================================

export function BookmarkMysticVeil({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 1000)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.mysticVeil, styles.veil1, isAnimating && styles.veilWrap)} />
      <div className={cn(styles.mysticVeil, styles.veil2, isAnimating && styles.veilWrap)} />
      <div className={cn(styles.veilGlow, isBookmarked && styles.veilGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.veilPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.veilIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 18. Diamond Halo - 다이아몬드 후광
// 다이아몬드 같은 날카로운 후광
// ============================================

export function BookmarkDiamondHalo({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showHalo, setShowHalo] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowHalo(true)
      setTimeout(() => setShowHalo(false), 600)
    }
    setTimeout(() => setIsAnimating(false), 600)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showHalo && (
        <>
          <div className={cn(styles.diamondHalo, styles.halo1)}>✧</div>
          <div className={cn(styles.diamondHalo, styles.halo2)}>✧</div>
          <div className={cn(styles.diamondHalo, styles.halo3)}>✧</div>
          <div className={cn(styles.diamondHalo, styles.halo4)}>✧</div>
        </>
      )}
      <div className={cn(styles.haloGlow, isBookmarked && styles.haloGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.haloPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.haloIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 19. Comet Mark - 혜성 마크
// 혜성처럼 꼬리가 있는 마크
// ============================================

export function BookmarkCometMark({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.cometMarkTail, isAnimating && styles.cometMarkTailActive)} />
      <div className={cn(styles.cometMarkHead, isAnimating && styles.cometMarkHeadActive)} />
      <div className={cn(styles.cometMarkGlow, isBookmarked && styles.cometMarkGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.cometMarkPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.cometMarkIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 20. Moonlit - 달빛 비침
// 부드러운 달빛이 비치는 효과
// ============================================

export function BookmarkMoonlit({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMoonlight, setShowMoonlight] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowMoonlight(true)
      setTimeout(() => setShowMoonlight(false), 800)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showMoonlight && (
        <div className={styles.moonlitBeams}>
          <div className={cn(styles.moonlitBeam, styles.mb1)} />
          <div className={cn(styles.moonlitBeam, styles.mb2)} />
          <div className={cn(styles.moonlitBeam, styles.mb3)} />
        </div>
      )}
      <div className={cn(styles.moonlitGlow, isBookmarked && styles.moonlitGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.moonlitPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.moonlitIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 21. Forest Spirit - 숲의 정령
// 숲 정령처럼 자연의 빛
// ============================================

export function BookmarkForestSpirit({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showLeaves, setShowLeaves] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowLeaves(true)
      setTimeout(() => setShowLeaves(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showLeaves && (
        <>
          <div className={cn(styles.spiritLeaf, styles.sl1)}>🍃</div>
          <div className={cn(styles.spiritLeaf, styles.sl2)}>🌿</div>
          <div className={cn(styles.spiritLeaf, styles.sl3)}>🍃</div>
          <div className={cn(styles.spiritLeaf, styles.sl4)}>🌿</div>
        </>
      )}
      <div className={cn(styles.spiritGlow, isBookmarked && styles.spiritGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.spiritPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.spiritIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 22. Shimmer Wave - 반짝이 파도
// 파도처럼 반짝이가 퍼짐
// ============================================

export function BookmarkShimmerWave({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.shimmerWave, styles.sw1, isAnimating && styles.shimmerExpand)} />
      <div className={cn(styles.shimmerWave, styles.sw2, isAnimating && styles.shimmerExpand)} />
      <div className={cn(styles.shimmerWave, styles.sw3, isAnimating && styles.shimmerExpand)} />
      <div className={cn(styles.shimmerGlow, isBookmarked && styles.shimmerGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.shimmerPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.shimmerIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 23. Fairy Tale - 동화 이야기
// 동화책처럼 마법의 페이지
// ============================================

export function BookmarkFairyTale({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.talePageLeft, isAnimating && styles.pageFlip)} />
      <div className={cn(styles.talePageRight, isAnimating && styles.pageFlip)} />
      <div className={cn(styles.taleGlow, isBookmarked && styles.taleGlowActive)} />
      {isAnimating && <div className={styles.taleSparkle}>✨</div>}

      <button className={cn(styles.magicButton, isAnimating && styles.talePulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.taleIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 24. Stardust Cloud - 별먼지 구름
// 별먼지로 된 구름 효과
// ============================================

export function BookmarkStardustCloud({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showCloud, setShowCloud] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowCloud(true)
      setTimeout(() => setShowCloud(false), 1000)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showCloud && (
        <div className={styles.stardustCloud}>
          {[...Array(10)].map((_, i) => (
            <div key={i} className={styles.cloudDust} style={{
              '--angle': `${i * 36}deg`,
              '--delay': `${i * 0.05}s`
            } as React.CSSProperties} />
          ))}
        </div>
      )}
      <div className={cn(styles.cloudGlow, isBookmarked && styles.cloudGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.cloudPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.cloudIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 25. Mirror Realm - 거울 영역
// 거울에 반사되는 듯한 효과
// ============================================

export function BookmarkMirrorRealm({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.realmReflect, styles.rrTop, isAnimating && styles.realmReflectActive)} />
      <div className={cn(styles.realmReflect, styles.rrBottom, isAnimating && styles.realmReflectActive)} />
      <div className={cn(styles.realmFrame, isAnimating && styles.realmFrameGlow)} />
      <div className={cn(styles.realmGlow, isBookmarked && styles.realmGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.realmPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.realmIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 26. Dream Mist - 꿈 안개
// 몽환적인 안개 효과
// ============================================

export function BookmarkDreamMist({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 900)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.dreamMist, styles.dm1, isAnimating && styles.mistFloat)} />
      <div className={cn(styles.dreamMist, styles.dm2, isAnimating && styles.mistFloat)} />
      <div className={cn(styles.dreamMist, styles.dm3, isAnimating && styles.mistFloat)} />
      <div className={cn(styles.dreamMistGlow, isBookmarked && styles.dreamMistGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.dreamMistPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.dreamMistIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 27. Sunray Mark - 태양광 마크
// 따뜻한 태양광 효과
// ============================================

export function BookmarkSunrayMark({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showRays, setShowRays] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowRays(true)
      setTimeout(() => setShowRays(false), 700)
    }
    setTimeout(() => setIsAnimating(false), 700)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showRays && (
        <div className={styles.sunrayBurst}>
          {[...Array(12)].map((_, i) => (
            <div key={i} className={styles.sunrayLine} style={{
              transform: `rotate(${i * 30}deg)`
            }} />
          ))}
        </div>
      )}
      <div className={cn(styles.sunrayCore, isAnimating && styles.sunrayCoreActive)} />
      <div className={cn(styles.sunrayGlow, isBookmarked && styles.sunrayGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.sunrayPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.sunrayIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 28. Crystal Heart - 크리스탈 하트
// 크리스탈 하트가 떠오르는 효과
// ============================================

export function BookmarkCrystalHeart({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showHearts, setShowHearts] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    const newBookmarked = !isBookmarked
    setIsBookmarked(newBookmarked)
    if (newBookmarked) {
      setShowHearts(true)
      setTimeout(() => setShowHearts(false), 900)
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      {showHearts && (
        <>
          <div className={cn(styles.crystalHeart, styles.ch1)}>💜</div>
          <div className={cn(styles.crystalHeart, styles.ch2)}>💜</div>
          <div className={cn(styles.crystalHeart, styles.ch3)}>💜</div>
        </>
      )}
      <div className={cn(styles.crystalHeartGlow, isBookmarked && styles.crystalHeartGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.crystalHeartPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.crystalHeartIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 29. Galaxy Mark - 은하 마크
// 은하수처럼 휘감기는 효과
// ============================================

export function BookmarkGalaxyMark({ className }: PhysicsButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = useCallback(() => {
    if (isAnimating) return
    setIsAnimating(true)
    setIsBookmarked(!isBookmarked)
    setTimeout(() => setIsAnimating(false), 1000)
  }, [isBookmarked, isAnimating])

  return (
    <div className={cn(styles.magicButtonContainer, className)} onClick={handleClick}>
      <div className={cn(styles.galaxySpiral, isAnimating && styles.galaxySpiralActive)} />
      <div className={cn(styles.galaxyStars, isAnimating && styles.galaxyStarsActive)}>
        <span>✦</span><span>✧</span><span>✦</span>
      </div>
      <div className={cn(styles.galaxyGlow, isBookmarked && styles.galaxyGlowActive)} />

      <button className={cn(styles.magicButton, isAnimating && styles.galaxyPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.galaxyIcon
        )} />
      </button>
    </div>
  )
}

// ============================================
// 30. Phoenix Feather - 불사조 깃털
// 불사조 깃털처럼 따뜻한 빛
// ============================================

export function BookmarkPhoenixFeather({ className }: PhysicsButtonProps) {
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
      <div className={cn(styles.phoenixFlame, styles.pf1, isAnimating && styles.phoenixBurn)} />
      <div className={cn(styles.phoenixFlame, styles.pf2, isAnimating && styles.phoenixBurn)} />
      <div className={cn(styles.phoenixFlame, styles.pf3, isAnimating && styles.phoenixBurn)} />
      <div className={cn(styles.phoenixGlow, isBookmarked && styles.phoenixGlowActive)} />
      {isBookmarked && <div className={styles.phoenixEmber} />}

      <button className={cn(styles.magicButton, isAnimating && styles.phoenixPulse)}>
        <Bookmark className={cn(
          'w-6 h-6 transition-all duration-300',
          isBookmarked ? 'fill-violet-400 text-violet-400' : 'text-gray-400',
          isAnimating && styles.phoenixIcon
        )} />
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
  // New 20 buttons (11-30)
  NebulaGlow: BookmarkNebulaGlow,
  PixieDust: BookmarkPixieDust,
  EnchantedScroll: BookmarkEnchantedScroll,
  Starfall: BookmarkStarfall,
  FairyCircle: BookmarkFairyCircle,
  CelestialMark: BookmarkCelestialMark,
  MysticVeil: BookmarkMysticVeil,
  DiamondHalo: BookmarkDiamondHalo,
  CometMark: BookmarkCometMark,
  Moonlit: BookmarkMoonlit,
  ForestSpirit: BookmarkForestSpirit,
  ShimmerWave: BookmarkShimmerWave,
  FairyTale: BookmarkFairyTale,
  StardustCloud: BookmarkStardustCloud,
  MirrorRealm: BookmarkMirrorRealm,
  DreamMist: BookmarkDreamMist,
  SunrayMark: BookmarkSunrayMark,
  CrystalHeart: BookmarkCrystalHeart,
  GalaxyMark: BookmarkGalaxyMark,
  PhoenixFeather: BookmarkPhoenixFeather,
}
